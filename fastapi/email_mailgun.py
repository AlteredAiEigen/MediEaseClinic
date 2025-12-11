"""
Mailgun Email Processing Helper
================================

This standalone utility bundles together everything required to prototype the
incoming-email workflow for patient aliases.  It provides:

1.  A lightweight FastAPI webhook endpoint you can run locally (or on a test
    server) to emulate Mailgun's `routes` / `webhooks` delivery.
2.  Helpers to register patient aliases (alias → patient metadata) for quick
    testing without touching the production database.
3.  Processing logic that, whenever Mailgun posts an inbound message, will:
       a. Persist every attachment to a per-patient folder, and
       b. Forward the attachments to the patient’s actual email address using
          Mailgun’s “Send Email” API.

The webhook signature verification is optional.  If you do have the signing key
configured, the script will enforce it.  Otherwise it gracefully skips the
check, allowing you to mock webhooks during development.

CLI usage (examples):

    # 1) Register an alias for a patient (alias defaults to <patientId>@DOMAIN)
    python email_mailgun.py register-alias --patient-id P001 \\
        --patient-email john.doe@example.com --patient-name "John Doe"

    # 2) Run the webhook receiver (listens for Mailgun inbound webhooks)
    python email_mailgun.py serve-webhook --port 8050

The webhook endpoint will be available at:
    http://<host>:<port>/api/webhooks/mailgun

"""

from __future__ import annotations

import argparse
import asyncio
import hmac
import hashlib
import json
import os
import textwrap
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import requests
from fastapi import FastAPI, Form, HTTPException, Request, UploadFile
from fastapi.responses import JSONResponse
import uvicorn


# ------------------------------------------------------------------------------
# Configuration
# ------------------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "mailgun_data"
DATA_DIR.mkdir(exist_ok=True)

REPORTS_ROOT = DATA_DIR / "patient_reports"
REPORTS_ROOT.mkdir(exist_ok=True, parents=True)

ALIAS_REGISTRY_PATH = DATA_DIR / "alias_registry.json"


def _env(name: str, default: Optional[str] = None) -> Optional[str]:
    return os.getenv(name, default)


MAILGUN_API_KEY = _env("MAILGUN_API_KEY", "")
MAILGUN_DOMAIN = _env("MAILGUN_DOMAIN", "")
MAILGUN_API_BASE_URL = _env("MAILGUN_API_BASE_URL", "https://api.mailgun.net/v3")
MAILGUN_WEBHOOK_SIGNING_KEY = _env("MAILGUN_WEBHOOK_SIGNING_KEY", "")
TEST_RECIPIENT_EMAIL = _env("TEST_RECIPIENT_EMAIL", "")

NOTIFY_FROM_ADDRESS = _env(
    "MAILGUN_NOTIFY_FROM_ADDRESS",
    f"Mediease Clinic <reports@{MAILGUN_DOMAIN or 'example.com'}>",
)


# ------------------------------------------------------------------------------
# Data models & alias registry helpers
# ------------------------------------------------------------------------------
@dataclass
class PatientAliasMeta:
    patient_id: str
    patient_email: str
    patient_name: str
    alias: str

    @property
    def report_folder(self) -> Path:
        folder = REPORTS_ROOT / self.patient_id
        folder.mkdir(exist_ok=True, parents=True)
        return folder


def load_alias_registry() -> Dict[str, PatientAliasMeta]:
    if not ALIAS_REGISTRY_PATH.exists():
        return {}
    raw = json.loads(ALIAS_REGISTRY_PATH.read_text())
    registry: Dict[str, PatientAliasMeta] = {}
    for alias, entry in raw.items():
        registry[alias.lower()] = PatientAliasMeta(
            patient_id=entry["patient_id"],
            patient_email=entry["patient_email"],
            patient_name=entry.get("patient_name", entry["patient_id"]),
            alias=alias.lower(),
        )
    return registry


def save_alias_registry(registry: Dict[str, PatientAliasMeta]) -> None:
    ALIAS_REGISTRY_PATH.write_text(
        json.dumps(
            {
                alias: {
                    "patient_id": meta.patient_id,
                    "patient_email": meta.patient_email,
                    "patient_name": meta.patient_name,
                }
                for alias, meta in registry.items()
            },
            indent=2,
        )
    )


