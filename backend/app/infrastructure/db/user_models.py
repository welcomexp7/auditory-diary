from sqlalchemy import Column, String, DateTime, Uuid
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from .base import Base

class UserORM(Base):
    __tablename__ = "users"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=True) # 구글에서 받아올 이름
    google_id = Column(String, unique=True, index=True, nullable=False) # 구글 고유 식별자
    
    # Spotify 연동 토큰 정보 (향후 OAuth 이후 갱신됨)
    spotify_access_token = Column(String, nullable=True)
    spotify_refresh_token = Column(String, nullable=True)
    spotify_token_expires_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    # Relationships (문자열 방식 지연 평가로 순환 참조 방지)
    diaries = relationship("AuditoryDiaryORM", backref="user")
