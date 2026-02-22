from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

app = FastAPI(
    title="Auditory Diary API",
    description="청각적 일기 서비스를 위한 백엔드 API (DDD 구조 적용)",
    version="1.0.0",
)

# CORS 설정 — settings.FRONTEND_URL로 배포/로컬 자동 대응
allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
# 배포 환경의 프론트엔드 URL이 로컬과 다르면 추가
if settings.FRONTEND_URL not in allowed_origins:
    allowed_origins.append(settings.FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import asyncio
from app.presentation.routers import auth, diary
from app.infrastructure.worker.scrobble_worker import start_auto_scrobbler

app.include_router(auth.router, prefix="/api")
app.include_router(diary.router, prefix="/api")

@app.on_event("startup")
async def on_startup():
    # 1. DB 스키마 자동 생성 (개발용)
    from app.infrastructure.db.database import engine
    from app.infrastructure.db.base import Base
    # models 들이 import 되어야 Base.metadata에 등록됨
    import app.infrastructure.db.models
    import app.infrastructure.db.user_models
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    # 2. 서버 기동 시 무한 루프로 도는 워커 백그라운드 태스크 등록
    asyncio.create_task(start_auto_scrobbler(interval_seconds=300)) # 5분마다 스크로블

@app.get("/health", tags=["System"])
def health_check():
    """
    서버 상태 확인 엔드포인트
    """
    return {"status": "ok", "message": "Auditory Diary API is running."}
