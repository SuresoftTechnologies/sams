"""
Authentication middleware and dependencies.
"""

from typing import Callable

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.config import settings
from src.database import get_db
from src.models.user import User, UserRole
from src.utils.security import verify_token

# HTTP Bearer token security scheme
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Dependency to get the current authenticated user from JWT token.

    Args:
        credentials: HTTP Authorization credentials (Bearer token)
        db: Database session

    Returns:
        Current authenticated User object

    Raises:
        HTTPException: 401 if token is invalid or user not found
        HTTPException: 403 if user is inactive
    """
    # Extract token from credentials
    token = credentials.credentials

    # Define credentials exception
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # Verify and decode token
        payload = verify_token(token, settings.JWT_ACCESS_SECRET)
        user_id: str = payload.get("sub")

        if user_id is None:
            raise credentials_exception

    except JWTError:
        raise credentials_exception

    # Query user from database
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()

    if user is None:
        raise credentials_exception

    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user account",
        )

    return user


def require_role(*roles: UserRole) -> Callable:
    """
    Dependency factory to require specific user roles.

    Usage:
        @router.get("/admin-only")
        async def admin_only(
            current_user: User = Depends(require_role(UserRole.ADMIN))
        ):
            ...

    Args:
        *roles: Variable number of UserRole enums that are allowed

    Returns:
        Dependency function that checks user role
    """

    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        """
        Check if current user has required role.

        Args:
            current_user: Current authenticated user

        Returns:
            Current user if role is valid

        Raises:
            HTTPException: 403 if user doesn't have required role
        """
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required roles: {[role.value for role in roles]}",
            )
        return current_user

    return role_checker


async def get_optional_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(
        HTTPBearer(auto_error=False)
    ),
    db: AsyncSession = Depends(get_db),
) -> User | None:
    """
    Dependency to get the current user if token is provided, otherwise None.

    Useful for endpoints that can work with or without authentication.

    Args:
        credentials: Optional HTTP Authorization credentials
        db: Database session

    Returns:
        User object if authenticated, None otherwise
    """
    if credentials is None:
        return None

    try:
        token = credentials.credentials
        payload = verify_token(token, settings.JWT_ACCESS_SECRET)
        user_id: str = payload.get("sub")

        if user_id is None:
            return None

        result = await db.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()

        if user and user.is_active:
            return user

    except JWTError:
        return None

    return None
