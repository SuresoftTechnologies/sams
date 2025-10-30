#!/usr/bin/env python3
"""Check migrated assets via API"""
import httpx

BASE_URL = "http://localhost:8000/api/v1"

# Login
print("🔑 로그인 중...")
response = httpx.post(
    f"{BASE_URL}/auth/login",
    json={"email": "admin@suresoft.com", "password": "admin123!"}
)
token = response.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}
print("✅ 로그인 성공!\n")

# Get Assets
print("📦 자산 조회 중...")
response = httpx.get(
    f"{BASE_URL}/assets",
    headers=headers,
    params={"page": 1, "page_size": 5}
)

if response.status_code == 200:
    data = response.json()
    print(f"\n✅ 총 {data['total']}개의 자산이 API를 통해 조회 가능합니다!\n")
    print("📄 첫 5개 자산:")
    print("=" * 80)
    for asset in data["items"][:5]:
        print(f"자산번호: {asset['asset_tag']}")
        print(f"이름: {asset['name']}")
        print(f"카테고리: {asset.get('category', {}).get('name', 'N/A')}")
        print(f"상태: {asset['status']}")
        print(f"등급: {asset['grade']}")
        if asset.get("location"):
            print(f"위치: {asset['location']['name']}")
        print("-" * 80)
    print("\n🌐 웹 브라우저에서도 이 데이터를 볼 수 있습니다!")
else:
    print(f"❌ 오류: {response.status_code}")
    print(response.text)
