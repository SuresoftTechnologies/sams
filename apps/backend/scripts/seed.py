#!/usr/bin/env python3
"""
Database seeding script for SureSoft AMS.

This script creates initial data including:
- Admin, Manager, and Employee users
- Default asset categories
- Default locations (판교 and 대전 offices)

Usage:
    uv run python scripts/seed.py
    or
    npm run db:seed
"""

import asyncio
import os
import uuid
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.config import settings
from src.database import AsyncSessionLocal
from src.models.category import Category
from src.models.location import Location
from src.models.user import User, UserRole
from src.utils.security import hash_password


async def seed_users(db: AsyncSession) -> dict[str, User]:
    """
    Seed initial users: admin, manager, and employee.

    Returns:
        Dictionary of created users by role
    """
    print("\n📝 Seeding users...")

    # Get admin password from environment or use default
    admin_password = os.getenv("ADMIN_PASSWORD", "admin123!")

    users_data = [
        {
            "id": str(uuid.uuid4()),
            "email": "admin@suresoft.com",
            "password": admin_password,
            "name": "시스템 관리자",
            "role": UserRole.ADMIN,
            "department": "IT관리팀",
            "phone": "02-1234-5678",
            "is_active": True,
            "is_verified": True,
        },
        {
            "id": str(uuid.uuid4()),
            "email": "manager@suresoft.com",
            "password": "manager123!",
            "name": "자산관리자",
            "role": UserRole.MANAGER,
            "department": "자산관리팀",
            "phone": "02-1234-5679",
            "is_active": True,
            "is_verified": True,
        },
        {
            "id": str(uuid.uuid4()),
            "email": "employee@suresoft.com",
            "password": "employee123!",
            "name": "일반사용자",
            "role": UserRole.EMPLOYEE,
            "department": "개발팀",
            "phone": "02-1234-5680",
            "is_active": True,
            "is_verified": True,
        },
    ]

    created_users = {}

    for user_data in users_data:
        # Check if user already exists
        result = await db.execute(select(User).where(User.email == user_data["email"]))
        existing_user = result.scalar_one_or_none()

        if existing_user:
            print(f"  ⏭️  User {user_data['email']} already exists, skipping...")
            created_users[user_data["role"]] = existing_user
            continue

        # Create new user
        password = user_data.pop("password")
        user = User(
            **user_data,
            password_hash=hash_password(password),
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )

        db.add(user)
        created_users[user_data["role"]] = user
        print(f"  ✓ Created user: {user.email} ({user.role})")

    await db.commit()
    print(f"✅ Users seeded successfully ({len(created_users)} users)")
    return created_users


async def seed_categories(db: AsyncSession) -> list[Category]:
    """
    Seed default asset categories.

    Returns:
        List of created categories
    """
    print("\n📝 Seeding categories...")

    categories_data = [
        {
            "id": str(uuid.uuid4()),
            "name": "데스크탑",
            "code": "DESKTOP",
            "description": "데스크탑 컴퓨터",
            "icon": "computer",
            "color": "#3B82F6",
            "is_active": True,
        },
        {
            "id": str(uuid.uuid4()),
            "name": "노트북",
            "code": "LAPTOP",
            "description": "노트북 컴퓨터",
            "icon": "laptop",
            "color": "#8B5CF6",
            "is_active": True,
        },
        {
            "id": str(uuid.uuid4()),
            "name": "모니터",
            "code": "MONITOR",
            "description": "디스플레이 모니터",
            "icon": "monitor",
            "color": "#10B981",
            "is_active": True,
        },
        {
            "id": str(uuid.uuid4()),
            "name": "키보드",
            "code": "KEYBOARD",
            "description": "키보드 및 입력장치",
            "icon": "keyboard",
            "color": "#F59E0B",
            "is_active": True,
        },
        {
            "id": str(uuid.uuid4()),
            "name": "마우스",
            "code": "MOUSE",
            "description": "마우스 및 포인팅 장치",
            "icon": "mouse",
            "color": "#EF4444",
            "is_active": True,
        },
        {
            "id": str(uuid.uuid4()),
            "name": "프린터",
            "code": "PRINTER",
            "description": "프린터 및 복합기",
            "icon": "printer",
            "color": "#6366F1",
            "is_active": True,
        },
        {
            "id": str(uuid.uuid4()),
            "name": "네트워크장비",
            "code": "NETWORK",
            "description": "스위치, 라우터 등 네트워크 장비",
            "icon": "network",
            "color": "#14B8A6",
            "is_active": True,
        },
        {
            "id": str(uuid.uuid4()),
            "name": "모바일기기",
            "code": "MOBILE",
            "description": "스마트폰, 태블릿 등",
            "icon": "smartphone",
            "color": "#EC4899",
            "is_active": True,
        },
        {
            "id": str(uuid.uuid4()),
            "name": "주변기기",
            "code": "PERIPHERAL",
            "description": "기타 주변기기",
            "icon": "device",
            "color": "#84CC16",
            "is_active": True,
        },
        {
            "id": str(uuid.uuid4()),
            "name": "서버",
            "code": "SERVER",
            "description": "서버 및 저장장치",
            "icon": "server",
            "color": "#06B6D4",
            "is_active": True,
        },
    ]

    created_categories = []

    for category_data in categories_data:
        # Check if category already exists
        result = await db.execute(select(Category).where(Category.code == category_data["code"]))
        existing_category = result.scalar_one_or_none()

        if existing_category:
            print(f"  ⏭️  Category {category_data['name']} already exists, skipping...")
            created_categories.append(existing_category)
            continue

        # Create new category
        category = Category(
            **category_data,
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )

        db.add(category)
        created_categories.append(category)
        print(f"  ✓ Created category: {category.name} ({category.code})")

    await db.commit()
    print(f"✅ Categories seeded successfully ({len(created_categories)} categories)")
    return created_categories


