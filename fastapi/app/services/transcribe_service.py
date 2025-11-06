"""
AWS Transcribe service for audio transcription.
Based on the existing transcribe.py implementation.
"""

import boto3
import time
import requests
from typing import Dict
import logging
from fastapi import HTTPException, status

from app.config import settings

logger = logging.getLogger(__name__)


class TranscribeService:
    """Service for transcribing audio files using AWS Transcribe."""
    
    def __init__(self):
        """Initialize AWS Transcribe client."""
        self.transcribe_client = boto3.client(
            'transcribe',
            aws_access_key_id=settings.aws_access_key_id,
            aws_secret_access_key=settings.aws_secret_access_key,
            region_name=settings.aws_region
        )
    
    async def start_transcription_job(
        self,
        job_name: str,
        file_uri: str,
        media_format: str = "mp3",
        identify_multiple_languages: bool = True
    ) -> Dict:
        """
        Start AWS Transcribe job and wait for completion.
        
        Args:
            job_name: Unique job name
            file_uri: S3 URI of audio file (s3://bucket/key)
            media_format: Audio format (mp3, wav, m4a, etc.)
            identify_multiple_languages: Enable multi-language detection
        
        Returns:
            Transcription result dict
        """
        try:
            # Start transcription job
            job_params = {
                'TranscriptionJobName': job_name,
                'Media': {'MediaFileUri': file_uri},
                'MediaFormat': media_format
            }
            
            # Add language options for multi-language support
            if identify_multiple_languages:
                job_params['IdentifyMultipleLanguages'] = True
                job_params['LanguageOptions'] = settings.transcribe_languages
            else:
                job_params['LanguageCode'] = 'en-US'
            
            self.transcribe_client.start_transcription_job(**job_params)
            
            logger.info(f"Started transcription job: {job_name}")
            
            # Poll for completion
            return await self._wait_for_completion(job_name)
        
        except Exception as e:
            logger.error(f"Transcription job failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Transcription failed: {str(e)}"
            )
    
    async def _wait_for_completion(self, job_name: str) -> Dict:
        """
        Wait for transcription job to complete.
        
        Args:
            job_name: Transcription job name
        
        Returns:
            Transcription result
        """
        max_attempts = 120  # 10 minutes max wait time
        attempt = 0
        
        while attempt < max_attempts:
            try:
                response = self.transcribe_client.get_transcription_job(
                    TranscriptionJobName=job_name
                )
                
                status = response['TranscriptionJob']['TranscriptionJobStatus']
                
                if status == 'COMPLETED':
                    # Get transcript from result URL
                    transcript_uri = response['TranscriptionJob']['Transcript']['TranscriptFileUri']
                    transcript_response = requests.get(transcript_uri)
                    transcript_json = transcript_response.json()
                    
                    # Extract transcript text
                    transcript_text = transcript_json['results']['transcripts'][0]['transcript']
                    
                    # Extract additional information
                    language_code = response['TranscriptionJob'].get('LanguageCode', 'unknown')
                    identified_languages = response['TranscriptionJob'].get('IdentifiedLanguageCodes', [])
                    
                    logger.info(f"Transcription completed for job: {job_name}")
                    
                    return {
                        "transcript": transcript_text,
                        "language_code": language_code,
                        "identified_languages": identified_languages,
                        "full_response": transcript_json,
                        "status": "completed"
                    }
                
                elif status == 'FAILED':
                    failure_reason = response['TranscriptionJob'].get('FailureReason', 'Unknown error')
                    logger.error(f"Transcription failed: {failure_reason}")
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Transcription job failed: {failure_reason}"
                    )
                
                else:
                    # Job still in progress
                    logger.info(f"Transcription job {job_name} status: {status}")
                    time.sleep(5)  # Wait 5 seconds before checking again
                    attempt += 1
            
            except HTTPException:
                raise
            except Exception as e:
                logger.error(f"Error checking transcription status: {e}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Error checking transcription status: {str(e)}"
                )
        
        # Timeout
        raise HTTPException(
            status_code=status.HTTP_408_REQUEST_TIMEOUT,
            detail="Transcription job timed out"
        )
    
    async def get_transcription_job_status(self, job_name: str) -> Dict:
        """
        Get transcription job status without waiting.
        
        Args:
            job_name: Transcription job name
        
        Returns:
            Job status dict
        """
        try:
            response = self.transcribe_client.get_transcription_job(
                TranscriptionJobName=job_name
            )
            
            job = response['TranscriptionJob']
            
            return {
                "job_name": job_name,
                "status": job['TranscriptionJobStatus'],
                "language_code": job.get('LanguageCode'),
                "created_at": job.get('CreationTime'),
                "completed_at": job.get('CompletionTime')
            }
        
        except Exception as e:
            logger.error(f"Failed to get job status: {e}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Transcription job not found: {str(e)}"
            )
    
    async def delete_transcription_job(self, job_name: str) -> bool:
        """
        Delete transcription job.
        
        Args:
            job_name: Transcription job name
        
        Returns:
            True if deleted successfully
        """
        try:
            self.transcribe_client.delete_transcription_job(
                TranscriptionJobName=job_name
            )
            
            logger.info(f"Transcription job deleted: {job_name}")
            return True
        
        except Exception as e:
            logger.error(f"Failed to delete transcription job: {e}")
            return False


# Global transcribe service instance
transcribe_service = TranscribeService()

