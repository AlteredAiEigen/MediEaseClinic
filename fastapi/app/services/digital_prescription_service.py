"""
Generate digital prescription PDFs and store them in S3.

S3 path includes patient ID and appointment ID:
  clinic/{clinic_id}/patient/{patient_id}/appointment/{appointment_id}/prescriptions/

DPDP: patient/clinic names appear in PDF content only. Filenames use appointment
id + timestamp (no patient/clinic name) to avoid PII in URLs and download lists.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from bson import ObjectId
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.services.healthcare_provider_service import HealthcareProviderService
from app.services.prescription_pdf_builder import (
    build_prescription_filename,
    build_prescription_pdf,
    format_address as _format_address,
    format_doctor_name as _format_doctor_name,
    parse_next_appointment as _parse_next_appointment,
    parse_prescribed_tests as _parse_prescribed_tests,
)
from app.services.s3_service import s3_service
import logging

logger = logging.getLogger(__name__)


class DigitalPrescriptionService:
    """Generate prescription PDFs from MongoDB data and upload to S3."""

    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.appointments_collection = db.appointments
        self.prescriptions_collection = db.prescriptions
        self.patients_collection = db.patients
        self.users_collection = db.users
        self.s3_prescriptions_collection = db.s3_prescriptions
        self.provider_service = HealthcareProviderService(db)

    async def _resolve_patient(self, patient_id: str) -> Optional[dict]:
        if ObjectId.is_valid(patient_id):
            patient = await self.patients_collection.find_one({"_id": ObjectId(patient_id)})
            if patient:
                return patient
        return await self.patients_collection.find_one({"patientId": patient_id})

    async def _load_prescription_context(
        self,
        appointment_id: str,
    ) -> Optional[Dict[str, Any]]:
        if not ObjectId.is_valid(appointment_id):
            return None

        appointment = await self.appointments_collection.find_one({"_id": ObjectId(appointment_id)})
        if not appointment:
            return None

        prescription = await self.prescriptions_collection.find_one(
            {"appointmentId": appointment_id, "isActive": {"$ne": False}},
            sort=[("updatedAt", -1), ("createdAt", -1)],
        )

        patient_id = appointment.get("patientId")
        patient = await self._resolve_patient(str(patient_id)) if patient_id else None
        if not patient:
            return None

        doctor_id = (
            (prescription or {}).get("doctorId")
            or appointment.get("doctorId")
        )
        doctor = None
        if doctor_id and ObjectId.is_valid(str(doctor_id)):
            doctor = await self.users_collection.find_one({"_id": ObjectId(str(doctor_id))})

        clinic_id = appointment.get("clinicId") or (doctor or {}).get("clinicId") or "general"
        provider = await self.provider_service.get_provider_by_id(clinic_id)

        medications: List[Dict[str, Any]] = []
        diagnosis = appointment.get("diagnosis") or ""
        notes = ""
        prescription_id = appointment.get("appointmentId") or appointment_id
        prescribed_at = datetime.utcnow()
        free_text = appointment.get("prescription") or ""

        if prescription:
            medications = prescription.get("medications") or []
            diagnosis = prescription.get("diagnosis") or diagnosis
            notes = prescription.get("notes") or ""
            prescription_id = prescription.get("prescriptionId") or str(prescription.get("_id"))
            prescribed_at = prescription.get("prescribedAt") or prescription.get("updatedAt") or prescribed_at
        elif not free_text.strip():
            return None

        prescribed_tests = appointment.get("prescribedTest") or _parse_prescribed_tests(notes)
        next_appointment = appointment.get("followUpInstructions") or _parse_next_appointment(notes)

        patient_name = f"{patient.get('firstName', '')} {patient.get('lastName', '')}".strip()
        patient_display_id = str(patient.get("patientId") or patient.get("_id") or "")
        patient_mongo_id = str(patient.get("_id"))
        appointment_mongo_id = str(appointment.get("_id"))
        appointment_display_id = str(appointment.get("appointmentId") or appointment_mongo_id)

        doctor_name = _format_doctor_name(doctor, fallback="Doctor")
        doctor_id = str(doctor.get("_id")) if doctor else str(doctor_id or "")
        doctor_speciality = (doctor or {}).get("speciality") or ""
        doctor_license = (doctor or {}).get("licenseNumber") or ""

        clinic_name = (
            appointment.get("clinicName")
            or (provider or {}).get("name")
            or (doctor or {}).get("clinicName")
            or "Clinic"
        )
        clinic_address = _format_address(provider)
        clinic_phone = (provider or {}).get("phone") or (doctor or {}).get("phone") or ""
        clinic_email = (provider or {}).get("email") or ""
        clinic_registration = (provider or {}).get("registrationNumber") or ""
        clinic_website = (provider or {}).get("website") or ""

        return {
            "appointment": appointment,
            "prescription_doc": prescription,
            "patient": patient,
            "doctor": doctor,
            "provider": provider,
            "clinic_id": clinic_id,
            "patient_id": patient_mongo_id,
            "patient_display_id": patient_display_id,
            "patient_mongo_id": patient_mongo_id,
            "appointment_display_id": appointment_display_id,
            "appointment_mongo_id": appointment_mongo_id,
            "medications": medications,
            "diagnosis": diagnosis,
            "notes": notes,
            "prescription_id": prescription_id,
            "prescribed_at": prescribed_at,
            "free_text_prescription": free_text,
            "prescribed_tests": prescribed_tests,
            "next_appointment": next_appointment,
            "patient_name": patient_name,
            "doctor_name": doctor_name,
            "doctor_id": doctor_id,
            "doctor_speciality": doctor_speciality,
            "doctor_license": doctor_license,
            "clinic_name": clinic_name,
            "clinic_address": clinic_address,
            "clinic_phone": clinic_phone,
            "clinic_email": clinic_email,
            "clinic_registration": clinic_registration,
            "clinic_website": clinic_website,
            "patient_age": str(patient.get("age") or ""),
            "patient_gender": patient.get("gender") or "",
            "patient_phone": patient.get("phone") or "",
        }

    async def _resolve_clinic_logo_bytes(
        self,
        *,
        clinic_id: str,
        provider: Optional[dict],
    ) -> Optional[bytes]:
        """
        Load the appointment clinic/hospital logo (never the MediEase product logo).
        Supports provider logoS3Key / logoUrl / logo fields and common S3 branding paths.
        """
        provider = provider or {}

        s3_key = (
            provider.get("logoS3Key")
            or provider.get("logoKey")
            or provider.get("logo_s3_key")
        )
        if s3_key:
            try:
                return await s3_service.download_file_bytes_async(str(s3_key))
            except Exception as exc:
                logger.warning("Failed to load clinic logo from S3 key %s: %s", s3_key, exc)

        # Conventional branding paths under the clinic prefix
        for candidate in (
            f"clinic/{clinic_id}/branding/logo.png",
            f"clinic/{clinic_id}/branding/logo.jpg",
            f"clinic/{clinic_id}/branding/logo.jpeg",
            f"clinic/{clinic_id}/logo.png",
            f"clinic/{clinic_id}/logo.jpg",
        ):
            try:
                if await s3_service.file_exists(candidate):
                    return await s3_service.download_file_bytes_async(candidate)
            except Exception as exc:
                logger.debug("Clinic logo path check failed for %s: %s", candidate, exc)

        url = (
            provider.get("logoUrl")
            or provider.get("logo")
            or provider.get("imageUrl")
            or provider.get("logo_url")
        )
        if url and isinstance(url, str) and url.startswith(("http://", "https://")):
            try:
                import urllib.request

                def _fetch() -> bytes:
                    with urllib.request.urlopen(url, timeout=8) as resp:
                        return resp.read()

                import asyncio

                return await asyncio.to_thread(_fetch)
            except Exception as exc:
                logger.warning("Failed to fetch clinic logo from URL: %s", exc)

        return None

    async def generate_and_store(
        self,
        appointment_id: str,
        uploaded_by: Optional[str] = None,
        *,
        require_structured_prescription: bool = False,
        language: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Build a prescription PDF from Prescription-tab data, upload to S3,
        and upsert the s3_prescriptions row.

        When require_structured_prescription=True (WhatsApp send), a saved
        prescriptions document with at least one medicine is mandatory.
        """
        context = await self._load_prescription_context(appointment_id)
        if not context:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No prescription data found for this appointment. Save medicines in the Prescription tab first.",
            )

        prescription_doc = context.get("prescription_doc")
        medications = context.get("medications") or []
        if require_structured_prescription:
            if not prescription_doc:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No prescription found from the Prescription tab. Add medicines and save before sending on WhatsApp.",
                )
            if not medications:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Prescription has no medicines. Add at least one medicine in the Prescription tab before sending.",
                )

        # Keep appointment consultation fields aligned with Prescription tab
        await self.appointments_collection.update_one(
            {"_id": ObjectId(appointment_id)},
            {
                "$set": {
                    "diagnosis": context.get("diagnosis") or "",
                    "prescribedTest": context.get("prescribed_tests") or "",
                    "followUpInstructions": context.get("next_appointment") or "",
                    "updatedAt": datetime.utcnow(),
                }
            },
        )

        clinic_logo_bytes = await self._resolve_clinic_logo_bytes(
            clinic_id=context["clinic_id"],
            provider=context.get("provider"),
        )

        # Digital prescription PDFs use the English editor terminology only.
        # Keep the argument for backwards-compatible callers, but do not use it.
        pdf_language = "en"

        pdf_bytes = build_prescription_pdf(
            clinic_id=context["clinic_id"],
            clinic_name=context["clinic_name"],
            clinic_address=context["clinic_address"],
            clinic_phone=context["clinic_phone"],
            clinic_email=context.get("clinic_email") or "",
            clinic_registration=context.get("clinic_registration") or "",
            clinic_website=context.get("clinic_website") or "",
            clinic_logo_bytes=clinic_logo_bytes,
            doctor_id=context["doctor_id"],
            doctor_name=context["doctor_name"],
            doctor_speciality=context["doctor_speciality"],
            doctor_license=context["doctor_license"],
            patient_name=context["patient_name"],
            patient_display_id=context["patient_display_id"],
            patient_mongo_id=context["patient_mongo_id"],
            patient_age=context["patient_age"],
            patient_gender=context["patient_gender"],
            patient_phone=context["patient_phone"],
            appointment_display_id=context["appointment_display_id"],
            appointment_mongo_id=context["appointment_mongo_id"],
            prescription_id=context["prescription_id"],
            prescribed_at=context["prescribed_at"],
            diagnosis=context["diagnosis"],
            medications=medications,
            prescribed_tests=context["prescribed_tests"],
            next_appointment=context["next_appointment"],
            free_text_prescription=context["free_text_prescription"],
            language=pdf_language,
        )

        patient_id = context["patient_id"]
        clinic_id = context["clinic_id"]
        # DPDP-safe unique name: Prescription_{aptId}_{YYYYMMDD_HHMM}.pdf
        # Uniqueness also comes from the appointment folder path — do not let
        # S3 upload_file prepend another timestamp (that caused double stamps).
        prescribed_at = context["prescribed_at"]
        if not isinstance(prescribed_at, datetime):
            prescribed_at = datetime.utcnow()
        filename = build_prescription_filename(
            appointment_display_id=context["appointment_display_id"],
            appointment_mongo_id=context["appointment_mongo_id"],
            prescribed_at=prescribed_at,
        )
        folder = (
            f"clinic/{clinic_id}/patient/{patient_id}/appointment/{appointment_id}/prescriptions"
        )

        # Digital PDF entries live only in s3_prescriptions (never s3_reports).
        existing = await self.s3_prescriptions_collection.find_one(
            {
                "appointmentId": appointment_id,
                "metadata.source": "digital",
            }
        )
        if not existing:
            # Fallback: any prior prescription file for this appointment (e.g. older digital rows)
            existing = await self.s3_prescriptions_collection.find_one(
                {"appointmentId": appointment_id},
                sort=[("createdAt", -1)],
            )

        old_s3_key = None
        if existing:
            old_s3_key = existing.get("s3Key")
        else:
            appointment = context["appointment"]
            old_s3_key = appointment.get("prescriptionFileKey")

        if old_s3_key:
            try:
                await s3_service.delete_file(old_s3_key)
            except Exception as exc:
                logger.warning("Failed to delete previous prescription PDF from S3: %s", exc)

        upload_result = await s3_service.upload_file(
            file_content=pdf_bytes,
            file_name=filename,
            content_type="application/pdf",
            folder=folder,
            preserve_filename=True,
        )

        uploader_name = None
        if uploaded_by and ObjectId.is_valid(uploaded_by):
            uploader = await self.users_collection.find_one({"_id": ObjectId(uploaded_by)})
            if uploader:
                uploader_name = (
                    f"{uploader.get('firstName', '')} {uploader.get('lastName', '')}".strip()
                    or uploader.get("email")
                )

        timestamp = datetime.utcnow()
        s3_entry = {
            "patientId": patient_id,
            "patientMongoId": ObjectId(patient_id) if ObjectId.is_valid(patient_id) else None,
            "appointmentId": appointment_id,
            "documentName": filename,
            "documentType": "prescription",
            "s3Key": upload_result["s3_key"],
            "s3Url": upload_result["file_url"],
            "fileType": "application/pdf",
            "fileSize": len(pdf_bytes),
            "uploadedBy": uploaded_by,
            "uploadedByName": uploader_name,
            "uploadedAt": timestamp,
            "notes": context["notes"] or None,
            "emailSentToPatient": False,
            "emailSentAt": None,
            "lastAccessedAt": None,
            "metadata": {
                "source": "digital",
                "documentType": "prescription",
                "prescriptionId": context["prescription_id"],
                "patientDisplayId": context["patient_display_id"],
                "appointmentDisplayId": context["appointment_display_id"],
                "clinicId": clinic_id,
                "medicationCount": len(medications),
            },
            "clinicId": clinic_id,
            "updatedAt": timestamp,
        }

        if existing:
            await self.s3_prescriptions_collection.update_one(
                {"_id": existing["_id"]},
                {"$set": s3_entry},
            )
            s3_doc_id = str(existing["_id"])
        else:
            s3_entry["createdAt"] = timestamp
            insert_result = await self.s3_prescriptions_collection.insert_one(s3_entry)
            s3_doc_id = str(insert_result.inserted_id)

        logger.info(
            "Digital prescription PDF stored in s3_prescriptions only (id=%s, appointment=%s, key=%s, meds=%s)",
            s3_doc_id,
            appointment_id,
            upload_result["s3_key"],
            len(medications),
        )

        appointment_update = {
            "prescriptionFileUrl": upload_result["file_url"],
            "prescriptionFileKey": upload_result["s3_key"],
            "prescriptionFileName": filename,
            "prescriptionFileType": "application/pdf",
            "prescriptionUploadedAt": timestamp,
            "prescriptionUploadedBy": uploaded_by,
            "prescriptionUploadedByName": uploader_name,
            "updatedAt": timestamp,
        }
        await self.appointments_collection.update_one(
            {"_id": ObjectId(appointment_id)},
            {"$set": appointment_update},
        )

        if prescription_doc and prescription_doc.get("_id"):
            await self.prescriptions_collection.update_one(
                {"_id": prescription_doc["_id"]},
                {
                    "$set": {
                        "pdfS3Key": upload_result["s3_key"],
                        "pdfUrl": upload_result["file_url"],
                        "pdfGeneratedAt": timestamp,
                        "updatedAt": timestamp,
                    }
                },
            )

        download_url = await s3_service.generate_prescription_download_url(
            upload_result["s3_key"],
            filename=filename,
        )

        logger.info(
            "Generated prescription PDF for appointment %s at s3://%s",
            appointment_id,
            upload_result["s3_key"],
        )

        return {
            "s3PrescriptionId": s3_doc_id,
            "s3Key": upload_result["s3_key"],
            "s3Url": upload_result["file_url"],
            "downloadUrl": download_url,
            "documentName": filename,
            "fileSize": len(pdf_bytes),
            "prescriptionId": context["prescription_id"],
            "medicationCount": len(medications),
        }


def get_digital_prescription_service(db: AsyncIOMotorDatabase) -> DigitalPrescriptionService:
    return DigitalPrescriptionService(db)
