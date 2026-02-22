from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
import uuid
from typing import List

from app.infrastructure.db.database import get_db_session
from app.infrastructure.repositories.diary_repository import AuditoryDiaryRepository
from app.infrastructure.repositories.user_repository import UserRepository
from app.infrastructure.external.spotify_client import SpotifyAPIClient
from app.infrastructure.external.weather_client import WeatherAPIClient
from app.infrastructure.external.location_client import LocationAPIClient
from app.application.diary_service import DiaryService
from app.presentation.schemas.diary_schemas import DiaryCreateRequest, DiaryResponse

router = APIRouter(prefix="/diaries", tags=["Auditory Diary"])

# TODO: 실제 운영 환경에서는 JWT Bearer Token 검증 미들웨어/Dependency를 통해 user_id 추출 필요
async def get_current_user_id() -> uuid.UUID:
    # 임시 목업 (실제로는 헤더의 토큰을 디코딩하여 UUID 반환)
    return uuid.uuid4() 

@router.post("/", response_model=DiaryResponse)
async def create_diary(
    request: DiaryCreateRequest,
    user_id: uuid.UUID = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_db_session)
):
    """
    현재 듣고 있는(또는 최근 들은) 음악과 사용자의 위치를 합쳐 새로운 청각적 일기를 생성합니다.
    """
    user_repo = UserRepository(session)
    user = await user_repo.get_by_id(user_id) # 여기서 user_repository.py 에 get_by_id 추가해야 함
    
    if not user or not user.spotify_access_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Spotify 연동이 필요합니다."
        )

    service = DiaryService(
        repository=AuditoryDiaryRepository(session),
        spotify_client=SpotifyAPIClient(),
        weather_client=WeatherAPIClient(),
        location_client=LocationAPIClient()
    )
    
    try:
        diary = await service.create_diary_from_current_context(
            user_id=user.id,
            spotify_access_token=user.spotify_access_token,
            lat=request.latitude,
            lon=request.longitude,
            memo=request.memo
        )
        return diary # from_attributes=True 덕에 DomainDiary 로 반환해도 스키마에 맞게 필터링됨
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/me/recently-played")
async def get_my_recently_played(
    session: AsyncSession = Depends(get_db_session)
):
    """
    현재 로그인한 유저의 Spotify 최근 재생 목록을 가져와 타임라인 형식으로 반환.
    프론트엔드 대시보드에서 직접 렌더링할 수 있는 형태로 가공합니다.
    """
    from sqlalchemy.future import select
    from app.infrastructure.db.user_models import UserORM

    # 가장 최근 로그인한 유저 조회 (프로덕션: JWT 기반 current_user 의존성 사용)
    stmt = select(UserORM).order_by(UserORM.created_at.desc()).limit(1)
    result = await session.execute(stmt)
    user = result.scalars().first()

    if not user or not user.spotify_access_token:
        return {"diaries": [], "message": "Spotify 연동이 필요합니다."}

    try:
        spotify_client = SpotifyAPIClient()
        items = await spotify_client.get_recently_played(
            access_token=user.spotify_access_token, limit=10
        )

        # Spotify API 응답을 프론트엔드 타임라인 형식으로 변환
        diaries = []
        for i, item in enumerate(items):
            track_info = item.get("track", {})
            album = track_info.get("album", {})
            images = album.get("images", [])
            artists = track_info.get("artists", [])

            diaries.append({
                "id": str(i),
                "track": {
                    "title": track_info.get("name", "Unknown"),
                    "artist": ", ".join(a.get("name", "") for a in artists),
                    "album_artwork_url": images[0]["url"] if images else ""
                },
                "context": {
                    "place_name": "Spotify에서 재생",
                    "weather": ""
                },
                "listened_at": item.get("played_at", ""),
                "memo": None
            })

        return {"diaries": diaries}

    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"diaries": [], "message": f"Spotify 데이터 조회 실패: {str(e)}"}
