from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import Response
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
from app.infrastructure.external.spotify_client import SpotifyAPIClient
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
spotify_client = SpotifyAPIClient()

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
        artist_names_set: list[str] = []  # 장르 조회용 아티스트 이름 수집
        weathers = {}
        for d in diaries:
            if d.track:
                tracks_context.append(f"'{d.track.title}' by {d.track.artist}")
                # 피처링 아티스트도 포함되었을 수 있으므로 첫 번째 아티스트만 추출
                primary_artist = d.track.artist.split(",")[0].strip()
                if primary_artist not in artist_names_set:
                    artist_names_set.append(primary_artist)
            if d.context and d.context.weather:
                w = d.context.weather
                weathers[w] = weathers.get(w, 0) + 1

        majority_weather = max(weathers, key=weathers.get) if weathers else None

        # 4-1. Spotify API로 아티스트별 장르(Genre) 조회 — AI 프롬프트 품질 향상용
        # Why: Audio Features API 폐기 이후, 장르가 LLM에게 곡의 무드를 추론시키는 핵심 단서
        genres_map: dict[str, list[str]] = {}
        try:
            from app.infrastructure.db.user_models import UserORM
            user = await session.get(UserORM, user_id)
            if user and user.spotify_access_token:
                genres_map = await spotify_client.get_artists_genres(
                    access_token=user.spotify_access_token,
                    artist_names=artist_names_set
                )
        except Exception as e:
            # 장르 조회 실패해도 캡슐 생성은 계속 진행 (Graceful Degradation)
            import logging
            logging.getLogger(__name__).warning(f"Genre fetch skipped: {e}")

        # 5. Gemini API 호출 (장르 컨텍스트 포함)
        ai_summary = await ai_client.generate_daily_summary(
            tracks_context=tracks_context,
            majority_weather=majority_weather,
            genres_map=genres_map
        )

        # 6. 대표 앨범 아트 선정
        # Why: AI 멘트가 최빈 아티스트 기반으로 생성되므로, LP 이미지도 동일 아티스트의
        #      가장 최근 트랙 앨범아트를 사용하여 시각-텍스트 일체감을 확보합니다.
        from collections import Counter
        artist_play_counts = Counter()
        artist_latest_artwork: dict[str, str] = {}  # 아티스트별 가장 최근 앨범아트

        for d in reversed(diaries):  # 시간 역순 순회 → 첫 매칭이 '가장 최근'
            if d.track:
                primary = d.track.artist.split(",")[0].strip()
                artist_play_counts[primary] += 1
                if primary not in artist_latest_artwork and d.track.album_artwork_url:
                    artist_latest_artwork[primary] = d.track.album_artwork_url

        if artist_play_counts:
            top_artist_name = artist_play_counts.most_common(1)[0][0]
            representative_image_url = artist_latest_artwork.get(top_artist_name)
        else:
            representative_image_url = diaries[0].track.album_artwork_url if diaries[0].track else None

        # 6-1. 자동 테마(Vibe) 매핑 엔진 (Genre-based Inference)
        theme_scores = {"y2k": 0, "midnight": 0, "editorial": 0, "aura": 0}
        
        y2k_keywords = ["hip hop", "rap", "dance", "techno", "electronic", "house", "idol", "pop"]
        midnight_keywords = ["r&b", "soul", "jazz", "indie", "ambient", "lo-fi", "chill", "blues"]
        editorial_keywords = ["acoustic", "folk", "classical", "piano", "ost", "singer-songwriter"]
        
        if genres_map:
            for artist, genres in genres_map.items():
                for genre in genres:
                    g = genre.lower()
                    if any(k in g for k in y2k_keywords): theme_scores["y2k"] += 1
                    if any(k in g for k in midnight_keywords): theme_scores["midnight"] += 1
                    if any(k in g for k in editorial_keywords): theme_scores["editorial"] += 1
        
        # Determine winning theme (if scores are 0, defaults to 'aura')
        determined_theme = "aura"
        max_score = 0
        for t_name, score in theme_scores.items():
            if score > max_score:
                max_score = score
                determined_theme = t_name

        # 7. DB 저장
        new_capsule = DailyCapsuleORM(
            user_id=user_id,
            target_date=target_date,
            ai_summary=ai_summary,
            representative_image_url=representative_image_url,
            theme=determined_theme
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

@router.get("/image-proxy")
async def image_proxy(url: str = Query(..., description="프록시할 이미지 URL")):
    """
    [이미지 프록시]
    Spotify CDN 등 외부 이미지를 백엔드를 경유하여 CORS-safe하게 전달합니다.
    html2canvas가 tainted canvas 에러 없이 캡처할 수 있도록 지원합니다.
    """
    import httpx
    
    # 안전한 도메인만 허용 (스팸/악용 방지)
    allowed_domains = ["i.scdn.co", "mosaic.scdn.co", "image-cdn-ak.spotifycdn.com", "image-cdn-fa.spotifycdn.com"]
    from urllib.parse import urlparse
    parsed = urlparse(url)
    if parsed.hostname not in allowed_domains:
        raise HTTPException(status_code=400, detail="허용되지 않은 이미지 도메인입니다.")
    
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, timeout=10.0)
            if resp.status_code != 200:
                raise HTTPException(status_code=resp.status_code, detail="이미지를 가져올 수 없습니다.")
            
            content_type = resp.headers.get("content-type", "image/jpeg")
            return Response(
                content=resp.content,
                media_type=content_type,
                headers={
                    "Access-Control-Allow-Origin": "*",
                    "Cache-Control": "public, max-age=86400"
                }
            )
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="이미지 요청 시간 초과")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"이미지 프록시 에러: {str(e)}")
