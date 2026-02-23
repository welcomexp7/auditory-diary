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
            
        # 신규 생성 — 트랙은 external_platform_id로 기존 레코드를 먼저 조회 (UNIQUE 제약 방어)
        existing_track_stmt = select(TrackORM).where(
            TrackORM.external_platform_id == diary_domain.track.external_platform_id
        )
        existing_track_result = await self.session.execute(existing_track_stmt)
        track_orm = existing_track_result.scalar_one_or_none()

        if not track_orm:
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
        from datetime import datetime, timezone, timedelta
        from sqlalchemy.orm import selectinload
        
        kst_tz = timezone(timedelta(hours=9))
        
        # 1. KST 기준 해당 월의 시작과 끝 계산
        # 시작: year-month-01 00:00:00 KST
        start_kst = datetime(year, month, 1, 0, 0, 0, tzinfo=kst_tz)
        
        # 끝: 다음 달의 1일 00:00:00 KST
        next_month = month + 1 if month < 12 else 1
        next_year = year if month < 12 else year + 1
        end_kst = datetime(next_year, next_month, 1, 0, 0, 0, tzinfo=kst_tz)
        
        # UTC로 변환하여 DB 검색 범위 설정
        start_utc = start_kst.astimezone(timezone.utc)
        end_utc = end_kst.astimezone(timezone.utc)
        
        # 2. 이번 달의 모든 다이어리 로드 (selectinload로 N+1 방지)
        stmt = (
            select(AuditoryDiaryORM)
            .options(selectinload(AuditoryDiaryORM.track))
            .where(AuditoryDiaryORM.user_id == user_id)
            .where(AuditoryDiaryORM.listened_at >= start_utc)
            .where(AuditoryDiaryORM.listened_at < end_utc)
            .order_by(AuditoryDiaryORM.listened_at.asc()) # 시간순 정렬
        )
        
        result = await self.session.execute(stmt)
        diaries = result.scalars().all()
        
        # 3. 파이썬 메모리 상에서 KST 날짜를 기준으로 그룹핑 (DB 방언 종속 제거 및 정확도 향상)
        summary_map = {}
        
        for diary in diaries:
            # DB의 UTC를 KST로 변환
            listened_kst = diary.listened_at.replace(tzinfo=timezone.utc).astimezone(kst_tz)
            date_str = listened_kst.strftime("%Y-%m-%d")
            
            if date_str not in summary_map:
                summary_map[date_str] = {
                    "record_count": 0,
                    "latest_record_time": listened_kst,
                    "representative_thumbnail": diary.track.album_artwork_url if diary.track else None
                }
                
            summary = summary_map[date_str]
            summary["record_count"] += 1
            
            # 오름차순 정렬되어 있으므로 가장 마지막 값이 최신 값
            summary["latest_record_time"] = listened_kst
            summary["representative_thumbnail"] = diary.track.album_artwork_url if diary.track else None
            
        final_response = [
            {
                "date": date_str,
                "record_count": data["record_count"],
                "representative_thumbnail": data["representative_thumbnail"]
            }
            for date_str, data in summary_map.items()
        ]
        
        # 날짜순 정렬
        final_response.sort(key=lambda x: x["date"])
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
