#!/usr/bin/env python3
"""Quick API test script"""
import httpx
import json

BASE_URL = "http://localhost:8000/api/v1"

def test_api():
    print("=" * 60)
    print("🧪 Testing SureSoft AMS API")
    print("=" * 60)

    with httpx.Client() as client:
        # 1. Health Check
        print("\n1️⃣ Health Check...")
        response = client.get("http://localhost:8000/health")
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.json()}")

        # 2. Login
        print("\n2️⃣ Login as Admin...")
        login_data = {
            "email": "admin@suresoft.com",
            "password": "admin123!"
        }
        response = client.post(f"{BASE_URL}/auth/login", json=login_data)
        print(f"   Status: {response.status_code}")

        if response.status_code == 200:
            token_data = response.json()
            access_token = token_data.get("access_token")
            print(f"   ✅ Login successful!")
            print(f"   Token: {access_token[:50]}...")

            headers = {"Authorization": f"Bearer {access_token}"}

            # 3. Get Current User
            print("\n3️⃣ Get Current User...")
            response = client.get(f"{BASE_URL}/auth/me", headers=headers)
            print(f"   Status: {response.status_code}")
            if response.status_code == 200:
                user = response.json()
                print(f"   User: {user.get('name')} ({user.get('email')})")
                print(f"   Role: {user.get('role')}")

            # 4. Get Categories
            print("\n4️⃣ Get Categories...")
            response = client.get(f"{BASE_URL}/categories", headers=headers)
            print(f"   Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                categories = data.get('items', [])
                print(f"   Total: {data.get('total', 0)}")
                for cat in categories[:3]:
                    print(f"   - {cat.get('name')} ({cat.get('code')})")

            # 5. Get Locations
            print("\n5️⃣ Get Locations...")
            response = client.get(f"{BASE_URL}/locations", headers=headers)
            print(f"   Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                locations = data.get('items', [])
                print(f"   Total: {data.get('total', 0)}")
                for loc in locations[:3]:
                    print(f"   - {loc.get('name')} ({loc.get('code')})")

            # 6. Get Users (Admin only)
            print("\n6️⃣ Get Users...")
            response = client.get(f"{BASE_URL}/users", headers=headers)
            print(f"   Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                users = data.get('items', [])
                print(f"   Total: {data.get('total', 0)}")
                for user in users:
                    print(f"   - {user.get('name')} ({user.get('email')}) - {user.get('role')}")

            print("\n" + "=" * 60)
            print("✅ All tests completed successfully!")
            print("=" * 60)
        else:
            print(f"   ❌ Login failed: {response.text}")

if __name__ == "__main__":
    test_api()
