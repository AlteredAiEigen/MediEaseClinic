"""
AWS Services for MediEase Clinic.
Handles S3 storage and Transcribe operations.
"""

import os
import uuid
import boto3
import asyncio
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, BinaryIO
from botocore.exceptions import ClientError
import numpy as np

# Try to import pydub, but handle Python 3.13 compatibility issues
try:
    from io import BytesIO
    import tempfile
    import subprocess
    import shutil
    from pydub import AudioSegment
    from pydub.effects import normalize
    PYDUB_AVAILABLE = True
except (ImportError, ModuleNotFoundError) as e:
    # Python 3.13 removed audioop module, pydub may not work
    print(f"Warning: pydub not available ({e}). Audio amplification will be skipped.")
    AudioSegment = None
    normalize = None
    PYDUB_AVAILABLE = False

from ..config import settings


class AWSService:
    """AWS service for S3 and Transcribe operations."""

    def __init__(self):
        """Initialize AWS clients."""
        # Use lowercase attribute names for Pydantic settings
        aws_region = settings.effective_transcribe_region if hasattr(settings, 'effective_transcribe_region') else settings.aws_region
        
        self.s3_client = boto3.client(
            's3',
            aws_access_key_id=settings.aws_access_key_id,
            aws_secret_access_key=settings.aws_secret_access_key,
            region_name=aws_region
        )

        self.transcribe_client = boto3.client(
            'transcribe',
            aws_access_key_id=settings.aws_access_key_id,
            aws_secret_access_key=settings.aws_secret_access_key,
            region_name=aws_region
        )

        self.bucket_name = settings.s3_bucket_name
        self.transcripts_bucket = settings.s3_transcripts_bucket or self.bucket_name

    def _generate_systematic_filename(
        self,
        patient_id: str,
        clinic_id: str,
        appointment_id: str,
        timestamp: datetime,
        file_type: str = "recording"
    ) -> str:
        """
        Generate systematic filename for recordings.
        Format: clinic/{clinic_id}/patient/{patient_id}/appointment/{appointment_id}/{timestamp}_{type}.{ext}
        """
        date_str = timestamp.strftime("%Y%m%d_%H%M%S")
        return f"clinic/{clinic_id}/patient/{patient_id}/appointment/{appointment_id}/{date_str}_{file_type}.wav"

    def _amplify_audio(self, audio_data: bytes, gain_db: float = 10.0) -> bytes:
        """
        Amplify audio data to improve transcription quality.

        Args:
            audio_data: Raw audio bytes
            gain_db: Gain in decibels (default 10dB)

        Returns:
            Amplified audio bytes
        """
        if PYDUB_AVAILABLE:
            try:
                audio = AudioSegment.from_file(BytesIO(audio_data), format="wav")
                amplified = normalize(audio) + gain_db
                if amplified.max_dBFS > -1.0:
                    amplified = amplified.apply_gain(-1.0 - amplified.max_dBFS)
                output_buffer = BytesIO()
                amplified.export(output_buffer, format="wav")
                return output_buffer.getvalue()
            except Exception as e:
                print(f"Audio amplification with pydub failed: {e}")

        # Fallback to ffmpeg amplification
        try:
            ffmpeg_path = shutil.which("ffmpeg")
            if not ffmpeg_path:
                print("Warning: ffmpeg not found; skipping audio amplification")
                return audio_data

            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as input_file:
                input_file.write(audio_data)
                input_path = input_file.name

            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as output_file:
                output_path = output_file.name

            cmd = [
                ffmpeg_path,
                "-y",
                "-i", input_path,
                "-filter:a", f"volume={gain_db}dB",
                output_path
            ]

            subprocess.run(cmd, check=True, capture_output=True)

            with open(output_path, "rb") as amplified_file:
                amplified_data = amplified_file.read()

            return amplified_data

        except subprocess.CalledProcessError as e:
            print(f"Audio amplification via ffmpeg failed: {e.stderr.decode('utf-8', errors='ignore')}")
            return audio_data
        except Exception as e:
            print(f"Audio amplification fallback failed: {e}")
            return audio_data
        finally:
            for path in locals().get("input_path", ""), locals().get("output_path", ""):
                if path and os.path.exists(path):
                    os.remove(path)

    async def upload_recording_to_s3(
        self,
        file_data: bytes,
        patient_id: str,
        clinic_id: str,
        appointment_id: str,
        amplify: bool = True
    ) -> Dict[str, Any]:
        """
        Upload recording to S3 with systematic naming and optional amplification.

        Args:
            file_data: Audio file bytes
            patient_id: Patient ID
            clinic_id: Clinic ID
            appointment_id: Appointment ID
            amplify: Whether to amplify audio before upload

        Returns:
            Dict with upload details
        """
        try:
            # Amplify audio if requested
            if amplify:
                file_data = self._amplify_audio(file_data)

            # Generate systematic filename
            timestamp = datetime.utcnow()
            filename = self._generate_systematic_filename(
                patient_id, clinic_id, appointment_id, timestamp, "recording"
            )

            # Upload to S3
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=filename,
                Body=file_data,
                ContentType='audio/wav',
                Metadata={
                    'patient_id': patient_id,
                    'clinic_id': clinic_id,
                    'appointment_id': appointment_id,
                    'uploaded_at': timestamp.isoformat()
                }
            )

            # Generate presigned URL (valid for 1 hour)
            presigned_url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket': self.bucket_name,
                    'Key': filename
                },
                ExpiresIn=3600
            )

            return {
                'success': True,
                'file_path': filename,
                'file_name': filename.split('/')[-1],
                'file_size': len(file_data),
                'presigned_url': presigned_url,
                'bucket': self.bucket_name,
                'uploaded_at': timestamp
            }

        except ClientError as e:
            return {
                'success': False,
                'error': f'S3 upload failed: {str(e)}'
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'Upload processing failed: {str(e)}'
            }

    def start_transcription_job_and_wait(
        self,
        recording_url: str,
        job_name: str
    ) -> Dict[str, Any]:
        """
        Start AWS Transcribe job and wait for completion (synchronous polling).

        Args:
            recording_url: S3 URL of the recording
            job_name: Unique job name

        Returns:
            Dict with transcription result
        """
        try:
            # Start transcription job
            self.transcribe_client.start_transcription_job(
                TranscriptionJobName=job_name,
                Media={'MediaFileUri': recording_url},
                IdentifyMultipleLanguages=True,
                LanguageOptions=['en-US', 'hi-IN'],
                MediaFormat='mp3'
            )

            # Poll for completion
            import time
            while True:
                response = self.transcribe_client.get_transcription_job(TranscriptionJobName=job_name)
                status = response['TranscriptionJob']['TranscriptionJobStatus']

                if status == 'COMPLETED':
                    transcript_uri = response['TranscriptionJob']['Transcript']['TranscriptFileUri']
                    import requests
                    transcript_response = requests.get(transcript_uri)
                    transcript_json = transcript_response.json()
                    transcript_text = transcript_json['results']['transcripts'][0]['transcript']

                    return {
                        'success': True,
                        'status': 'completed',
                        'transcript': transcript_text,
                        'confidence': transcript_json['results']['transcripts'][0].get('confidence', 0.0),
                        'job_name': job_name
                    }

                elif status == 'FAILED':
                    return {
                        'success': False,
                        'status': 'error',
                        'error': 'Transcription job failed',
                        'job_name': job_name
                    }

                else:
                    time.sleep(5)  # Wait 5 seconds before polling again

        except Exception as e:
            return {
                'success': False,
                'status': 'error',
                'error': f'Transcription failed: {str(e)}',
                'job_name': job_name
            }

