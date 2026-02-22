from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime, timezone
from uuid import UUID, uuid4

def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)

# 1. Value Objects
class Track(BaseModel):
    """
    재생된 곡 정보를 담는 순수 값 객체 (Value Object)
    """
    model_config = ConfigDict(frozen=True) # VO는 불변(Immutable)이어야 함

    title: str = Field(..., title="곡명", description="재생된 곡의 제목")
    artist: str = Field(..., title="아티스트", description="곡을 부른 아티스트명")
    album_artwork_url: Optional[str] = Field(None, title="앨범 아트워크", description="앨범 아트워크 이미지 URL")
    external_platform_id: str = Field(..., title="플랫폼 곡 ID", description="외부 플랫폼(예: Spotify)의 트랙 고유 ID")
    platform_name: str = Field(default="spotify", title="플랫폼 이름", description="음원 재생 플랫폼명")

class Context(BaseModel):
    """
    곡을 들었을 당시의 상황/맥락을 담는 순수 값 객체 (Value Object)
    """
    model_config = ConfigDict(frozen=True)

    latitude: Optional[float] = Field(None, title="위도", description="재생 위치의 위도")
    longitude: Optional[float] = Field(None, title="경도", description="재생 위치의 경도")
    place_name: Optional[str] = Field(None, title="장소명", description="좌표 기반의 휴먼 리더블한 장소명 (예: 한강공원)")
    weather: Optional[str] = Field(None, title="날씨", description="당시 날씨 (예: 맑음, 비)")
    timezone: str = Field(default="UTC", title="시간대", description="재생 당시의 지역 시간대")

# 2. Entities
class User(BaseModel):
    """
    도메인의 핵심 엔티티: 사용자
    """
    id: UUID = Field(default_factory=uuid4, title="유저 ID", description="유저 고유 식별자")
    email: str = Field(..., title="이메일", description="유저 이메일 (로그인/알림용)")
    created_at: datetime = Field(default_factory=get_utc_now, title="가입일시")

class AuditoryDiary(BaseModel):
    """
    도메인의 핵심 엔티티: 오디오 일기 기록
    """
    id: UUID = Field(default_factory=uuid4, title="오디오 일기 ID", description="기록의 고유 식별자")
    user_id: UUID = Field(..., title="작성자(유저) ID", description="기록을 소유한 유저의 ID")
    
    # Value Objects 포함
    track: Track = Field(..., title="재생 트랙", description="이 일기와 연관된 재생 곡 정보")
    context: Context = Field(..., title="재생 맥락", description="이 곡을 들은 당시의 환경 정보")
    
    listened_at: datetime = Field(
        default_factory=get_utc_now, 
        title="재생 일시", 
        description="이 트랙을 들었던 시점(UTC 기준)"
    )
    memo: Optional[str] = Field(None, title="사용자 메모", description="사용자가 직접 남긴 감정이나 메모 (선택적)")
