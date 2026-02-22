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

class DiaryResponse(BaseModel):
    id: UUID
    user_id: UUID
    track: TrackSchema
    context: ContextSchema
    listened_at: datetime
    memo: Optional[str] = None

    model_config = {"from_attributes": True}
