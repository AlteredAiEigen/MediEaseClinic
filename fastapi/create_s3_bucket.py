"""
Script to create S3 bucket for MediEase Clinic if it doesn't exist.
"""

import boto3
from botocore.exceptions import ClientError
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID", "").strip('"')
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY", "").strip('"')
AWS_REGION = os.getenv("AWS_REGION", "us-east-1").strip('"')
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME", "mediease-clinic-files").strip('"')

def create_bucket_if_not_exists():
    """Create S3 bucket if it doesn't exist."""
    try:
        s3_client = boto3.client(
            's3',
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
            region_name=AWS_REGION
        )
        
        # Check if bucket exists
        try:
            s3_client.head_bucket(Bucket=S3_BUCKET_NAME)
            print(f"✓ Bucket '{S3_BUCKET_NAME}' already exists")
            return True
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == '404':
                # Bucket doesn't exist, create it
                print(f"Creating bucket '{S3_BUCKET_NAME}' in region '{AWS_REGION}'...")
                
                if AWS_REGION == 'us-east-1':
                    # us-east-1 doesn't need LocationConstraint
                    s3_client.create_bucket(Bucket=S3_BUCKET_NAME)
                else:
                    s3_client.create_bucket(
                        Bucket=S3_BUCKET_NAME,
                        CreateBucketConfiguration={'LocationConstraint': AWS_REGION}
                    )
                
                # Enable versioning (optional but recommended)
                s3_client.put_bucket_versioning(
                    Bucket=S3_BUCKET_NAME,
                    VersioningConfiguration={'Status': 'Enabled'}
                )
                
                # Enable encryption
                s3_client.put_bucket_encryption(
                    Bucket=S3_BUCKET_NAME,
                    ServerSideEncryptionConfiguration={
                        'Rules': [{
                            'ApplyServerSideEncryptionByDefault': {
                                'SSEAlgorithm': 'AES256'
                            }
                        }]
                    }
                )
                
                # Block public access (security best practice)
                s3_client.put_public_access_block(
                    Bucket=S3_BUCKET_NAME,
                    PublicAccessBlockConfiguration={
                        'BlockPublicAcls': True,
                        'IgnorePublicAcls': True,
                        'BlockPublicPolicy': True,
                        'RestrictPublicBuckets': True
                    }
                )
                
                print(f"✓ Bucket '{S3_BUCKET_NAME}' created successfully!")
                print(f"  - Region: {AWS_REGION}")
                print(f"  - Versioning: Enabled")
                print(f"  - Encryption: AES256")
                print(f"  - Public Access: Blocked")
                return True
            else:
                print(f"✗ Error checking bucket: {e}")
                return False
                
    except Exception as e:
        print(f"✗ Failed to create bucket: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("S3 Bucket Creation Script")
    print("=" * 60)
    print(f"\nBucket Name: {S3_BUCKET_NAME}")
    print(f"Region: {AWS_REGION}")
    print(f"Access Key: {AWS_ACCESS_KEY_ID[:10]}...")
    print()
    
    if create_bucket_if_not_exists():
        print("\n✓ Setup complete! You can now test the transcription flow.")
    else:
        print("\n✗ Setup failed. Please check your AWS credentials and permissions.")

