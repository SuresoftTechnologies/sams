"""
User management endpoints.
"""

from fastapi import APIRouter, HTTPException, status

from src.schemas.user import User, CreateUserRequest, UpdateUserRequest

router = APIRouter()


@router.get("", response_model=list[User])
async def get_users() -> list[User]:
    """Get all users."""
    # TODO: Implement user listing
    return []


@router.get("/{user_id}", response_model=User)
async def get_user(user_id: str) -> User:
    """Get user by ID."""
    # TODO: Implement user retrieval
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="User not found"
    )


@router.post("", response_model=User, status_code=status.HTTP_201_CREATED)
async def create_user(request: CreateUserRequest) -> User:
    """Create new user."""
    # TODO: Implement user creation
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Create user endpoint not yet implemented"
    )


@router.patch("/{user_id}", response_model=User)
async def update_user(user_id: str, request: UpdateUserRequest) -> User:
    """Update user."""
    # TODO: Implement user update
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="User not found"
    )


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: str) -> None:
    """Delete user."""
    # TODO: Implement user deletion
    pass
