from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import insert
from typing import Optional, List
import uuid

from app.domain.models import AuditoryDiary as DomainDiary, Track as DomainTrack, Context as DomainContext
from app.infrastructure.db.models import AuditoryDiaryORM, TrackORM, ContextORM

class AuditoryDiaryRepository:
    """
    도메인 모델(Entity)과 영속성 모델(ORM) 간의 변환을 책임지는 Repository
    Application Layer는 이 Repository 인터페이스만 바라보고 DB 구조를 모르게 격리
    """
    def __init__(self, session: AsyncSession):
        self.session = session

    async def save(self, diary: DomainDiary) -> DomainDiary:
        # 1. Track 저장 또는 조회 (UPSERT 로직 필요 - 여기선 단순화)
        track_orm = TrackORM(
            id=uuid.uuid4(), # 고유 ID 생성 (도메인엔 없지만 DB 매핑용)
            title=diary.track.title,
            artist=diary.track.artist,
            album_artwork_url=diary.track.album_artwork_url,
            external_platform_id=diary.track.external_platform_id,
            platform_name=diary.track.platform_name
        )
        self.session.add(track_orm)

        # 2. Context 저장
        context_orm = ContextORM(
            id=uuid.uuid4(),
            latitude=diary.context.latitude,
            longitude=diary.context.longitude,
            place_name=diary.context.place_name,
            weather=diary.context.weather,
            timezone=diary.context.timezone
        )
        self.session.add(context_orm)

        # 3. Diary 저장
        diary_orm = AuditoryDiaryORM(
            id=diary.id,
            user_id=diary.user_id,
            track_id=track_orm.id,
            context_id=context_orm.id,
            listened_at=diary.listened_at,
            memo=diary.memo
        )
        self.session.add(diary_orm)

        await self.session.commit()
        return diary

    async def get_by_user_id(self, user_id: uuid.UUID) -> List[DomainDiary]:
        # TODO: 도메인 객체로의 재조립 로직 구현 필요
        # stmt = select(AuditoryDiaryORM).where(AuditoryDiaryORM.user_id == user_id)
        # result = await self.session.execute(stmt)
        # ... fetch & transform
        pass
