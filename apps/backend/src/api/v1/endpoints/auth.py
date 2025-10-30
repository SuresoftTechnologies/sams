"""
Authentication endpoints.
"""

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from src.database import get_db
from src.middlewares.auth import get_current_user
from src.models.user import User
from src.schemas.auth import (
    LoginRequest,
    LoginResponse,
    RefreshTokenRequest,
    RegisterRequest,
)
from src.schemas.user import User as UserSchema
from src.services import auth_service

router = APIRouter()


@router.post("/login", response_model=LoginResponse)
async def login(
    request: LoginRequest,
    db: AsyncSession = Depends(get_db),
) -> LoginResponse:
    """
    Login endpoint.

    Authenticates user and returns JWT tokens.

    Args:
        request: Login credentials (email and password)
        db: Database session

    Returns:
        LoginResponse with user data, access token, and refresh token

    Raises:
        HTTPException: 401 if credentials are invalid
        HTTPException: 403 if user account is inactive
    """
    return await auth_service.login(
        db=db,
        email=request.email,
        password=request.password,
    )


@router.post("/register", response_model=LoginResponse, status_code=status.HTTP_201_CREATED)
async def register(
    request: RegisterRequest,
    db: AsyncSession = Depends(get_db),
) -> LoginResponse:
    """
    Register new user.

    Creates a new user account and returns JWT tokens.

    Args:
        request: Registration data
        db: Database session

    Returns:
        LoginResponse with new user data and tokens

    Raises:
        HTTPException: 400 if email already exists
    """
    return await auth_service.register_user(db=db, user_data=request)


@router.post("/refresh", response_model=LoginResponse)
async def refresh_token(
    request: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db),
) -> LoginResponse:
    """
    Refresh access token.

    Exchanges refresh token for new access and refresh tokens.

    Args:
        request: Refresh token request
        db: Database session

    Returns:
        LoginResponse with new tokens

    Raises:
        HTTPException: 401 if refresh token is invalid or expired
    """
    return await auth_service.refresh_access_token(
        db=db,
        refresh_token=request.refresh_token,
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    current_user: User = Depends(get_current_user),
) -> None:
    """
    Logout endpoint.

    Invalidates user session and tokens.

    Note: This is a placeholder. In production, you would typically:
    - Add token to blacklist (Redis)
    - Clear client-side tokens
    - Invalidate refresh tokens in database

    Args:
        current_user: Current authenticated user
    """
    # TODO: Implement token blacklisting with Redis
    # For now, client-side should remove tokens
    pass


@router.get("/me", response_model=UserSchema)
async def get_current_user_info(
    current_user: User = Depends(get_current_user),
) -> UserSchema:
    """
    Get current authenticated user information.

    Args:
        current_user: Current authenticated user from JWT

    Returns:
        User schema with current user data
    """
    return UserSchema.model_validate(current_user)


class ChangePasswordRequest(BaseModel):
    """Change password request schema."""

    old_password: str = Field(..., min_length=1, description="Current password")
    new_password: str = Field(..., min_length=8, description="New password")

    class Config:
        json_schema_extra = {
            "example": {
                "old_password": "OldPass123!",
                "new_password": "NewSecurePass456!",
            }
        }


@router.put("/change-password", response_model=UserSchema)
async def change_password(
    request: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserSchema:
    """
    Change user password.

    Args:
        request: Password change request
        current_user: Current authenticated user
        db: Database session

    Returns:
        Updated user schema

    Raises:
        HTTPException: 400 if old password is incorrect
    """
    updated_user = await auth_service.change_password(
        db=db,
        user_id=current_user.id,
        old_password=request.old_password,
        new_password=request.new_password,
    )

    return UserSchema.model_validate(updated_user)
