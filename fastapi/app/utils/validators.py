"""
Custom validators for data validation.
"""

import re
from typing import Optional
from datetime import datetime


def validate_email(email: str) -> bool:
    """
    Validate email format.
    
    Args:
        email: Email address to validate
    
    Returns:
        True if valid email format
    """
    pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'
    return bool(re.match(pattern, email))


def validate_phone(phone: str) -> bool:
    """
    Validate phone number format.
    
    Args:
        phone: Phone number to validate
    
    Returns:
        True if valid phone format
    """
    # Allow digits, spaces, dashes, plus, and parentheses
    pattern = r'^[\d\s\-\+\(\)]+$'
    return bool(re.match(pattern, phone)) and len(phone) >= 10


def validate_password_strength(password: str) -> tuple[bool, Optional[str]]:
    """
    Validate password strength for security.
    Requirements: min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special char
    
    Args:
        password: Password to validate
    
    Returns:
        Tuple of (is_valid, error_message)
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"
    
    if not re.search(r'\d', password):
        return False, "Password must contain at least one digit"
    
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        return False, "Password must contain at least one special character"
    
    return True, None


def validate_date_format(date_str: str, format: str = "%Y-%m-%d") -> bool:
    """
    Validate date string format.
    
    Args:
        date_str: Date string to validate
        format: Expected date format
    
    Returns:
        True if valid date format
    """
    try:
        datetime.strptime(date_str, format)
        return True
    except ValueError:
        return False


def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename for safe storage.
    
    Args:
        filename: Original filename
    
    Returns:
        Sanitized filename
    """
    # Remove any path components
    filename = filename.split('/')[-1].split('\\')[-1]
    
    # Replace special characters with underscores
    filename = re.sub(r'[^\w\s\.-]', '_', filename)
    
    # Remove multiple underscores
    filename = re.sub(r'_+', '_', filename)
    
    return filename


def mask_phi_data(data: str, mask_char: str = "*", visible_chars: int = 4) -> str:
    """
    Mask sensitive PHI data for display.
    Shows only last few characters.
    
    Args:
        data: Data to mask
        mask_char: Character to use for masking
        visible_chars: Number of characters to keep visible
    
    Returns:
        Masked string
    """
    if not data or len(data) <= visible_chars:
        return data
    
    masked_length = len(data) - visible_chars
    return mask_char * masked_length + data[-visible_chars:]

