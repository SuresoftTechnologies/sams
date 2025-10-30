"""
Application configuration using Pydantic Settings.
"""

from typing import Literal

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # Application
    APP_ENV: Literal["development", "staging", "production"] = "development"
    APP_DEBUG: bool = True
    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 8000

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://sams:sams@localhost:5432/sams"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # JWT
    JWT_ACCESS_SECRET: str = "change-me-in-production"
    JWT_REFRESH_SECRET: str = "change-me-in-production"
    JWT_ACCESS_EXPIRES_MINUTES: int = 15
    JWT_REFRESH_EXPIRES_DAYS: int = 7
    JWT_ALGORITHM: str = "HS256"

    # CORS
    CORS_ORIGINS: str | list[str] = "http://localhost:5173,http://localhost:3000"

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        """Parse CORS_ORIGINS from comma-separated string or list."""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v

    # Storage
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE_MB: int = 10

    # QR Code
    QR_CODE_BASE_URL: str = "http://localhost:5173/assets"
    APP_FRONTEND_URL: str = "http://localhost:5173"

    # Email (SMTP)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = ""
    SMTP_FROM_NAME: str = "SureSoft AMS"
    SMTP_USE_TLS: bool = True

    # DeepSeek OCR API (Vision 모델)
    DEEPSEEK_API_BASE: str = "http://10.10.10.200:19751/v1"
    DEEPSEEK_OCR_MODEL: str = "deepseek-ai/DeepSeek-OCR"  # Vision 모델 (OCR용)
    DEEPSEEK_API_KEY: str = "EMPTY"
    DEEPSEEK_TIMEOUT: int = 60

    # Qwen Chat API (텍스트 분석용)
    QWEN_API_BASE: str = "http://10.10.10.200:19750/v1"
    QWEN_CHAT_MODEL: str = "Qwen/Qwen3-32B"  # Chat 모델 (텍스트 분석용)
    QWEN_API_KEY: str = "EMPTY"
    QWEN_TIMEOUT: int = 60

    # Receipt Analysis Settings
    USE_VISION_FOR_ANALYSIS: bool = False  # True: Vision 직접 분석, False: Chat 모델 사용 (권장)
    
    # OCR Settings
    DEFAULT_OCR_METHOD: str = "deepseek"  # Only DeepSeek OCR is supported
    OCR_LANGUAGE: str = "kor+eng"  # Not used for DeepSeek (kept for backward compatibility)

    @property
    def MAX_UPLOAD_SIZE_BYTES(self) -> int:
        """Convert MB to bytes."""
        return self.MAX_UPLOAD_SIZE_MB * 1024 * 1024


# Global settings instance
settings = Settings()
