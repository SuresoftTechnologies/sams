"""
Tests for authentication functionality.
"""

from datetime import UTC, datetime, timedelta

import pytest

from src.config import settings
from src.utils.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
    verify_token,
)


class TestPasswordHashing:
    """Test password hashing and verification."""

    def test_hash_password(self):
        """Test password hashing."""
        password = "SecurePass123!"
        hashed = hash_password(password)

        assert hashed != password
        assert len(hashed) > 0
        assert hashed.startswith("$2b$")  # bcrypt prefix

    def test_verify_password_success(self):
        """Test successful password verification."""
        password = "SecurePass123!"
        hashed = hash_password(password)

        assert verify_password(password, hashed) is True

    def test_verify_password_failure(self):
        """Test failed password verification."""
        password = "SecurePass123!"
        wrong_password = "WrongPass456!"
        hashed = hash_password(password)

        assert verify_password(wrong_password, hashed) is False

    def test_same_password_different_hashes(self):
        """Test that same password produces different hashes (due to salt)."""
        password = "SecurePass123!"
        hash1 = hash_password(password)
        hash2 = hash_password(password)

        assert hash1 != hash2
        assert verify_password(password, hash1) is True
        assert verify_password(password, hash2) is True


class TestJWTTokens:
    """Test JWT token creation and verification."""

    def test_create_access_token(self):
        """Test access token creation."""
        data = {"sub": "user123", "role": "admin"}
        token = create_access_token(data)

        assert isinstance(token, str)
        assert len(token) > 0

    def test_create_refresh_token(self):
        """Test refresh token creation."""
        data = {"sub": "user123"}
        token = create_refresh_token(data)

        assert isinstance(token, str)
        assert len(token) > 0

    def test_verify_access_token(self):
        """Test access token verification."""
        data = {"sub": "user123", "role": "admin", "email": "test@example.com"}
        token = create_access_token(data)

        payload = verify_token(token, settings.JWT_ACCESS_SECRET)

        assert payload["sub"] == "user123"
        assert payload["role"] == "admin"
        assert payload["email"] == "test@example.com"
        assert "exp" in payload

    def test_verify_refresh_token(self):
        """Test refresh token verification."""
        data = {"sub": "user123"}
        token = create_refresh_token(data)

        payload = verify_token(token, settings.JWT_REFRESH_SECRET)

        assert payload["sub"] == "user123"
        assert "exp" in payload

    def test_verify_token_with_wrong_secret(self):
        """Test token verification with wrong secret fails."""
        from jose import JWTError

        data = {"sub": "user123"}
        token = create_access_token(data)

        with pytest.raises(JWTError):
            verify_token(token, "wrong-secret")

    def test_token_expiration_in_payload(self):
        """Test that token contains expiration time."""
        data = {"sub": "user123"}
        token = create_access_token(data)

        payload = verify_token(token, settings.JWT_ACCESS_SECRET)
        exp_timestamp = payload["exp"]

        # Convert to datetime
        exp_datetime = datetime.fromtimestamp(exp_timestamp, tz=UTC)
        now = datetime.now(UTC)

        # Should expire in approximately JWT_ACCESS_EXPIRES_MINUTES
        time_diff = exp_datetime - now
        expected_diff = timedelta(minutes=settings.JWT_ACCESS_EXPIRES_MINUTES)

        # Allow 10 second tolerance
        assert abs(time_diff.total_seconds() - expected_diff.total_seconds()) < 10


# Async tests for API endpoints would go here
# These require a test database and async test client setup

"""
Example async test structure:

@pytest.mark.asyncio
async def test_login_success(async_client, test_user):
    response = await async_client.post("/api/v1/auth/login", json={
        "email": test_user.email,
        "password": "testpass123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["user"]["email"] == test_user.email

@pytest.mark.asyncio
async def test_get_current_user(async_client, authenticated_user):
    headers = {"Authorization": f"Bearer {authenticated_user.access_token}"}
    response = await async_client.get("/api/v1/auth/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == authenticated_user.email
"""
