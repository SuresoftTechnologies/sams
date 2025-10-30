#!/usr/bin/env python3
import requests

BASE_URL = "http://localhost:8000/api/v1"

# Login
print("1. Testing login...")
response = requests.post(
    f"{BASE_URL}/auth/login",
    json={"email": "admin@suresoft.com", "password": "admin123!"}
)
assert response.status_code == 200, f"Login failed: {response.status_code} - {response.text}"
token = response.json()["access_token"]
print(f"✅ Login successful")

headers = {"Authorization": f"Bearer {token}"}

# Test basic pagination
print("\n2. Testing basic pagination...")
response = requests.get(f"{BASE_URL}/assets?skip=0&limit=10", headers=headers)
assert response.status_code == 200, f"Failed: {response.status_code}"
data = response.json()
print(f"✅ Total: {data['total']}, Items: {len(data['items'])}, Skip: {data['skip']}, Limit: {data['limit']}")

# Test search
print("\n3. Testing search (laptop)...")
response = requests.get(f"{BASE_URL}/assets?skip=0&limit=10&search=laptop", headers=headers)
assert response.status_code == 200
data = response.json()
print(f"✅ Search results - Total: {data['total']}, Items: {len(data['items'])}")

# Test filter
print("\n4. Testing filter (status=AVAILABLE)...")
response = requests.get(f"{BASE_URL}/assets?skip=0&limit=10&status=AVAILABLE", headers=headers)
assert response.status_code == 200
data = response.json()
print(f"✅ Filter results - Total: {data['total']}, Items: {len(data['items'])}")

# Verify total accuracy
print("\n5. Verifying total count accuracy...")
response = requests.get(f"{BASE_URL}/assets?skip=0&limit=5000", headers=headers)
all_data = response.json()
print(f"✅ All assets - Total: {all_data['total']}, Actual items: {len(all_data['items'])}")
assert all_data['total'] == len(all_data['items']), "Total count mismatch!"

response = requests.get(f"{BASE_URL}/assets?skip=0&limit=5000&search=laptop", headers=headers)
search_data = response.json()
print(f"✅ Search 'laptop' - Total: {search_data['total']}, Actual items: {len(search_data['items'])}")
assert search_data['total'] == len(search_data['items']), "Search total count mismatch!"

print("\n✅✅✅ All API tests passed! ✅✅✅")
