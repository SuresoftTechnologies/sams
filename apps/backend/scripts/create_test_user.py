#!/usr/bin/env python3
"""
Script to create a test user for development/testing purposes.

Usage:
    python scripts/create_test_user.py
"""

import asyncio
import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select
from src.database import AsyncSessionLocal, init_db
from src.models.user import User, UserRole
from src.utils.security import hash_password
import uuid
from datetime import datetime, timezone


async def create_test_user(
    email: str = "admin@suresoft.com",
    password: str = "admin123!",
    name: str = "Admin User",
    role: UserRole = UserRole.ADMIN,
):
    """Create a test user in the database."""

    # Initialize database if not exists
    print("🔧 Initializing database...")
    await init_db()

    async with AsyncSessionLocal() as db:
        # Check if user already exists
        result = await db.execute(
            select(User).where(User.email == email)
        )
        existing_user = result.scalar_one_or_none()

        if existing_user:
            print(f"⚠️  User with email {email} already exists!")
            print(f"   ID: {existing_user.id}")
            print(f"   Name: {existing_user.name}")
            print(f"   Role: {existing_user.role.value}")
            return existing_user

        # Create new user
        new_user = User(
            id=str(uuid.uuid4()),
            email=email,
            password_hash=hash_password(password),
            name=name,
            role=role,
            department="IT",
            is_active=True,
            is_verified=True,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )

        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)

        print(f"✅ Test user created successfully!")
        print(f"   ID: {new_user.id}")
        print(f"   Email: {new_user.email}")
        print(f"   Password: {password}")
        print(f"   Name: {new_user.name}")
        print(f"   Role: {new_user.role.value}")
        print(f"\n📝 You can now login with:")
        print(f"   Email: {email}")
        print(f"   Password: {password}")

        return new_user


async def create_multiple_test_users():
    """Create multiple test users with different roles."""

    users = [
        {
            "email": "admin@suresoft.com",
            "password": "admin123!",
            "name": "Admin User",
            "role": UserRole.ADMIN,
        },
        {
            "email": "manager@suresoft.com",
            "password": "manager123!",
            "name": "Manager User",
            "role": UserRole.MANAGER,
        },
        {
            "email": "employee@suresoft.com",
            "password": "employee123!",
            "name": "Employee User",
            "role": UserRole.EMPLOYEE,
        },
    ]

    print("=" * 60)
    print("Creating Test Users for SureSoft AMS")
    print("=" * 60)
    print()

    for user_data in users:
        await create_test_user(**user_data)
        print()


if __name__ == "__main__":
    asyncio.run(create_multiple_test_users())
