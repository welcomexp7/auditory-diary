from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
import os


# TODO: pydantic-settings 등 환경 변수 관리 도구로 이동 권장
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "sqlite+aiosqlite:///./auditory_diary.db"
)


# Render 등에서 제공하는 postgres:// URL을 asyncpg용으로 변환 (필요시)
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
elif DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)


engine_kwargs = {"echo": False, "future": True}
# SQLite 사용 시에만 필요한 커넥션 인자 (PostgreSQL에서는 에러남)
if "sqlite" in DATABASE_URL:
    engine_kwargs["connect_args"] = {"check_same_thread": False}


# 비동기 엔진 생성
engine = create_async_engine(DATABASE_URL, **engine_kwargs)


# 비동기 세션 팩토리
AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)


async def get_db_session() -> AsyncSession:
    """
    FastAPI의 Dependency Injection용 세션 제너레이터
    """
    async with AsyncSessionLocal() as session:
        yield session
