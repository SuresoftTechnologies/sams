"""
Authentication schemas matching TypeScript shared-types.
"""

from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, ConfigDict

from src.schemas.user import User, UserRole


class LoginRequest(BaseModel):
    """Login request DTO - matches @sams/shared-types LoginDto."""

    email: EmailStr = Field(..., description="Email address")
    password: str = Field(..., min_length=1, description="Password")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "email": "john.doe@suresoft.com",
                "password": "SecurePass123!",
            }
        }
    )


class RegisterRequest(BaseModel):
    """Register request DTO."""

    email: EmailStr = Field(..., description="Email address")
    password: str = Field(..., min_length=8, description="Password")
    name: str = Field(..., min_length=1, max_length=100, description="Full name")
    employee_id: str | None = Field(None, max_length=50, description="Employee ID")
    department: str | None = Field(None, max_length=100, description="Department")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "email": "john.doe@suresoft.com",
                "password": "SecurePass123!",
                "name": "John Doe",
                "employee_id": "EMP-2024-001",
                "department": "IT",
            }
        }
    )


class TokenPair(BaseModel):
    """JWT token pair."""

    access_token: str = Field(..., description="JWT access token")
    refresh_token: str = Field(..., description="JWT refresh token")
    token_type: str = Field(default="bearer", description="Token type")


class LoginResponse(BaseModel):
    """
    Login response DTO - matches @sams/shared-types LoginResponse.
    """

    user: User = Field(..., description="Authenticated user")
    access_token: str = Field(..., description="JWT access token")
    refresh_token: str = Field(..., description="JWT refresh token")
    token_type: str = Field(default="bearer", description="Token type")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "user": {
                    "id": "550e8400-e29b-41d4-a716-446655440000",
                    "email": "john.doe@suresoft.com",
                    "name": "John Doe",
                    "role": "employee",
                    "department": "IT",
                    "employee_id": "EMP-2024-001",
                    "is_active": True,
                    "created_at": "2024-01-15T09:00:00Z",
                    "updated_at": "2024-01-15T09:00:00Z",
                },
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer",
            }
        }
    )


class TokenPayload(BaseModel):
    """JWT token payload."""

    sub: str = Field(..., description="Subject (user ID)")
    exp: datetime = Field(..., description="Expiration time")
    role: UserRole = Field(..., description="User role")
    email: str | None = Field(None, description="User email")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "sub": "550e8400-e29b-41d4-a716-446655440000",
                "exp": "2024-01-15T10:00:00Z",
                "role": "employee",
                "email": "john.doe@suresoft.com",
            }
        }
    )


class RefreshTokenRequest(BaseModel):
    """Refresh token request."""

    refresh_token: str = Field(..., description="Refresh token")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            }
        }
    )
