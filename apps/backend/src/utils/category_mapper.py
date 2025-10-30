"""
Category auto-mapping utility for receipt analysis.

영수증 분석 결과의 item_type을 카테고리 코드/UUID로 자동 매핑합니다.
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.category import Category

# 품목 타입 → 카테고리 코드 매핑
CATEGORY_MAPPING = {
    # 데스크탑 (코드: 11)
    "데스크탑": "11",
    "desktop": "11",
    "pc": "11",
    "본체": "11",
    "조립pc": "11",
    "조립 pc": "11",
    "조립컴퓨터": "11",
    
    # 노트북 (코드: 12)
    "노트북": "12",
    "laptop": "12",
    "notebook": "12",
    "랩탑": "12",
    
    # 모니터 (코드: 14)
    "모니터": "14",
    "monitor": "14",
    "디스플레이": "14",
    "display": "14",
    "lcd": "14",
}


def infer_category_code(item_type: str) -> str | None:
    """
    품목 타입에서 카테고리 코드 자동 추론.
    
    Args:
        item_type: 품목 타입 (예: "노트북", "데스크탑", "모니터")
    
    Returns:
        카테고리 코드 (예: "12") 또는 None (추론 실패 시)
    
    Examples:
        >>> infer_category_code("노트북")
        "12"
        >>> infer_category_code("Desktop")
        "11"
        >>> infer_category_code("알 수 없음")
        None
    """
    if not item_type:
        return None
    
    # 소문자 변환 및 공백 제거
    normalized = item_type.lower().strip()
    
    # 직접 매칭
    if normalized in CATEGORY_MAPPING:
        return CATEGORY_MAPPING[normalized]
    
    # 부분 매칭 (키워드 포함 여부)
    for keyword, code in CATEGORY_MAPPING.items():
        if keyword in normalized or normalized in keyword:
            return code
    
    return None


async def get_category_id_from_code(
    db: AsyncSession, 
    category_code: str
) -> str | None:
    """
    카테고리 코드로 UUID 조회.
    
    Args:
        db: 데이터베이스 세션
        category_code: 카테고리 코드 (예: "12")
    
    Returns:
        카테고리 UUID (str) 또는 None (코드 없을 시)
    
    Examples:
        >>> await get_category_id_from_code(db, "12")
        "550e8400-e29b-41d4-a716-446655440000"
    """
    result = await db.execute(
        select(Category).where(Category.code == category_code)
    )
    category = result.scalar_one_or_none()
    return str(category.id) if category else None


async def infer_category_id(
    db: AsyncSession,
    item_type: str
) -> tuple[str | None, str | None]:
    """
    품목 타입에서 카테고리 코드와 UUID를 한번에 추론.
    
    Args:
        db: 데이터베이스 세션
        item_type: 품목 타입 (예: "노트북")
    
    Returns:
        Tuple of (category_code, category_id) 또는 (None, None)
    
    Examples:
        >>> await infer_category_id(db, "노트북")
        ("12", "550e8400-e29b-41d4-a716-446655440000")
    """
    category_code = infer_category_code(item_type)
    if not category_code:
        return None, None
    
    category_id = await get_category_id_from_code(db, category_code)
    return category_code, category_id

