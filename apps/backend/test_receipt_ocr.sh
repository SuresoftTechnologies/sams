#!/bin/bash

# 영수증 OCR 기능 테스트 스크립트
# DeepSeek Vision API를 사용한 OCR 및 자산 자동 생성 테스트

BASE_URL="http://localhost:8000/api/v1"
TOKEN="YOUR_ACCESS_TOKEN_HERE"

# 색상 정의
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}영수증 OCR 기능 테스트${NC}"
echo -e "${BLUE}================================${NC}\n"

# 1. 토큰 확인
if [ "$TOKEN" == "YOUR_ACCESS_TOKEN_HERE" ]; then
    echo -e "${RED}❌ 에러: ACCESS_TOKEN을 설정하세요${NC}"
    echo -e "${YELLOW}   export TOKEN='your_token_here'${NC}\n"
    exit 1
fi

# 2. 테스트 이미지 확인
if [ ! -f "test_receipt.jpg" ] && [ ! -f "test_receipt.png" ]; then
    echo -e "${YELLOW}⚠️  경고: test_receipt.jpg 또는 test_receipt.png 파일이 없습니다${NC}"
    echo -e "${YELLOW}   테스트 이미지를 준비하세요${NC}\n"
    exit 1
fi

# 이미지 파일 찾기
IMAGE_FILE=""
if [ -f "test_receipt.jpg" ]; then
    IMAGE_FILE="test_receipt.jpg"
elif [ -f "test_receipt.png" ]; then
    IMAGE_FILE="test_receipt.png"
fi

echo -e "${GREEN}✓ 테스트 이미지: $IMAGE_FILE${NC}\n"

# 3. 카테고리 ID 가져오기
echo -e "${BLUE}1. 카테고리 ID 가져오기...${NC}"
CATEGORY_RESPONSE=$(curl -s -X GET "$BASE_URL/categories" \
    -H "Authorization: Bearer $TOKEN")

CATEGORY_ID=$(echo $CATEGORY_RESPONSE | jq -r '.[0].id' 2>/dev/null)

if [ -z "$CATEGORY_ID" ] || [ "$CATEGORY_ID" == "null" ]; then
    echo -e "${RED}❌ 카테고리를 가져올 수 없습니다${NC}\n"
    exit 1
fi

echo -e "${GREEN}✓ 카테고리 ID: $CATEGORY_ID${NC}\n"

# 4. DeepSeek OCR로 텍스트 추출
echo -e "${BLUE}2. DeepSeek OCR로 텍스트 추출...${NC}"
OCR_RESPONSE=$(curl -s -X POST "$BASE_URL/receipts/extract-text" \
    -H "Authorization: Bearer $TOKEN" \
    -F "file=@$IMAGE_FILE" \
    -F "method=deepseek")

OCR_TEXT=$(echo $OCR_RESPONSE | jq -r '.text' 2>/dev/null)
OCR_TIME=$(echo $OCR_RESPONSE | jq -r '.processing_time' 2>/dev/null)

if [ -z "$OCR_TEXT" ] || [ "$OCR_TEXT" == "null" ]; then
    echo -e "${RED}❌ OCR 텍스트 추출 실패${NC}"
    echo -e "${YELLOW}응답: $OCR_RESPONSE${NC}\n"
else
    echo -e "${GREEN}✓ 추출 완료 (${OCR_TIME}초)${NC}"
    echo -e "${YELLOW}추출된 텍스트:${NC}"
    echo "$OCR_TEXT" | head -n 10
    echo -e "\n"
fi

# 5. 자산 자동 생성 (DeepSeek OCR 사용)
echo -e "${BLUE}3. 자산 자동 생성 (DeepSeek OCR)...${NC}"
CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/receipts/create-asset" \
    -H "Authorization: Bearer $TOKEN" \
    -F "file=@$IMAGE_FILE" \
    -F "category_id=$CATEGORY_ID" \
    -F "ocr_method=deepseek" \
    -F "auto_generate_tag=true")

ASSET_ID=$(echo $CREATE_RESPONSE | jq -r '.asset.id' 2>/dev/null)
ASSET_TAG=$(echo $CREATE_RESPONSE | jq -r '.asset.asset_tag' 2>/dev/null)
ASSET_NAME=$(echo $CREATE_RESPONSE | jq -r '.asset.name' 2>/dev/null)
CONFIDENCE=$(echo $CREATE_RESPONSE | jq -r '.analysis.confidence' 2>/dev/null)
TOTAL_TIME=$(echo $CREATE_RESPONSE | jq -r '.total_time' 2>/dev/null)
WARNINGS=$(echo $CREATE_RESPONSE | jq -r '.warnings[]' 2>/dev/null)

if [ -z "$ASSET_ID" ] || [ "$ASSET_ID" == "null" ]; then
    echo -e "${RED}❌ 자산 생성 실패${NC}"
    echo -e "${YELLOW}응답:${NC}"
    echo "$CREATE_RESPONSE" | jq '.' 2>/dev/null || echo "$CREATE_RESPONSE"
    echo -e "\n"
else
    echo -e "${GREEN}✓ 자산 생성 완료!${NC}"
    echo -e "${GREEN}  - ID: $ASSET_ID${NC}"
    echo -e "${GREEN}  - 태그: $ASSET_TAG${NC}"
    echo -e "${GREEN}  - 이름: $ASSET_NAME${NC}"
    echo -e "${GREEN}  - 신뢰도: $CONFIDENCE${NC}"
    echo -e "${GREEN}  - 처리 시간: ${TOTAL_TIME}초${NC}"
    
    if [ -n "$WARNINGS" ]; then
        echo -e "${YELLOW}  ⚠️  경고:${NC}"
        echo "$WARNINGS" | while read -r line; do
            echo -e "${YELLOW}     - $line${NC}"
        done
    fi
    echo -e "\n"
fi

# 6. 전체 응답 저장
echo -e "${BLUE}4. 상세 응답 저장...${NC}"
echo "$CREATE_RESPONSE" | jq '.' > last_receipt_response.json 2>/dev/null
echo -e "${GREEN}✓ last_receipt_response.json에 저장됨${NC}\n"

echo -e "${BLUE}================================${NC}"
echo -e "${GREEN}테스트 완료!${NC}"
echo -e "${BLUE}================================${NC}"

