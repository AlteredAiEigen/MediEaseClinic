"""
AWS S3 service for secure file storage with HIPAA compliance.
"""

import boto3
from botocore.exceptions import ClientError
from typing import Optional
import logging
import asyncio
from datetime import datetime
import mimetypes

from app.config import settings

logger = logging.getLogger(__name__)


class S3Service:
    """Service for handling S3 file operations with encryption."""
    
    def __init__(self):
        """Initialize S3 client with credentials from settings."""
        self.s3_client = boto3.client(
            's3',
            aws_access_key_id=settings.aws_access_key_id,
            aws_secret_access_key=settings.aws_secret_access_key,
            region_name=settings.aws_region
        )
        self.bucket_name = settings.s3_bucket_name
    
    async def upload_file(
        self,
        file_content: bytes,
        file_name: str,
        content_type: str,
        folder: str = "uploads",
        bucket_override: Optional[str] = None,
        *,
        preserve_filename: bool = False,
    ) -> dict:
        """
        Upload file to S3 with server-side encryption.
        
        Args:
            file_content: File content as bytes
            file_name: Original file name
            content_type: MIME type
            folder: S3 folder path
            preserve_filename: If True, use folder/file_name as the exact key
                (no YYYYMMDD_HHMMSS_ prefix). Use when the caller already
                embeds uniqueness in the path/name (e.g. prescriptions).
        
        Returns:
            dict with s3_key and file_url
        """
        try:
            safe_name = (file_name or "file").lstrip("/")
            if preserve_filename:
                s3_key = f"{folder.rstrip('/')}/{safe_name}"
            else:
                # Generate unique S3 key
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                s3_key = f"{folder}/{timestamp}_{safe_name}"
            bucket_name = bucket_override or self.bucket_name
            
            # Upload with server-side encryption (SSE-S3)
            self.s3_client.put_object(
                Bucket=bucket_name,
                Key=s3_key,
                Body=file_content,
                ContentType=content_type,
                ServerSideEncryption='AES256',  # SSE-S3 encryption
                Metadata={
                    'uploaded-at': datetime.now().isoformat(),
                    'original-filename': safe_name
                }
            )
            
            # Generate file URL
            file_url = f"https://{bucket_name}.s3.{settings.aws_region}.amazonaws.com/{s3_key}"
            
            logger.info(f"File uploaded successfully to S3: {s3_key}")
            
            return {
                "s3_key": s3_key,
                "file_url": file_url,
                "bucket": bucket_name
            }
        
        except ClientError as e:
            logger.error(f"S3 upload failed: {e}")
            raise Exception(f"Failed to upload file to S3: {str(e)}")
    
    async def generate_presigned_url(
        self,
        s3_key: str,
        expiration: int = None,
        bucket_override: Optional[str] = None,
        response_content_disposition: Optional[str] = None,
        response_content_type: Optional[str] = None,
    ) -> str:
        """
        Generate presigned URL for temporary file access.
        
        Args:
            s3_key: S3 object key
            expiration: URL expiration time in seconds (default from settings)
            bucket_override: Bucket if different from default (e.g. transcripts bucket)
            response_content_disposition: Optional Content-Disposition override (e.g. attachment)
            response_content_type: Optional Content-Type override
        
        Returns:
            Presigned URL
        """
        if expiration is None:
            expiration = settings.aws_s3_presigned_url_expiration
        
        bucket_name = bucket_override or self.bucket_name
        try:
            params: dict = {
                "Bucket": bucket_name,
                "Key": s3_key,
            }
            if response_content_disposition:
                params["ResponseContentDisposition"] = response_content_disposition
            if response_content_type:
                params["ResponseContentType"] = response_content_type

            presigned_url = self.s3_client.generate_presigned_url(
                "get_object",
                Params=params,
                ExpiresIn=expiration,
            )
            
            logger.info(f"Generated presigned URL for: {s3_key}")
            return presigned_url
        
        except ClientError as e:
            logger.error(f"Failed to generate presigned URL: {e}")
            raise Exception(f"Failed to generate presigned URL: {str(e)}")

    async def generate_prescription_download_url(
        self,
        s3_key: str,
        filename: str = "prescription.pdf",
        expiration: Optional[int] = None,
    ) -> str:
        """Presigned URL that prompts download of a prescription PDF."""
        safe_name = filename.replace('"', "").strip() or "prescription.pdf"
        return await self.generate_presigned_url(
            s3_key,
            expiration=expiration or settings.aws_s3_prescription_presigned_url_expiration,
            response_content_disposition=f'attachment; filename="{safe_name}"',
            response_content_type="application/pdf",
        )
    
    async def delete_file(self, s3_key: str) -> bool:
        """
        Delete file from S3.
        
        Args:
            s3_key: S3 object key
        
        Returns:
            True if deleted successfully
        """
        try:
            self.s3_client.delete_object(
                Bucket=self.bucket_name,
                Key=s3_key
            )
            
            logger.info(f"File deleted from S3: {s3_key}")
            return True
        
        except ClientError as e:
            logger.error(f"S3 deletion failed: {e}")
            raise Exception(f"Failed to delete file from S3: {str(e)}")
    
    async def file_exists(self, s3_key: str) -> bool:
        """
        Check if file exists in S3.
        
        Args:
            s3_key: S3 object key
        
        Returns:
            True if file exists
        """
        try:
            self.s3_client.head_object(
                Bucket=self.bucket_name,
                Key=s3_key
            )
            return True
        except ClientError:
            return False
    
    async def get_file_metadata(self, s3_key: str) -> Optional[dict]:
        """
        Get file metadata from S3.
        
        Args:
            s3_key: S3 object key
        
        Returns:
            File metadata dict or None
        """
        try:
            response = self.s3_client.head_object(
                Bucket=self.bucket_name,
                Key=s3_key
            )
            
            return {
                "content_type": response.get('ContentType'),
                "content_length": response.get('ContentLength'),
                "last_modified": response.get('LastModified'),
                "metadata": response.get('Metadata', {}),
                "encryption": response.get('ServerSideEncryption')
            }
        
        except ClientError as e:
            logger.error(f"Failed to get file metadata: {e}")
            return None

    def download_file_bytes(self, s3_key: str, bucket_override: Optional[str] = None) -> bytes:
        """Download object body from S3 (sync; use asyncio.to_thread from async callers)."""
        bucket_name = bucket_override or self.bucket_name
        try:
            response = self.s3_client.get_object(Bucket=bucket_name, Key=s3_key)
            return response["Body"].read()
        except ClientError as e:
            logger.error(f"S3 get_object failed for {s3_key}: {e}")
            raise Exception(f"Failed to download file from S3: {str(e)}")

    async def download_file_bytes_async(self, s3_key: str, bucket_override: Optional[str] = None) -> bytes:
        return await asyncio.to_thread(self.download_file_bytes, s3_key, bucket_override)


# Global S3 service instance
s3_service = S3Service()