def register_patient_alias(
    patient_id: str,
    patient_email: str,
    patient_name: Optional[str] = None,
    alias: Optional[str] = None,
) -> PatientAliasMeta:
    """Create or update an alias entry for a patient."""
    if not MAILGUN_DOMAIN and not alias:
        raise RuntimeError(
            "MAILGUN_DOMAIN environment variable is required unless you provide "
            "an explicit alias."
        )

    alias_email = alias or f"{patient_id.lower()}@{MAILGUN_DOMAIN}"
    alias_email = alias_email.lower()

    registry = load_alias_registry()
    meta = PatientAliasMeta(
        patient_id=patient_id,
        patient_email=patient_email,
        patient_name=patient_name or patient_id,
        alias=alias_email,
    )
    registry[alias_email] = meta
    save_alias_registry(registry)
    return meta


def resolve_alias(alias: str) -> Optional[PatientAliasMeta]:
    registry = load_alias_registry()
    return registry.get(alias.lower())


# ------------------------------------------------------------------------------
# Attachment persistence & notification email helpers
# ------------------------------------------------------------------------------
def _sanitize_filename(name: str) -> str:
    safe = "".join(ch for ch in name if ch.isalnum() or ch in {"-", "_", "."})
    return safe or "attachment.bin"


async def persist_attachments(
    meta: PatientAliasMeta, attachments: List[UploadFile]
) -> List[Path]:
    """
    Store incoming attachments under
    `<DATA_DIR>/patient_reports/<patient_id>/<timestamp>_<filename>`.
    """
    saved_paths: List[Path] = []
    timestamp = int(time.time())
    for idx, upload in enumerate(attachments, start=1):
        filename = upload.filename or f"attachment-{idx}.bin"
        safe_name = f"{timestamp}_{_sanitize_filename(filename)}"
        destination = meta.report_folder / safe_name
        destination.write_bytes(await upload.read())
        saved_paths.append(destination)
    return saved_paths


def send_email_via_mailgun(
    to_address: str,
    subject: str,
    text_body: str,
    attachments: Optional[List[Path]] = None,
) -> requests.Response:
    if not MAILGUN_API_KEY or not MAILGUN_DOMAIN:
        raise RuntimeError(
            "Missing Mailgun configuration. Ensure MAILGUN_API_KEY and "
            "MAILGUN_DOMAIN environment variables are set."
        )

    url = f"{MAILGUN_API_BASE_URL.rstrip('/')}/{MAILGUN_DOMAIN}/messages"
    files: Optional[List[Tuple[str, Tuple[str, bytes]]]] = None
    if attachments:
        files = [
            ("attachment", (path.name, path.read_bytes()))
            for path in attachments
        ]

    response = requests.post(
        url,
        auth=("api", MAILGUN_API_KEY),
        data={
            "from": NOTIFY_FROM_ADDRESS,
            "to": to_address,
            "subject": subject,
            "text": text_body,
        },
        files=files,
        timeout=30,
    )
    if response.status_code >= 400:
        raise RuntimeError(
            f"Mailgun send failed ({response.status_code}): {response.text}"
        )
    return response


def notify_patient_of_report(
    meta: PatientAliasMeta,
    subject: str,
    saved_paths: List[Path],
    sender: str,
) -> Dict[str, str]:
    body = textwrap.dedent(
        f"""
        Hi {meta.patient_name},

        We have received new documents sent by "{sender}" to your Mediease alias.
        These files have been securely stored in your patient record.

        Summary:
            • Patient ID : {meta.patient_id}
            • Attachments: {', '.join(path.name for path in saved_paths) or 'None'}

        If you believe this email was sent in error, please contact the clinic.

        — Mediease Clinic
        """
    ).strip()

    response = send_email_via_mailgun(
        to_address=meta.patient_email,
        subject=f"[Mediease] {subject or 'New report received'}",
        text_body=body,
        attachments=saved_paths,
    )
    return {"id": response.json().get("id", ""), "status": "queued"}


# ------------------------------------------------------------------------------
# Webhook implementation
# ------------------------------------------------------------------------------
app = FastAPI(title="Mailgun Email Processor")


def verify_signature(token: str, timestamp: str, signature: str) -> bool:
    if not MAILGUN_WEBHOOK_SIGNING_KEY:
        return True  # allow mock webhooks when signing key absent

    signing_string = f"{timestamp}{token}".encode()
    expected = hmac.new(
        MAILGUN_WEBHOOK_SIGNING_KEY.encode(),
        signing_string,
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, signature)


