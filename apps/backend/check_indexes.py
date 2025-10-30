from src.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    result = conn.execute(text("SELECT indexname FROM pg_indexes WHERE tablename = 'assets'"))
    indexes = [r[0] for r in result]
    print("\n생성된 인덱스:")
    for idx in indexes:
        print(f"  - {idx}")
