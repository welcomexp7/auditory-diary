from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class TrackSchema(BaseModel):
    title: str
    artist: str
    album_artwork_url: Optional[str] = None
    external_platform_id: str
    platform_name: str

class ContextSchema(BaseModel):
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    place_name: Optional[str] = None
    weather: Optional[str] = None
    timezone: str = "UTC"

class DiaryCreateRequest(BaseModel):
    """
    클라이언트에서 수동으로 일기를 추가하거나, 
    위치 정보와 함께 최근 곡을 기록할 때 사용하는 요청 스키마
    """
    latitude: Optional[float] = Field(None, description="현재 위도")
    longitude: Optional[float] = Field(None, description="현재 경도")
    memo: Optional[str] = Field(None, description="사용자 메모")

class MemoUpdateRequest(BaseModel):
    """
    기존 다이어리의 메모 내용만 수정할 때 사용하는 요청 스키마
    """
    memo: Optional[str] = Field(None, description="수정할 사용자 메모 (빈 문자열이면 삭제)")

class DiaryResponse(BaseModel):
    id: UUID
    user_id: UUID
    track: TrackSchema
    context: ContextSchema
    listened_at: datetime
    memo: Optional[str] = None

    model_config = {"from_attributes": True}

class CalendarDaySummary(BaseModel):
    date: str = Field(..., description="날짜 문자열 (YYYY-MM-DD)")
    record_count: int = Field(..., description="해당 날짜에 기록된 다이어리 개수")
    representative_thumbnail: Optional[str] = Field(None, description="가장 많이 들은(혹은 최신) 곡의 앨범 아트")
