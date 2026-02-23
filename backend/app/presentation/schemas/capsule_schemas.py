from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime
from uuid import UUID

class CapsuleCreateRequest(BaseModel):
    """
    특정 날짜의 AI 캡슐 생성을 요청할 때 사용하는 스키마
    - 프론트엔드가 타임라인 뷰에서 특정 '선택된 날짜'를 전달
    """
    target_date: str = Field(..., description="YYYY-MM-DD 형태의 문자열", pattern=r"^\d{4}-\d{2}-\d{2}$")

class DailyCapsuleResponse(BaseModel):
    """
    생성된 AI 캡슐의 결과를 반환하거나 조회할 때 사용하는 스키마
    """
    id: UUID
    user_id: UUID
    target_date: date
    ai_summary: str
    representative_image_url: Optional[str] = None
    theme: str
    created_at: datetime
    
    model_config = {"from_attributes": True}