async def process_incoming_email(form: Dict[str, str], files: Dict[str, UploadFile]):
    recipient_alias = form.get("recipient")
    sender = form.get("sender", "Unknown Sender")
    subject = form.get("subject", "New Patient Report")

    if not recipient_alias:
        raise HTTPException(status_code=400, detail="Missing recipient alias")

    meta = resolve_alias(recipient_alias)
    if not meta:
        raise HTTPException(
            status_code=404,
            detail=f"Alias {recipient_alias} not registered. Register via CLI first.",
        )

    # Collect attachments from payload (Mailgun uses attachment-{n})
    attachments: List[UploadFile] = []
    attachment_total = int(form.get("attachment-count", "0") or 0)
    for idx in range(1, attachment_total + 1):
        upload = files.get(f"attachment-{idx}")
        if upload:
            attachments.append(upload)

    saved_paths = await persist_attachments(meta, attachments)

    notify_result = notify_patient_of_report(meta, subject, saved_paths, sender)

    return {
        "patient_id": meta.patient_id,
        "patient_email": meta.patient_email,
        "alias": meta.alias,
        "sender": sender,
        "subject": subject,
        "attachments_saved": [path.name for path in saved_paths],
        "mailgun_message_id": notify_result["id"],
    }


@app.post("/api/webhooks/mailgun")
async def mailgun_webhook_endpoint(
    request: Request,
    signature: str = Form(default=""),
    token: str = Form(default=""),
    timestamp: str = Form(default=""),
):
    if not verify_signature(token, timestamp, signature):
        raise HTTPException(status_code=401, detail="Invalid webhook signature")

    form = await request.form()
    # FastAPI's immutable multi-dict → convert to plain dicts
    form_data = dict(form)
    files = {key: value for key, value in form.multi_items() if isinstance(value, UploadFile)}
    summary = await process_incoming_email(form_data, files)
    return JSONResponse({"success": True, "data": summary})


# ------------------------------------------------------------------------------
# CLI interface
# ------------------------------------------------------------------------------
def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Mailgun email processing helper utilities"
    )
    subparsers = parser.add_subparsers(dest="command")

    register_parser = subparsers.add_parser(
        "register-alias", help="Register or update a patient email alias"
    )
    register_parser.add_argument("--patient-id", required=True)
    register_parser.add_argument("--patient-email", required=True)
    register_parser.add_argument("--patient-name", required=False, default=None)
    register_parser.add_argument(
        "--alias",
        required=False,
        help="Override alias (defaults to <patient-id>@MAILGUN_DOMAIN)",
    )

    subparsers.add_parser(
        "list-aliases",
        help="Show the current alias registry entries",
    )

    serve_parser = subparsers.add_parser(
        "serve-webhook", help="Run webhook receiver (FastAPI + Uvicorn)"
    )
    serve_parser.add_argument("--host", default="0.0.0.0")
    serve_parser.add_argument("--port", type=int, default=8050)

    return parser


def cmd_register_alias(args: argparse.Namespace) -> None:
    meta = register_patient_alias(
        patient_id=args.patient_id,
        patient_email=args.patient_email,
        patient_name=args.patient_name,
        alias=args.alias,
    )
    print("✅ Alias registered/updated successfully!")
    print(f"   -> Patient ID   : {meta.patient_id}")
    print(f"   -> Patient Name : {meta.patient_name}")
    print(f"   -> Patient Email: {meta.patient_email}")
    print(f"   -> Alias        : {meta.alias}")
    print(f"   -> Report folder: {meta.report_folder}")


def cmd_list_aliases() -> None:
    registry = load_alias_registry()
    if not registry:
        print("No aliases registered yet.")
        return
    print("Registered patient aliases:")
    for alias, meta in registry.items():
        print(
            f" - {alias} -> patient_id={meta.patient_id}, "
            f"email={meta.patient_email}, name={meta.patient_name}"
        )


def cmd_serve_webhook(args: argparse.Namespace) -> None:
    print(
        textwrap.dedent(
            f"""
            Starting webhook receiver...
              Host      : {args.host}
              Port      : {args.port}
              Endpoint  : http://{args.host}:{args.port}/api/webhooks/mailgun
              Reports   : {REPORTS_ROOT}

            (Hint) Use 'register-alias' before testing inbound messages.
            """
        ).strip()
    )
    uvicorn.run(app, host=args.host, port=args.port)


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    if args.command == "register-alias":
        cmd_register_alias(args)
    elif args.command == "list-aliases":
        cmd_list_aliases()
    elif args.command == "serve-webhook":
        cmd_serve_webhook(args)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()