async def seed_locations(db: AsyncSession) -> list[Location]:
    """
    Seed default locations for 판교 and 대전 offices.

    Returns:
        List of created locations
    """
    print("\n📝 Seeding locations...")

    locations_data = [
        # 판교 오피스
        {
            "id": str(uuid.uuid4()),
            "name": "판교 본관",
            "code": "PG-MAIN",
            "site": "판교",
            "building": "본관",
            "floor": None,
            "room": None,
            "description": "경기도 성남시 분당구 판교역로 판교 본관",
            "is_active": True,
        },
        {
            "id": str(uuid.uuid4()),
            "name": "판교 본관 1층",
            "code": "PG-MAIN-1F",
            "site": "판교",
            "building": "본관",
            "floor": "1F",
            "room": None,
            "description": "판교 본관 1층",
            "is_active": True,
        },
        {
            "id": str(uuid.uuid4()),
            "name": "판교 본관 2층",
            "code": "PG-MAIN-2F",
            "site": "판교",
            "building": "본관",
            "floor": "2F",
            "room": None,
            "description": "판교 본관 2층",
            "is_active": True,
        },
        {
            "id": str(uuid.uuid4()),
            "name": "판교 본관 3층",
            "code": "PG-MAIN-3F",
            "site": "판교",
            "building": "본관",
            "floor": "3F",
            "room": None,
            "description": "판교 본관 3층",
            "is_active": True,
        },
        {
            "id": str(uuid.uuid4()),
            "name": "판교 연구동",
            "code": "PG-RND",
            "site": "판교",
            "building": "연구동",
            "floor": None,
            "room": None,
            "description": "판교 연구동",
            "is_active": True,
        },
        {
            "id": str(uuid.uuid4()),
            "name": "판교 연구동 1층",
            "code": "PG-RND-1F",
            "site": "판교",
            "building": "연구동",
            "floor": "1F",
            "room": None,
            "description": "판교 연구동 1층",
            "is_active": True,
        },
        {
            "id": str(uuid.uuid4()),
            "name": "판교 연구동 2층",
            "code": "PG-RND-2F",
            "site": "판교",
            "building": "연구동",
            "floor": "2F",
            "room": None,
            "description": "판교 연구동 2층",
            "is_active": True,
        },
        # 대전 오피스
        {
            "id": str(uuid.uuid4()),
            "name": "대전 본사",
            "code": "DJ-MAIN",
            "site": "대전",
            "building": "본사",
            "floor": None,
            "room": None,
            "description": "대전광역시 유성구 대전 본사",
            "is_active": True,
        },
        {
            "id": str(uuid.uuid4()),
            "name": "대전 본사 1층",
            "code": "DJ-MAIN-1F",
            "site": "대전",
            "building": "본사",
            "floor": "1F",
            "room": None,
            "description": "대전 본사 1층",
            "is_active": True,
        },
        {
            "id": str(uuid.uuid4()),
            "name": "대전 본사 2층",
            "code": "DJ-MAIN-2F",
            "site": "대전",
            "building": "본사",
            "floor": "2F",
            "room": None,
            "description": "대전 본사 2층",
            "is_active": True,
        },
        {
            "id": str(uuid.uuid4()),
            "name": "대전 본사 3층",
            "code": "DJ-MAIN-3F",
            "site": "대전",
            "building": "본사",
            "floor": "3F",
            "room": None,
            "description": "대전 본사 3층",
            "is_active": True,
        },
        {
            "id": str(uuid.uuid4()),
            "name": "대전 연구소",
            "code": "DJ-LAB",
            "site": "대전",
            "building": "연구소",
            "floor": None,
            "room": None,
            "description": "대전 연구소",
            "is_active": True,
        },
        {
            "id": str(uuid.uuid4()),
            "name": "대전 연구소 1층",
            "code": "DJ-LAB-1F",
            "site": "대전",
            "building": "연구소",
            "floor": "1F",
            "room": None,
            "description": "대전 연구소 1층",
            "is_active": True,
        },
        {
            "id": str(uuid.uuid4()),
            "name": "대전 연구소 2층",
            "code": "DJ-LAB-2F",
            "site": "대전",
            "building": "연구소",
            "floor": "2F",
            "room": None,
            "description": "대전 연구소 2층",
            "is_active": True,
        },
        # 창고
        {
            "id": str(uuid.uuid4()),
            "name": "판교 자산창고",
            "code": "PG-STORAGE",
            "site": "판교",
            "building": "창고",
            "floor": None,
            "room": None,
            "description": "판교 자산 보관 창고",
            "is_active": True,
        },
        {
            "id": str(uuid.uuid4()),
            "name": "대전 자산창고",
            "code": "DJ-STORAGE",
            "site": "대전",
            "building": "창고",
            "floor": None,
            "room": None,
            "description": "대전 자산 보관 창고",
            "is_active": True,
        },
    ]

    created_locations = []

    for location_data in locations_data:
        # Check if location already exists
        result = await db.execute(select(Location).where(Location.code == location_data["code"]))
        existing_location = result.scalar_one_or_none()

        if existing_location:
            print(f"  ⏭️  Location {location_data['name']} already exists, skipping...")
            created_locations.append(existing_location)
            continue

        # Create new location
        location = Location(
            **location_data,
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )

        db.add(location)
        created_locations.append(location)
        print(f"  ✓ Created location: {location.name} ({location.code})")

    await db.commit()
    print(f"✅ Locations seeded successfully ({len(created_locations)} locations)")
    return created_locations


