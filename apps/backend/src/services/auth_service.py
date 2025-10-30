"""
Authentication service for login, registration, and password management.
"""

import uuid
from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.config import settings
from src.models.user import User, UserRole
from src.schemas.auth import LoginResponse, RegisterRequest
from src.schemas.user import User as UserSchema
from src.utils.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
    verify_token,
)


async def login(
    db: AsyncSession,
    email: str,
    password: str,
) -> LoginResponse:
    """
    Authenticate user and generate JWT tokens.

    Args:
        db: Database session
        email: User email
        password: Plain text password

    Returns:
        LoginResponse with user data and tokens

    Raises:
        HTTPException: 401 if credentials are invalid
        HTTPException: 403 if user is inactive
    """
    # Find user by email
    result = await db.execute(
        select(User).where(User.email == email)
    )
    user = result.scalar_one_or_none()

    # Verify user exists and password is correct
    if user is None or not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    # Update last login timestamp
    user.last_login_at = datetime.now(UTC)
    await db.commit()
    await db.refresh(user)

    # Create token payload
    token_data = {
        "sub": user.id,
        "email": user.email,
        "role": user.role if isinstance(user.role, str) else user.role.value,
    }

    # Generate tokens
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token({"sub": user.id})

    # Convert user model to schema
    user_schema = UserSchema.from_model(user)

    return LoginResponse(
        user=user_schema,
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
    )


async def refresh_access_token(
    db: AsyncSession,
    refresh_token: str,
) -> LoginResponse:
    """
    Generate new access token using refresh token.

    Args:
        db: Database session
        refresh_token: Valid refresh token

    Returns:
        LoginResponse with new tokens

    Raises:
        HTTPException: 401 if refresh token is invalid
    """
    try:
        # Verify refresh token
        payload = verify_token(refresh_token, settings.JWT_REFRESH_SECRET)
        user_id: str = payload.get("sub")

        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
            )

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    # Get user from database
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    # Create new tokens
    token_data = {
        "sub": user.id,
        "email": user.email,
        "role": user.role if isinstance(user.role, str) else user.role.value,
    }

    access_token = create_access_token(token_data)
    new_refresh_token = create_refresh_token({"sub": user.id})

    # Convert user model to schema
    user_schema = UserSchema.from_model(user)

    return LoginResponse(
        user=user_schema,
        access_token=access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
    )


async def change_password(
    db: AsyncSession,
    user_id: str,
    old_password: str,
    new_password: str,
) -> User:
    """
    Change user password after verifying old password.

    Args:
        db: Database session
        user_id: User ID
        old_password: Current password
        new_password: New password to set

    Returns:
        Updated User object

    Raises:
        HTTPException: 404 if user not found
        HTTPException: 400 if old password is incorrect
    """
    # Get user from database
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Verify old password
    if not verify_password(old_password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password",
        )

    # Update password
    user.password_hash = hash_password(new_password)
    user.updated_at = datetime.now(UTC)

    await db.commit()
    await db.refresh(user)

    return user


async def register_user(
    db: AsyncSession,
    user_data: RegisterRequest,
) -> LoginResponse:
    """
    Register a new user account.

    Args:
        db: Database session
        user_data: Registration data

    Returns:
        LoginResponse with new user and tokens

    Raises:
        HTTPException: 400 if email already exists
    """
    # Check if email already exists
    result = await db.execute(
        select(User).where(User.email == user_data.email)
    )
    existing_user = result.scalar_one_or_none()

    if existing_user is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Create new user
    new_user = User(
        id=str(uuid.uuid4()),
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        name=user_data.name,
        role=UserRole.EMPLOYEE,  # Default role
        department=user_data.department,
        is_active=True,
        is_verified=False,
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    # Create token payload
    token_data = {
        "sub": new_user.id,
        "email": new_user.email,
        "role": new_user.role if isinstance(new_user.role, str) else new_user.role.value,
    }

    # Generate tokens
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token({"sub": new_user.id})

    # Convert user model to schema
    user_schema = UserSchema.from_model(new_user)

    return LoginResponse(
        user=user_schema,
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
    )
