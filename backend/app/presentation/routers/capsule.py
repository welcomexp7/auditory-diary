from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import cast, Date
import uuid
import datetime

from app.infrastructure.db.database import get_db_session
from app.infrastructure.db.models import DailyCapsuleORM, AuditoryDiaryORM
from app.presentation.schemas.capsule_schemas import CapsuleCreateRequest, DailyCapsuleResponse
from app.application.ai_client import AICapsuleClient
from app.core.config import settings
from fastapi import Request
import jwt

async def get_current_user_id(request: Request) -> uuid.UUID:
    """JWT 토큰을 디코딩하여 현재 유저의 UUID를 반환합니다."""
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

router = APIRouter(prefix="/capsules", tags=["Capsules"])
ai_client = AICapsuleClient()

@router.post("/generate", response_model=DailyCapsuleResponse)
async def generate_daily_capsule(
    request: CapsuleCreateRequest,
    user_id: uuid.UUID = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_db_session)
):
    """
    [AI Daily Capsule 생성]
    특정 일자의 청취 기록(Auditory Diaries)을 수집하여 LLM을 통해 감성적인 '한 줄 요약 일기'를 생성 후 저장합니다.
    """
    try:
        # 1. 대상 날짜 파싱 및 KST 범위 설정 (diary_repository 로직 참고)
        from datetime import timezone, timedelta
        kst_tz = timezone(timedelta(hours=9))
        target_date = datetime.datetime.strptime(request.target_date, "%Y-%m-%d").date()
        
        start_kst = datetime.datetime.combine(target_date, datetime.datetime.min.time()).replace(tzinfo=kst_tz)
        end_kst = start_kst + timedelta(days=1)
        
        start_utc = start_kst.astimezone(timezone.utc)
        end_utc = end_kst.astimezone(timezone.utc)

        # 2. 이미 해당 날짜에 생성된 캡슐이 있는지 확인
        existing_stmt = select(DailyCapsuleORM).where(
            DailyCapsuleORM.user_id == user_id,
            DailyCapsuleORM.target_date == target_date
        )
        existing_result = await session.execute(existing_stmt)
        if existing_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="해당 일자의 AI Daily Capsule이 이미 존재합니다. 캡슐은 하루에 한 번만 생성 가능합니다."
            )

        # 3. 해당 날짜에 들은 트랙 리스트 조회
        stmt = (
            select(AuditoryDiaryORM)
            .options(selectinload(AuditoryDiaryORM.track), selectinload(AuditoryDiaryORM.context))
            .where(AuditoryDiaryORM.user_id == user_id)
            .where(AuditoryDiaryORM.listened_at >= start_utc)
            .where(AuditoryDiaryORM.listened_at < end_utc)
            .order_by(AuditoryDiaryORM.listened_at.asc())
        )
        result = await session.execute(stmt)
        diaries = result.scalars().all()

        if not diaries:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="해당 일자에는 들은 음악 기록이 없어서 캡슐을 생성할 수 없습니다."
            )

        # 4. LLM 프롬프트용 컨텍스트 정리
        tracks_context = []
        weathers = {}
        for d in diaries:
            # 트랙 정보
            if d.track:
                tracks_context.append(f"'{d.track.title}' by {d.track.artist}")
            # 날씨 정보 집계
            if d.context and d.context.weather:
                w = d.context.weather
                weathers[w] = weathers.get(w, 0) + 1

        majority_weather = max(weathers, key=weathers.get) if weathers else None

        # 5. Gemini API 호출
        ai_summary = await ai_client.generate_daily_summary(
            tracks_context=tracks_context,
            majority_weather=majority_weather
        )

        # 6. 대표 앨범 아트 선정 (가장 많이 들었거나, 리스트 중앙값 등. 여기선 임의로 리스트 중간 곡 선택)
        representative_image_url = diaries[len(diaries) // 2].track.album_artwork_url if diaries[len(diaries) // 2].track else None

        # 7. DB 저장
        new_capsule = DailyCapsuleORM(
            user_id=user_id,
            target_date=target_date,
            ai_summary=ai_summary,
            representative_image_url=representative_image_url
        )
        session.add(new_capsule)
        await session.commit()
        await session.refresh(new_capsule)

        return DailyCapsuleResponse.model_validate(new_capsule)

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI Daily Capsule 생성 중 오류가 발생했습니다: {str(e)}"
        )

@router.get("/me", response_model=DailyCapsuleResponse)
async def get_daily_capsule(
    date: str, # YYYY-MM-DD
    user_id: uuid.UUID = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_db_session)
):
    """
    [AI Daily Capsule 조회]
    특정 일자에 생성된 AI Daily Capsule 결과를 반환합니다.
    생성된 캡슐이 없으면 404를 반환합니다.
    """
    try:
        target_date = datetime.datetime.strptime(date, "%Y-%m-%d").date()
        stmt = select(DailyCapsuleORM).where(
            DailyCapsuleORM.user_id == user_id,
            DailyCapsuleORM.target_date == target_date
        )
        result = await session.execute(stmt)
        capsule = result.scalar_one_or_none()

        if not capsule:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="캡슐을 찾을 수 없습니다.")

        return DailyCapsuleResponse.model_validate(capsule)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI Daily Capsule 조회 중 오류가 발생했습니다: {str(e)}"
        )