async def main() -> None:
    """Main seeding function."""
    print("=" * 60)
    print("🌱 Starting database seeding for SureSoft AMS")
    print("=" * 60)
    print(f"\nDatabase URL: {settings.DATABASE_URL}")
    print(f"Environment: {settings.APP_ENV}")

    async with AsyncSessionLocal() as db:
        try:
            # Seed data in order
            users = await seed_users(db)
            categories = await seed_categories(db)
            locations = await seed_locations(db)

            print("\n" + "=" * 60)
            print("✅ Database seeding completed successfully!")
            print("=" * 60)
            print("\n📊 Summary:")
            print(f"  - Users: {len(users)}")
            print(f"  - Categories: {len(categories)}")
            print(f"  - Locations: {len(locations)}")

            print("\n👤 Default User Credentials:")
            print("  Admin:")
            print("    Email: admin@suresoft.com")
            print(f"    Password: {os.getenv('ADMIN_PASSWORD', 'admin123!')}")
            print("  Manager:")
            print("    Email: manager@suresoft.com")
            print("    Password: manager123!")
            print("  Employee:")
            print("    Email: employee@suresoft.com")
            print("    Password: employee123!")

            print("\n⚠️  NOTE: Please change the default passwords in production environment!")
            print("\n")

        except Exception as e:
            print(f"\n❌ Error during seeding: {e}")
            import traceback

            traceback.print_exc()
            raise


if __name__ == "__main__":
    asyncio.run(main())
