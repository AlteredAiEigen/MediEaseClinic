"""
AWS S3 service for secure file storage with HIPAA compliance.
"""

import boto3
from botocore.exceptions import ClientError
from typing import Optional
import logging
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
        folder: str = "uploads"
    ) -> dict:
        """
        Upload file to S3 with server-side encryption.
        
        Args:
            file_content: File content as bytes
            file_name: Original file name
            content_type: MIME type
            folder: S3 folder path
        
        Returns:
            dict with s3_key and file_url
        """
        try:
            # Generate unique S3 key
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            s3_key = f"{folder}/{timestamp}_{file_name}"
            
            # Upload with server-side encryption (SSE-S3)
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=s3_key,
                Body=file_content,
                ContentType=content_type,
                ServerSideEncryption='AES256',  # SSE-S3 encryption
                Metadata={
                    'uploaded-at': datetime.now().isoformat(),
                    'original-filename': file_name
                }
            )
            
            # Generate file URL
            file_url = f"https://{self.bucket_name}.s3.{settings.aws_region}.amazonaws.com/{s3_key}"
            
            logger.info(f"File uploaded successfully to S3: {s3_key}")
            
            return {
                "s3_key": s3_key,
                "file_url": file_url,
                "bucket": self.bucket_name
            }
        
        except ClientError as e:
            logger.error(f"S3 upload failed: {e}")
            raise Exception(f"Failed to upload file to S3: {str(e)}")
    
    async def generate_presigned_url(
        self,
        s3_key: str,
        expiration: int = None
    ) -> str:
        """
        Generate presigned URL for temporary file access.
        
        Args:
            s3_key: S3 object key
            expiration: URL expiration time in seconds (default from settings)
        
        Returns:
            Presigned URL
        """
        if expiration is None:
            expiration = settings.aws_s3_presigned_url_expiration
        
        try:
            presigned_url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket': self.bucket_name,
                    'Key': s3_key
                },
                ExpiresIn=expiration
            )
            
            logger.info(f"Generated presigned URL for: {s3_key}")
            return presigned_url
        
        except ClientError as e:
            logger.error(f"Failed to generate presigned URL: {e}")
            raise Exception(f"Failed to generate presigned URL: {str(e)}")
    
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


# Global S3 service instance
s3_service = S3Service()

