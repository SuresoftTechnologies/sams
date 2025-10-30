# Authentication & Security Implementation

This document describes the authentication and security implementation for SureSoft SAMS Backend.

## Overview

The authentication system uses JWT (JSON Web Tokens) with access and refresh token pattern:
- **Access Token**: Short-lived token (15 minutes) for API access
- **Refresh Token**: Long-lived token (7 days) for obtaining new access tokens

## Architecture

```
┌─────────────────┐
│  Client/UI      │
└────────┬────────┘
         │ POST /auth/login
         ├──────────────────────────────┐
         │                              │
┌────────▼───────────┐         ┌────────▼─────────┐
│ Auth Endpoints     │────────>│  Auth Service    │
│ (auth.py)          │         │  (auth_service.py)│
└────────────────────┘         └────────┬─────────┘
         │                              │
         │ Headers: Authorization       │ verify_password()
         │ Bearer <token>               │ hash_password()
         │                              │ create_tokens()
┌────────▼───────────┐         ┌────────▼─────────┐
│ Auth Middleware    │────────>│  Security Utils  │
│ (auth.py)          │         │  (security.py)   │
│ - get_current_user │         └──────────────────┘
│ - require_role     │
└────────────────────┘
```

## Components

### 1. Security Utilities (`src/utils/security.py`)

Core security functions for password hashing and JWT management:

```python
from src.utils.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    verify_token,
)

# Hash password
hashed = hash_password("SecurePass123!")

# Verify password
is_valid = verify_password("SecurePass123!", hashed)

# Create tokens
access_token = create_access_token({"sub": user_id, "role": "admin"})
refresh_token = create_refresh_token({"sub": user_id})

# Verify token
payload = verify_token(token, settings.JWT_ACCESS_SECRET)
```

### 2. Auth Middleware (`src/middlewares/auth.py`)

FastAPI dependencies for protecting routes:

```python
from fastapi import Depends
from src.middlewares.auth import get_current_user, require_role
from src.models.user import UserRole

# Require any authenticated user
@router.get("/protected")
async def protected_route(current_user: User = Depends(get_current_user)):
    return {"message": f"Hello {current_user.name}"}

# Require specific role
@router.get("/admin-only")
async def admin_route(current_user: User = Depends(require_role(UserRole.ADMIN))):
    return {"message": "Admin access granted"}

# Require multiple roles
@router.get("/managers")
async def manager_route(
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.MANAGER))
):
    return {"message": "Manager or Admin access"}
```

### 3. Auth Service (`src/services/auth_service.py`)

Business logic for authentication operations:

- `login(db, email, password)` - User login
- `refresh_access_token(db, refresh_token)` - Token refresh
- `change_password(db, user_id, old_password, new_password)` - Password change
- `register_user(db, user_data)` - User registration

### 4. Auth Endpoints (`src/api/v1/endpoints/auth.py`)

RESTful API endpoints:

| Method | Endpoint              | Description                    | Auth Required |
|--------|-----------------------|--------------------------------|---------------|
| POST   | `/auth/login`         | User login                     | No            |
| POST   | `/auth/register`      | Register new user              | No            |
| POST   | `/auth/refresh`       | Refresh access token           | No            |
| POST   | `/auth/logout`        | Logout (token invalidation)    | Yes           |
| GET    | `/auth/me`            | Get current user info          | Yes           |
| PUT    | `/auth/change-password` | Change password              | Yes           |

## API Usage Examples

### 1. Login

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@suresoft.com",
    "password": "SecurePass123!"
  }'
```

Response:
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john.doe@suresoft.com",
    "name": "John Doe",
    "role": "employee",
    "department": "IT",
    "is_active": true,
    "created_at": "2024-01-15T09:00:00Z",
    "updated_at": "2024-01-15T09:00:00Z"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### 2. Register

```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jane.smith@suresoft.com",
    "password": "SecurePass123!",
    "name": "Jane Smith",
    "department": "HR"
  }'
```

### 3. Access Protected Endpoint

```bash
curl -X GET http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 4. Refresh Token

```bash
curl -X POST http://localhost:8000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

### 5. Change Password

```bash
curl -X PUT http://localhost:8000/api/v1/auth/change-password \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "old_password": "OldPass123!",
    "new_password": "NewSecurePass456!"
  }'
```

## Configuration

Required environment variables in `.env`:

```env
# JWT Configuration
JWT_ACCESS_SECRET=your-secret-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-change-in-production
JWT_ALGORITHM=HS256
JWT_ACCESS_EXPIRES_MINUTES=15
JWT_REFRESH_EXPIRES_DAYS=7
```

## Security Best Practices

1. **Password Hashing**: Uses bcrypt with automatic salt generation
2. **Token Expiration**: Short-lived access tokens, longer refresh tokens
3. **HTTPS Only**: Use HTTPS in production for token transmission
4. **Token Storage**:
   - Store access token in memory (React state/context)
   - Store refresh token in httpOnly cookie (recommended) or secure storage
5. **Token Blacklisting**: Implement Redis-based blacklist for logout (TODO)

## Error Handling

### 401 Unauthorized
- Invalid credentials
- Expired or invalid token
- Missing token

### 403 Forbidden
- Inactive user account
- Insufficient permissions (wrong role)

### 400 Bad Request
- Invalid input data
- Email already registered
- Incorrect old password

## User Roles

Three role levels defined in `UserRole` enum:

1. **ADMIN**: Full system access
2. **MANAGER**: Department management, asset approval
3. **EMPLOYEE**: Basic access, asset requests

## Future Enhancements

- [ ] Token blacklisting with Redis for logout
- [ ] Multi-factor authentication (MFA)
- [ ] Email verification for new users
- [ ] Password reset via email
- [ ] Rate limiting on login endpoint
- [ ] Account lockout after failed attempts
- [ ] Session management
- [ ] OAuth2 integration (Google, Microsoft)

## Testing

Example test cases:

```python
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_login_success(client: AsyncClient):
    response = await client.post("/api/v1/auth/login", json={
        "email": "test@example.com",
        "password": "testpass123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data

@pytest.mark.asyncio
async def test_login_invalid_credentials(client: AsyncClient):
    response = await client.post("/api/v1/auth/login", json={
        "email": "test@example.com",
        "password": "wrongpass"
    })
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_protected_endpoint_without_token(client: AsyncClient):
    response = await client.get("/api/v1/auth/me")
    assert response.status_code == 403
```

## Troubleshooting

### Token Expired Error
- Access tokens expire after 15 minutes
- Use refresh token to get new access token
- Implement automatic token refresh in client

### Invalid Token Error
- Check token format (should be "Bearer <token>")
- Verify JWT secret keys match in config
- Ensure token hasn't been tampered with

### Password Hash Verification Fails
- Password hashes are one-way, cannot be decrypted
- Use `verify_password()` function, not direct comparison
- Ensure bcrypt is installed: `pip install passlib[bcrypt]`
