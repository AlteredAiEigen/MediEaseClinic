"""
Standalone Mailgun Patient Email Alias Testing Utility

This script includes all credentials hardcoded for easy testing.
No environment variables required - just run it!

Usage examples:
1. Start webhook receiver (downloads attachments to ./webhook_downloads):
   python mailgun_test.py serve-webhook --port 8001

2. Send a test email with optional attachment to a patient alias:
   python mailgun_test.py send-email --alias P001@mediease.alteredai.care \
       --subject "CBC Results" --body "See attached" --attachment sample.pdf

Credentials are hardcoded for testing - ready to run immediately!
"""

from __future__ import annotations

import argparse
import hmac
import hashlib
import os
import sys
import textwrap
import time
from pathlib import Path
from typing import Optional, List, Dict, Any

import requests
from fastapi import FastAPI, HTTPException, Form, UploadFile, Request
from fastapi.responses import JSONResponse
import uvicorn


BASE_DIR = Path(__file__).resolve().parent
DOWNLOAD_DIR = BASE_DIR / "webhook_downloads"
DOWNLOAD_DIR.mkdir(exist_ok=True)

# Environment configuration
# Hardcoded credentials for testing (independent of .env)
MAILGUN_API_KEY = "ae61273b040f1f5b369c78eefbc66c71-e80d8b76-1373ffb5"
MAILGUN_DOMAIN = "mediease.alteredai.care"
# Hardcoded credentials for testing (independent of .env)
MAILGUN_API_BASE_URL = "https://api.mailgun.net/v3"
MAILGUN_WEBHOOK_SIGNING_KEY = "pubkey-4209da887c582073751d71b8f29f6c57"


def ensure_mailgun_config() -> None:
    missing = [
        name
        for name, value in [
            ("MAILGUN_API_KEY", MAILGUN_API_KEY),
            ("MAILGUN_DOMAIN", MAILGUN_DOMAIN),
        ]
        if not value
    ]
    if missing:
        raise RuntimeError(
            "Missing environment variables: "
            + ", ".join(missing)
            + ". Please update fastapi/.env"
        )


def verify_signature(token: str, timestamp: str, signature: str) -> bool:
    if not MAILGUN_WEBHOOK_SIGNING_KEY:
        return False
    signing_string = f"{timestamp}{token}".encode()
    digest = hmac.new(
        MAILGUN_WEBHOOK_SIGNING_KEY.encode(), signing_string, hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(digest, signature)


app = FastAPI(title="Mailgun Alias Test Webhook")


@app.post("/api/webhooks/mailgun")
async def handle_mailgun_webhook(
    request: Request,
    signature: str = Form(...),
    token: str = Form(...),
    timestamp: str = Form(...),
):
    """Process incoming Mailgun webhook, save attachments locally."""
    if not verify_signature(token, timestamp, signature):
        raise HTTPException(status_code=401, detail="Invalid webhook signature")

    form = await request.form()
    recipient = form.get("recipient")
    sender = form.get("sender")
    subject = form.get("subject")
    attachment_count = int(form.get("attachment-count", "0") or 0)

    saved_files: List[Dict[str, Any]] = []
    for idx in range(1, attachment_count + 1):
        upload: UploadFile = form.get(f"attachment-{idx}")  # type: ignore
        if not upload:
            continue
        timestamp_suffix = int(time.time())
        filename = upload.filename or f"attachment_{idx}.bin"
        safe_name = f"{timestamp_suffix}_{filename}"
        file_path = DOWNLOAD_DIR / safe_name
        content = await upload.read()
        file_path.write_bytes(content)
        saved_files.append(
            {
                "original_name": filename,
                "saved_path": str(file_path),
                "size_bytes": len(content),
            }
        )

    payload_summary = {
        "recipient": recipient,
        "sender": sender,
        "subject": subject,
        "attachment_count": attachment_count,
        "saved_files": saved_files,
    }

    return JSONResponse({"success": True, "data": payload_summary})


def send_test_email(
    alias: str,
    subject: str,
    body: str,
    attachment: Optional[str] = None,
    from_address: Optional[str] = None,
) -> None:
    """Send a test email (with optional attachment) to an alias via Mailgun."""
    ensure_mailgun_config()
    from_address = from_address or f"Lab Reports <noreply@{MAILGUN_DOMAIN}>"

    url = f"{MAILGUN_API_BASE_URL}/{MAILGUN_DOMAIN}/messages"
    data = {
        "from": from_address,
        "to": alias,
        "subject": subject,
        "text": body,
    }

    files = None
    if attachment:
        attachment_path = Path(attachment).resolve()
        if not attachment_path.exists():
            raise FileNotFoundError(f"Attachment not found: {attachment_path}")
        files = [
            (
                "attachment",
                (attachment_path.name, attachment_path.read_bytes()),
            )
        ]

    response = requests.post(
        url,
        auth=("api", MAILGUN_API_KEY),
        data=data,
        files=files,
        timeout=30,
    )
    if response.status_code != 200:
        raise RuntimeError(
            f"Mailgun send failed ({response.status_code}): {response.text}"
        )
    print("✅ Test email sent successfully!")
    print(f"   -> Alias: {alias}")
    print(f"   -> Subject: {subject}")
    if attachment:
        print(f"   -> Attachment: {attachment}")
    print(f"   -> Message ID: {response.json().get('id')}")


def run_webhook_server(host: str, port: int) -> None:
    """Run FastAPI webhook server via uvicorn."""
    print(
        textwrap.dedent(
            f"""
            Starting webhook server...
            Endpoint: http://{host}:{port}/api/webhooks/mailgun
            Downloads saved to: {DOWNLOAD_DIR}
            """
        ).strip()
    )
    uvicorn.run(app, host=host, port=port)


def build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Mailgun patient alias testing utilities"
    )
    subparsers = parser.add_subparsers(dest="command")

    send_parser = subparsers.add_parser("send-email", help="Send test email to alias")
    send_parser.add_argument("--alias", required=True, help="Patient alias email")
    send_parser.add_argument("--subject", default="Test Lab Report")
    send_parser.add_argument(
        "--body",
        default="This is a test email sent via Mailgun alias testing script.",
    )
    send_parser.add_argument(
        "--attachment", help="Path to attachment file to include", default=None
    )
    send_parser.add_argument(
        "--from-address",
        help="Optional From address (defaults to noreply@<domain>)",
        default=None,
    )

    serve_parser = subparsers.add_parser(
        "serve-webhook", help="Run FastAPI webhook receiver"
    )
    serve_parser.add_argument("--host", default="0.0.0.0")
    serve_parser.add_argument("--port", type=int, default=8001)

    return parser


def main():
    parser = build_arg_parser()
    args = parser.parse_args()

    if args.command == "send-email":
        send_test_email(
            alias=args.alias,
            subject=args.subject,
            body=args.body,
            attachment=args.attachment,
            from_address=args.from_address,
        )
    elif args.command == "serve-webhook":
        run_webhook_server(args.host, args.port)
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()

