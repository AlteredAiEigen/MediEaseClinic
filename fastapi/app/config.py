"""
Configuration management for MediEaseClinic FastAPI application.
Handles environment variables and application settings with HIPAA compliance.
"""

from pydantic_settings import BaseSettings
from typing import List
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings with validation."""
    
    # Application Settings
    app_name: str = "MediEaseClinic API"
    app_version: str = "1.0.0"
    environment: str = "development"
    debug: bool = False
    
    # Server Configuration
    host: str = "0.0.0.0"
    port: int = 8000
    
    # MongoDB Configuration
    mongodb_url: str
    database_name: str = "mediease"
    
    # JWT Configuration
    jwt_secret_key: str
    jwt_refresh_secret_key: str = ""
    jwt_algorithm: str = "HS256"
    # Extend access token lifetime to 24 hours (1440 minutes)
    access_token_expire_minutes: int = 60 * 24
    refresh_token_expire_days: int = 7
    
    # AWS Configuration
    aws_access_key_id: str
    aws_secret_access_key: str
    aws_region: str = "us-east-1"
    s3_bucket_name: str
    s3_transcripts_bucket: str = ""  # Optional separate bucket for transcripts
    aws_s3_presigned_url_expiration: int = 900
    
    # AWS Transcribe Configuration
    aws_transcribe_region: str = ""  # Optional, defaults to aws_region if not set
    aws_transcribe_language_options: str = "en-US,hi-IN"
    aws_transcribe_media_format: str = "mp3"

    # Twilio / WhatsApp Configuration
    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_whatsapp_number: str = "whatsapp:+14155238886"
    
    @property
    def effective_transcribe_region(self) -> str:
        """Get the effective Transcribe region, defaulting to aws_region if not set."""
        return self.aws_transcribe_region or self.aws_region
    
    # OpenAI Configuration
    openai_api_key: str = ""
    openai_model: str = "gpt-4"
    
    # Google Gemini Configuration
    gemini_api_key: str = ""
    gemini_model: str = "gemini-pro"
    
    # Security Settings
    cors_origins: str = "http://localhost:3000,http://localhost:8081,http://localhost:5173,https://app.clinic.alteredai.care"
    allowed_hosts: str = "localhost,127.0.0.1,app.clinic.alteredai.care"
    
    # Rate Limiting
    rate_limit_per_minute: int = 60
    rate_limit_per_hour: int = 1000
    
    # Encryption Settings
    encryption_key: str
    
    # File Upload Settings
    max_upload_size_mb: int = 100
    allowed_audio_formats: str = "mp3,wav,m4a,aac"
    allowed_image_formats: str = "jpg,jpeg,png,pdf"
    
    # HIPAA Audit Logging
    audit_log_enabled: bool = True
    audit_log_level: str = "INFO"
    audit_log_retention_days: int = 2555
    enable_audit_logging: bool = True
    enable_data_masking: bool = True
    phi_encryption_enabled: bool = True
    
    # Recording Retention Policies (in days)
    recording_retention_standard: int = 90
    recording_retention_extended: int = 365
    recording_retention_permanent: int = 0
    
    # Email Configuration
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = "noreply@medieaseclinic.com"
    lead_email_recipient: str = ""
    contact_email_recipient: str = "alteredai@alteredai.care"

    # Frontend + password reset
    frontend_base_url: str = "https://app.clinic.alteredai.care"
    password_reset_route: str = "/reset-password"
    password_reset_token_exp_minutes: int = 60 * 24  # default 24 hours

    # Mailgun / inbound email processing
    mailgun_signing_key: str = ""
    mailgun_allowed_test_tokens: str = ""
    mailgun_expected_recipient_domain: str = "mediease.clinic"
    mailgun_reports_from: str = "Mediease Clinic <reports@mediease.clinic>"
    
    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"  # Ignore extra fields in environment to prevent validation errors
        populate_by_name = True  # Pydantic v2: allow population by field name
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins from comma-separated string."""
        return [origin.strip() for origin in self.cors_origins.split(",")]
    
    @property
    def allowed_hosts_list(self) -> List[str]:
        """Parse allowed hosts from comma-separated string."""
        return [host.strip() for host in self.allowed_hosts.split(",")]
    
    @property
    def transcribe_languages(self) -> List[str]:
        """Parse transcribe language options."""
        return [lang.strip() for lang in self.aws_transcribe_language_options.split(",")]
    
    @property
    def audio_formats_list(self) -> List[str]:
        """Parse allowed audio formats."""
        return [fmt.strip() for fmt in self.allowed_audio_formats.split(",")]
    
    @property
    def image_formats_list(self) -> List[str]:
        """Parse allowed image formats."""
        return [fmt.strip() for fmt in self.allowed_image_formats.split(",")]

    @property
    def password_reset_url(self) -> str:
        """Construct the absolute password reset URL."""
        base = (self.frontend_base_url or "").rstrip("/") or "https://app.clinic.alteredai.care"
        route = self.password_reset_route or "/reset-password"
        if not route.startswith("/"):
            route = f"/{route}"
        return f"{base}{route}"

    @property
    def mailgun_test_tokens(self) -> List[str]:
        """List of tokens that should bypass signature validation (for QA)."""
        if not self.mailgun_allowed_test_tokens:
            return []
        return [
            token.strip()
            for token in self.mailgun_allowed_test_tokens.split(",")
            if token.strip()
        ]


@lru_cache()
def get_settings() -> Settings:
    """
    Create and cache settings instance.
    Using lru_cache to ensure settings are loaded once.
    """
    return Settings()


# Global settings instance
settings = get_settings()