# Removed old async get_transcription_result method - using synchronous start_transcription_job_and_wait instead

    async def get_transcription_result(self, job_name: str) -> Dict[str, Any]:
        """
        Fetch transcription result for an existing AWS Transcribe job.

        This keeps backward compatibility for code paths that still poll
        after a job has been kicked off elsewhere.
        """
        try:
            # boto3 client is synchronous; run in thread to avoid blocking event loop
            response = await asyncio.to_thread(
                self.transcribe_client.get_transcription_job,
                TranscriptionJobName=job_name,
            )
            job = response.get("TranscriptionJob", {})
            status = job.get("TranscriptionJobStatus")

            if status == "COMPLETED":
                transcript_uri = job.get("Transcript", {}).get("TranscriptFileUri")
                if not transcript_uri:
                    return {
                        "success": False,
                        "status": "error",
                        "error": "Transcript URI missing from job result",
                        "job_name": job_name,
                    }

                import requests

                transcript_response = requests.get(transcript_uri, timeout=10)
                transcript_json = transcript_response.json()
                transcript_text = transcript_json["results"]["transcripts"][0]["transcript"]

                return {
                    "success": True,
                    "status": "completed",
                    "transcript": transcript_text,
                    "confidence": transcript_json["results"]["transcripts"][0].get("confidence", 0.0),
                    "job_name": job_name,
                }

            if status == "FAILED":
                return {
                    "success": False,
                    "status": "error",
                    "error": job.get("FailureReason") or "Transcription job failed",
                    "job_name": job_name,
                }

            # Still processing
            return {
                "success": True,
                "status": "processing",
                "job_name": job_name,
            }

        except Exception as e:
            return {
                "success": False,
                "status": "error",
                "error": f"Transcription lookup failed: {str(e)}",
                "job_name": job_name,
            }

    async def extract_structured_notes(
        self,
        transcript: str,
        patient_context: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Extract structured clinical notes from transcription using LLM.

        Args:
            transcript: Raw transcription text
            patient_context: Patient context information

        Returns:
            Dict with structured clinical notes
        """
        try:
            from ..services.ai_service import AIService
            ai_service = AIService()

            # Force OpenAI usage for faster, more reliable extraction when available
            if ai_service.provider != "openai":
                return {
                    "success": False,
                    "error": "OpenAI provider not configured; set OPENAI_API_KEY",
                }

            prompt = f"""
            Extract structured clinical notes from the following doctor-patient consultation transcript.
            Format the information into these specific categories:
            
            CHIEF COMPLAINT: Main reason for visit
            HISTORY OF PRESENT ILLNESS: Detailed description of current symptoms and timeline
            REVIEW OF SYSTEMS: Systematic review of body systems mentioned
            PHYSICAL EXAMINATION: Physical findings mentioned
            ASSESSMENT: Doctor's assessment/diagnosis
            PLAN: Treatment plan and recommendations
            MEDICATIONS: Any medications prescribed or discussed (extract full structure)
            ALLERGIES: Any allergies mentioned by the patient or doctor (extract specific allergy names)
            PRESCRIBED TESTS: Any lab tests, imaging studies, or diagnostic tests mentioned or ordered (e.g., "CBC", "Blood Sugar Test", "X-Ray Chest", "ECG", "Ultrasound", "CT Scan")
            FOLLOW-UP INSTRUCTIONS: Follow-up care instructions
            DIFFERENTIAL DIAGNOSIS: Alternative diagnoses considered
            CLINICAL IMPRESSION: Overall clinical impression
            
            Transcript:
            {transcript}
            
            Patient Context:
            {patient_context or "No additional context provided"}
            
            Provide the response in JSON format with these exact keys:
            {{
                "chiefComplaint": "...",
                "historyOfPresentIllness": "...",
                "reviewOfSystems": "...",
                "physicalExamination": "...",
                "assessment": "...",
                "plan": "...",
                "medications": [
                  {{
                    "name": "Medication name",
                    "dosage": "Dose and units (e.g. 500mg)",
                    "frequency": "How often (e.g. 1-0-1, twice daily)",
                    "duration": "Duration text (e.g. 5 days, 2 weeks, 1 month)",
                    "instructions": "Any extra instructions"
                  }}
                ],
                "allergies": ["allergy name 1", "allergy name 2"],
                "prescribedTests": ["test name 1", "test name 2"],
                "followUpInstructions": "...",
                "differentialDiagnosis": ["dx1", "dx2"],
                "clinicalImpression": "..."
            }}
            
            IMPORTANT:
            - Return ONLY a valid JSON object with the keys above. No prose, no code fences.
            - Extract medications as objects with name, dosage, frequency, duration, and instructions whenever possible.
            - Extract specific allergy names mentioned (e.g., "Penicillin", "Peanuts", "Latex").
            - Extract all test names mentioned or ordered (e.g., "CBC", "Blood Sugar", "X-Ray", "ECG", "Ultrasound", "CT Scan", "MRI").
            - If no medications, allergies, or tests are mentioned, use empty arrays [].
            - If any category is not mentioned or not applicable, use null or empty array.
            """

            # Use configured OpenAI model (defaults to gpt-4o-mini) with strict JSON output
            response = await ai_service.generate_response(
                prompt,
                model=settings.openai_model,
                response_format={"type": "json_object"},
            )

            # Parse JSON response with a defensive fallback
            import json
            try:
                structured_notes = json.loads(response)
                return {
                    'success': True,
                    'structured_notes': structured_notes,
                    'confidence': 0.85  # Placeholder confidence score
                }
            except json.JSONDecodeError:
                # Fallback: attempt to extract JSON object from the text
                import re
                match = re.search(r"\{.*\}", response, re.DOTALL)
                if match:
                    try:
                        structured_notes = json.loads(match.group(0))
                        return {
                            'success': True,
                            'structured_notes': structured_notes,
                            'confidence': 0.85
                        }
                    except Exception:
                        pass
                return {
                    'success': False,
                    'error': 'Failed to parse structured notes',
                    'raw_response': response
                }

        except Exception as e:
            return {
                'success': False,
                'error': f'Note extraction failed: {str(e)}'
            }

    async def delete_recording(self, file_path: str) -> bool:
        """
        Delete recording from S3.

        Args:
            file_path: S3 key to delete

        Returns:
            Success status
        """
        try:
            self.s3_client.delete_object(
                Bucket=self.bucket_name,
                Key=file_path
            )
            return True
        except Exception as e:
            print(f"Failed to delete recording {file_path}: {e}")
            return False


# Global instance
aws_service = AWSService()
