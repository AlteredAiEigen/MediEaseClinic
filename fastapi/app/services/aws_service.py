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
        if not PYDUB_AVAILABLE:
            # If pydub is not available (e.g., Python 3.13), return original audio
            print("Warning: Audio amplification skipped (pydub not available)")
            return audio_data

        try:
            # Load audio from bytes
            audio = AudioSegment.from_file(audio_data, format="wav")

            # Apply normalization/amplification
            amplified = normalize(audio) + gain_db

            # Ensure we don't exceed maximum amplitude
            if amplified.max_dBFS > -1.0:
                amplified = amplified.apply_gain(-1.0 - amplified.max_dBFS)

            # Export back to bytes
            output_buffer = amplified.export(format="wav")
            return output_buffer.read()

        except Exception as e:
            print(f"Audio amplification failed: {e}")
            return audio_data  # Return original if amplification fails

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

    async def start_transcription_job(
        self,
        recording_url: str,
        job_name: str,
        language_code: str = "en-US"
    ) -> Dict[str, Any]:
        """
        Start AWS Transcribe job for audio file.

        Args:
            recording_url: S3 URL of the recording
            job_name: Unique job name
            language_code: Language code for transcription

        Returns:
            Dict with transcription job details
        """
        try:
            # Extract bucket and key from URL
            # URL format: https://bucket.s3.region.amazonaws.com/key
            url_parts = recording_url.replace('https://', '').split('/')
            bucket = url_parts[0].split('.')[0]
            key = '/'.join(url_parts[1:])

            response = self.transcribe_client.start_transcription_job(
                TranscriptionJobName=job_name,
                Media={'MediaFileUri': recording_url},
                MediaFormat='wav',
                LanguageCode=language_code,
                Settings={
                    'ShowSpeakerLabels': True,
                    'MaxSpeakerLabels': 2,  # Doctor and patient
                    'ChannelIdentification': False,
                    'ShowAlternatives': False
                },
                OutputBucketName=self.transcripts_bucket,
                OutputKey=f"transcripts/{job_name}.json"
            )

            return {
                'success': True,
                'job_name': job_name,
                'job_status': response['TranscriptionJob']['TranscriptionJobStatus'],
                'job_arn': response['TranscriptionJob']['TranscriptionJobArn']
            }

        except ClientError as e:
            return {
                'success': False,
                'error': f'Transcription job failed: {str(e)}'
            }

    async def get_transcription_result(self, job_name: str) -> Dict[str, Any]:
        """
        Get transcription job result.

        Args:
            job_name: Transcription job name

        Returns:
            Dict with transcription result
        """
        try:
            response = self.transcribe_client.get_transcription_job(
                TranscriptionJobName=job_name
            )

            job = response['TranscriptionJob']
            status = job['TranscriptionJobStatus']

            if status == 'COMPLETED':
                # Get transcript from S3
                transcript_key = f"transcripts/{job_name}.json"
                transcript_obj = self.s3_client.get_object(
                    Bucket=self.transcripts_bucket,
                    Key=transcript_key
                )

                import json
                transcript_data = json.loads(transcript_obj['Body'].read().decode('utf-8'))

                # Extract transcript text
                transcript = transcript_data['results']['transcripts'][0]['transcript']

                # Extract speaker labels if available
                speaker_segments = []
                if 'speaker_labels' in transcript_data['results']:
                    speaker_segments = transcript_data['results']['speaker_labels']['segments']

                return {
                    'success': True,
                    'status': 'completed',
                    'transcript': transcript,
                    'confidence': transcript_data['results']['transcripts'][0].get('confidence', 0),
                    'speaker_segments': speaker_segments,
                    'full_response': transcript_data
                }

            elif status == 'FAILED':
                return {
                    'success': False,
                    'status': 'failed',
                    'error': job.get('FailureReason', 'Unknown error')
                }

            else:
                return {
                    'success': True,
                    'status': status.lower()
                }

        except ClientError as e:
            return {
                'success': False,
                'error': f'Failed to get transcription: {str(e)}'
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

            prompt = f"""
            Extract structured clinical notes from the following doctor-patient consultation transcript.
            Format the information into these specific categories:

            CHIEF COMPLAINT: Main reason for visit
            HISTORY OF PRESENT ILLNESS: Detailed description of current symptoms and timeline
            REVIEW OF SYSTEMS: Systematic review of body systems mentioned
            PHYSICAL EXAMINATION: Physical findings mentioned
            ASSESSMENT: Doctor's assessment/diagnosis
            PLAN: Treatment plan and recommendations
            MEDICATIONS: Any medications prescribed or discussed
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
                "medications": ["med1", "med2"],
                "followUpInstructions": "...",
                "differentialDiagnosis": ["dx1", "dx2"],
                "clinicalImpression": "..."
            }}

            If any category is not mentioned or not applicable, use null or empty array.
            """

            response = await ai_service.generate_response(prompt, model="gpt-4")

            # Parse JSON response
            import json
            try:
                structured_notes = json.loads(response)
                return {
                    'success': True,
                    'structured_notes': structured_notes,
                    'confidence': 0.85  # Placeholder confidence score
                }
            except json.JSONDecodeError:
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
