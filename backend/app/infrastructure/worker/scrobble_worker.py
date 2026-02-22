import asyncio
from datetime import datetime, timezone
import logging

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.infrastructure.db.database import AsyncSessionLocal
from app.infrastructure.db.user_models import UserORM
from app.infrastructure.external.spotify_client import SpotifyAPIClient
from app.infrastructure.repositories.diary_repository import AuditoryDiaryRepository
from app.infrastructure.external.location_client import LocationAPIClient
from app.infrastructure.external.weather_client import WeatherAPIClient
from app.application.diary_service import DiaryService

logger = logging.getLogger(__name__)

class ScrobbleWorker:
    """
    백그라운드에서 주기적으로 사용자들의 Spotify 계정을 순회하며
    최근 재생 곡을 자동으로 일기(AuditoryDiary)에 기록하는 워커
    """
    def __init__(self):
        self.spotify_client = SpotifyAPIClient()

    async def _process_user(self, session: AsyncSession, user: UserORM):
        if not user.spotify_access_token:
            return

        # Token Refresh 로직 생략 (실제 구현 시 user.spotify_token_expires_at 확인 후 갱신 필요)
        try:
            # 1. 최근 재생 목록 가져오기
            recent_tracks = await self.spotify_client.get_recently_played(
                access_token=user.spotify_access_token, 
                limit=1 # 여기서는 가장 최신 1개만 가져온다고 가정
            )

            if not recent_tracks:
                return

            track_item = recent_tracks[0]
            # 추가적으로 "이미 기록된 곡인지(중복 방지)" 검사 로직이 필요하나 청사진이므로 생략
            
            # 2. 다이어리 서비스로 기록 (자동 기록이므로 위치/메모는 None)
            service = DiaryService(
                repository=AuditoryDiaryRepository(session),
                spotify_client=self.spotify_client,
                weather_client=WeatherAPIClient(),
                location_client=LocationAPIClient()
            )
            
            # Application Layer의 create 메서드 호출 (위경도는 모름)
            await service.create_diary_from_current_context(
                user_id=user.id,
                spotify_access_token=user.spotify_access_token,
                lat=None, lon=None, memo="[Auto-Scrobbled]"
            )
            logger.info(f"Auto-scrobbled for user {user.email}")
            
        except Exception as e:
            logger.error(f"Failed to auto-scrobble for user {user.email}: {e}")

    async def run(self):
        """
        모든 활성 사용자에 대해 스크로블링을 실행
        """
        logger.info("Starting auto-scrobble job...")
        async with AsyncSessionLocal() as session:
            stmt = select(UserORM).where(UserORM.spotify_access_token != None)
            result = await session.execute(stmt)
            users = result.scalars().all()

            # TODO: 실무에서는 Celery, ARQ 커스텀 큐 활용 권장 (병목 방지)
            tasks = [self._process_user(session, user) for user in users]
            await asyncio.gather(*tasks)
            
        logger.info("Auto-scrobble job completed.")

# FastAPI app 시작 시 등록할 백그라운드 태스크 무한 루프 
async def start_auto_scrobbler(interval_seconds: int = 300):
    worker = ScrobbleWorker()
    while True:
        await worker.run()
        await asyncio.sleep(interval_seconds)
