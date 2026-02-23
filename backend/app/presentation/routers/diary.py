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
from app.presentation.schemas.diary_schemas import DiaryCreateRequest, DiaryResponse, CalendarDaySummary, MemoUpdateRequest

router = APIRouter(prefix="/diaries", tags=["Auditory Diary"])

from fastapi import Request
import jwt
from app.core.config import settings

async def get_current_user_id(request: Request) -> uuid.UUID:
    """헤더의 JWT 토큰을 디코딩하여 현재 유저의 UUID를 식별합니다."""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="인증 토큰이 없습니다.")
    
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id_str = payload.get("sub")
        if not user_id_str:
            raise ValueError("Token missing sub")
        return uuid.UUID(user_id_str)
    except Exception:
        raise HTTPException(status_code=401, detail="유효하지 않은 토큰입니다.")

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

@router.patch("/{diary_id}/memo")
async def update_diary_memo(
    diary_id: uuid.UUID,
    request: MemoUpdateRequest,
    user_id: uuid.UUID = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_db_session)
):
    """
    [트러블슈팅/리뷰 반영]
    특정 다이어리의 메모만 수정/추가/삭제합니다.
    사용자 본인의 다이어리인지 권한 검증 로직이 리포지토리에 포함되어 있습니다.
    """
    try:
        diary_repo = AuditoryDiaryRepository(session)
        success = await diary_repo.update_memo(diary_id=diary_id, user_id=user_id, memo=request.memo)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="해당 일기를 찾을 수 없거나 수정 권한이 없습니다."
            )
            
        return {"status": "success", "message": "메모가 업데이트 되었습니다."}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"메모 업데이트 실패: {str(e)}"
        )


@router.get("/me/recently-played")
async def get_my_recently_played(
    session: AsyncSession = Depends(get_db_session),
    user_id: uuid.UUID = Depends(get_current_user_id)
):
    """
    [Phase 5: Sync-on-Demand 적용]
    현재 로그인한 유저의 Spotify 최근 재생 목록을 가져와서 DB와 실시간 동기화(Upsert)한 후
    확인된 타임라인(UUID 포함)을 반환합니다.
    """
    from app.infrastructure.db.user_models import UserORM
    user = await session.get(UserORM, user_id)

    if not user or not user.spotify_access_token:
        return {"diaries": [], "message": "Spotify 연동이 필요합니다."}

    try:
        service = DiaryService(
            repository=AuditoryDiaryRepository(session),
            spotify_client=SpotifyAPIClient(),
            weather_client=WeatherAPIClient(),
            location_client=LocationAPIClient()
        )
        
        diaries_orm = await service.sync_recently_played(
            user_id=user.id,
            session=session,
            limit=10
        )

        diaries_response = [DiaryResponse.model_validate(d) for d in diaries_orm]
        return {"diaries": diaries_response, "message": "Synced successfully"}

    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"diaries": [], "message": f"Spotify 데이터 조회 및 동기화 실패: {str(e)}"}

@router.get("/me/status")
async def get_my_status(
    session: AsyncSession = Depends(get_db_session),
    user_id: uuid.UUID = Depends(get_current_user_id)
):
    from app.infrastructure.db.user_models import UserORM
    user = await session.get(UserORM, user_id)
    return {"spotify_connected": bool(user and user.spotify_access_token)}

@router.get("/calendar/monthly", response_model=List[CalendarDaySummary])
async def get_monthly_calendar_summary(
    year: int,
    month: int,
    user_id: uuid.UUID = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_db_session)
):
    """
    [과거 기록 조회 - 월별 요약]
    클라이언트가 캘린더 네비게이터를 그리기 위해 특정 연/월을 요청하면,
    해당 기간 내 날짜별로 '다이어리 개수'와 '대표 앨범 아트'를 집계하여 반환합니다.
    """
    try:
        diary_repo = AuditoryDiaryRepository(session)
        # 월별 데이터를 풀스캔하지 않고, DB 레벨의 Group By 집계를 통해 빠르고 가볍게 응답 (비용/퍼포먼스 최적화)
        summaries = await diary_repo.get_monthly_summary(user_id=user_id, year=year, month=month)
        return summaries
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"월별 통계 데이터를 불러오는 중 오류가 발생했습니다: {str(e)}"
        )

@router.get("/history", response_model=List[DiaryResponse])
async def get_daily_history(
    date: str, # YYYY-MM-DD 포맷 가정
    user_id: uuid.UUID = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_db_session)
):
    """
    [과거 기록 조회 - 일별 타임라인]
    캘린더 칩에서 특정 날짜를 클릭했을 때, 해당 날짜 하루 동안의 전체 다이어리 타임라인을 반환합니다.
    """
    try:
        diary_repo = AuditoryDiaryRepository(session)
        # Auth 의존성(user_id)을 강제 주입하여, 오직 본인의 데이터만 조회하도록 격리(보안 이슈 차단)
        records = await diary_repo.get_daily_history(user_id=user_id, date_str=date)
        return records
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"과거 타임라인 기록을 불러오는 중 오류가 발생했습니다: {str(e)}"
        )
