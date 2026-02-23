from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import insert, func, extract, cast, Date, desc
from sqlalchemy.orm import selectinload
from typing import Optional, List, Dict, Any
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

    async def get_or_create_by_listened_at(self, diary_domain: DomainDiary) -> AuditoryDiaryORM:
        """
        user_id와 listened_at을 조건으로 검사하여 존재하면 반환하고,
        없으면 새로 저장(Upsert)하여 Track, Context가 Eager Load된 상태로 반환.
        """
        stmt = (
            select(AuditoryDiaryORM)
            .options(selectinload(AuditoryDiaryORM.track), selectinload(AuditoryDiaryORM.context))
            .where(
                AuditoryDiaryORM.user_id == diary_domain.user_id,
                AuditoryDiaryORM.listened_at == diary_domain.listened_at
            )
        )
        result = await self.session.execute(stmt)
        existing = result.scalar_one_or_none()
        
        if existing:
            return existing
            
        # 신규 생성
        track_orm = TrackORM(
            id=uuid.uuid4(),
            title=diary_domain.track.title,
            artist=diary_domain.track.artist,
            album_artwork_url=diary_domain.track.album_artwork_url,
            external_platform_id=diary_domain.track.external_platform_id,
            platform_name=diary_domain.track.platform_name
        )
        self.session.add(track_orm)

        context_orm = ContextORM(
            id=uuid.uuid4(),
            latitude=diary_domain.context.latitude,
            longitude=diary_domain.context.longitude,
            place_name=diary_domain.context.place_name,
            weather=diary_domain.context.weather,
            timezone=diary_domain.context.timezone
        )
        self.session.add(context_orm)

        new_diary_orm = AuditoryDiaryORM(
            id=diary_domain.id,
            user_id=diary_domain.user_id,
            track_id=track_orm.id,
            context_id=context_orm.id,
            listened_at=diary_domain.listened_at,
            memo=diary_domain.memo
        )
        self.session.add(new_diary_orm)
        
        await self.session.commit()
        
        # 새 객체에 track과 context 할당 (다시 select 안해도 됨)
        new_diary_orm.track = track_orm
        new_diary_orm.context = context_orm
        return new_diary_orm

    async def update_memo(self, diary_id: uuid.UUID, user_id: uuid.UUID, memo: Optional[str]) -> bool:
        """
        특정 다이어리의 메모를 업데이트. 본인의 다이어리인지 user_id로 검증.
        """
        stmt = select(AuditoryDiaryORM).where(
            AuditoryDiaryORM.id == diary_id,
            AuditoryDiaryORM.user_id == user_id
        )
        result = await self.session.execute(stmt)
        diary = result.scalar_one_or_none()
        
        if not diary:
            return False
            
        diary.memo = memo
        await self.session.commit()
        return True

    async def get_monthly_summary(self, user_id: uuid.UUID, year: int, month: int) -> List[Dict[str, Any]]:
        """
        특정 월의 날짜별 다이어리 개수와 대표 트랙 썸네일(가장 최신 곡) 반환
        """
        # SQLite와 PostgreSQL 차이로 인해 DATE 캐스팅은 RDBMS 의존적이나, SQLAlchemy cast(Date)로 추상화 시도
        stmt = (
            select(
                cast(AuditoryDiaryORM.listened_at, Date).label('date_str'),
                func.count(AuditoryDiaryORM.id).label('record_count'),
                func.max(AuditoryDiaryORM.listened_at).label('latest_record_time')
            )
            .join(TrackORM, AuditoryDiaryORM.track_id == TrackORM.id)
            .where(AuditoryDiaryORM.user_id == user_id)
            .where(extract('year', AuditoryDiaryORM.listened_at) == year)
            .where(extract('month', AuditoryDiaryORM.listened_at) == month)
            .group_by(cast(AuditoryDiaryORM.listened_at, Date))
            .order_by(cast(AuditoryDiaryORM.listened_at, Date))
        )
        result = await self.session.execute(stmt)
        summaries = result.all()

        final_response = []
        for summary in summaries:
            date_str = summary.date_str.strftime("%Y-%m-%d") if summary.date_str else ""
            
            # 대표 썸네일 조회를 위해 가장 늦게 들은 곡(latest_record_time)의 앨범 아트를 서브쿼리 대용으로 조회
            latest_stmt = (
                select(TrackORM.album_artwork_url)
                .join(AuditoryDiaryORM, AuditoryDiaryORM.track_id == TrackORM.id)
                .where(AuditoryDiaryORM.user_id == user_id)
                .where(AuditoryDiaryORM.listened_at == summary.latest_record_time)
                .limit(1)
            )
            thumb_res = await self.session.execute(latest_stmt)
            thumbnail = thumb_res.scalar_one_or_none()

            final_response.append({
                "date": date_str,
                "record_count": summary.record_count,
                "representative_thumbnail": thumbnail
            })
        
        return final_response

    async def get_daily_history(self, user_id: uuid.UUID, date_str: str) -> List[AuditoryDiaryORM]:
        """
        YYYY-MM-DD 형식의 date_str을 받아서 해당 날짜의 전체 타임라인 반환
        presentation schema 변환을 위해 ORM 객체(Joined Load) 반환
        """
        stmt = (
            select(AuditoryDiaryORM)
            .options(selectinload(AuditoryDiaryORM.track), selectinload(AuditoryDiaryORM.context))
            .where(AuditoryDiaryORM.user_id == user_id)
            .where(cast(AuditoryDiaryORM.listened_at, Date) == cast(date_str, Date))
            .order_by(desc(AuditoryDiaryORM.listened_at))
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()
