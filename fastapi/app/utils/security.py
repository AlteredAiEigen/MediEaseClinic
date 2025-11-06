"""
Security utilities for password hashing, JWT tokens, and encryption.
"""

from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional, Dict
from cryptography.fernet import Fernet
import base64
import hashlib

from app.config import settings

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """
    Hash a password using bcrypt.
    
    Args:
        password: Plain text password
    
    Returns:
        Hashed password string
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against its hash.
    
    Args:
        plain_password: Plain text password to verify
        hashed_password: Hashed password from database
    
    Returns:
        True if password matches, False otherwise
    """
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: Dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create JWT access token.
    
    Args:
        data: Data to encode in token (typically user_id, role)
        expires_delta: Optional custom expiration time
    
    Returns:
        Encoded JWT token
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "access"
    })
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm
    )
    
    return encoded_jwt


def create_refresh_token(data: Dict) -> str:
    """
    Create JWT refresh token with longer expiration.
    
    Args:
        data: Data to encode in token
    
    Returns:
        Encoded JWT refresh token
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.refresh_token_expire_days)
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "refresh"
    })
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm
    )
    
    return encoded_jwt


def decode_token(token: str) -> Optional[Dict]:
    """
    Decode and verify JWT token.
    
    Args:
        token: JWT token to decode
    
    Returns:
        Decoded token payload or None if invalid
    """
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm]
        )
        return payload
    except JWTError:
        return None


class FieldEncryption:
    """
    Field-level encryption for sensitive PHI data.
    Uses Fernet (symmetric encryption) for HIPAA compliance.
    """
    
    def __init__(self):
        """Initialize encryption with key from settings."""
        # Derive a proper Fernet key from encryption_key
        key = hashlib.sha256(settings.encryption_key.encode()).digest()
        self.fernet = Fernet(base64.urlsafe_b64encode(key))
    
    def encrypt(self, data: str) -> str:
        """
        Encrypt sensitive data.
        
        Args:
            data: Plain text data to encrypt
        
        Returns:
            Encrypted data as string
        """
        if not data:
            return data
        
        encrypted_bytes = self.fernet.encrypt(data.encode())
        return base64.urlsafe_b64encode(encrypted_bytes).decode()
    
    def decrypt(self, encrypted_data: str) -> str:
        """
        Decrypt sensitive data.
        
        Args:
            encrypted_data: Encrypted data string
        
        Returns:
            Decrypted plain text
        """
        if not encrypted_data:
            return encrypted_data
        
        try:
            encrypted_bytes = base64.urlsafe_b64decode(encrypted_data.encode())
            decrypted_bytes = self.fernet.decrypt(encrypted_bytes)
            return decrypted_bytes.decode()
        except Exception:
            # Return encrypted data if decryption fails (data might not be encrypted)
            return encrypted_data
    
    def encrypt_dict_fields(self, data: Dict, fields: list) -> Dict:
        """
        Encrypt specific fields in a dictionary.
        
        Args:
            data: Dictionary containing data
            fields: List of field names to encrypt
        
        Returns:
            Dictionary with encrypted fields
        """
        result = data.copy()
        for field in fields:
            if field in result and result[field]:
                result[field] = self.encrypt(str(result[field]))
        return result
    
    def decrypt_dict_fields(self, data: Dict, fields: list) -> Dict:
        """
        Decrypt specific fields in a dictionary.
        
        Args:
            data: Dictionary containing encrypted data
            fields: List of field names to decrypt
        
        Returns:
            Dictionary with decrypted fields
        """
        result = data.copy()
        for field in fields:
            if field in result and result[field]:
                result[field] = self.decrypt(result[field])
        return result


# Global encryption instance
field_encryption = FieldEncryption()

