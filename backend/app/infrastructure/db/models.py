from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Uuid
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from .base import Base

class TrackORM(Base):
    __tablename__ = "tracks"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    artist = Column(String, nullable=False)
    album_artwork_url = Column(String, nullable=True)
    external_platform_id = Column(String, nullable=False, unique=True)
    platform_name = Column(String, nullable=False, default="spotify")
    
    # Track은 여러 개의 AuditoryDiary에 속할 수 있음 (N:M 관계를 1:N 2개로 풀어서 쓸 수 있으나 단순 조회를 위해 직접 매핑은 지양)

class ContextORM(Base):
    __tablename__ = "contexts"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    place_name = Column(String, nullable=True)
    weather = Column(String, nullable=True)
    timezone = Column(String, nullable=False, default="UTC")

class AuditoryDiaryORM(Base):
    __tablename__ = "auditory_diaries"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    track_id = Column(Uuid(as_uuid=True), ForeignKey("tracks.id"), nullable=False)
    context_id = Column(Uuid(as_uuid=True), ForeignKey("contexts.id"), nullable=False)
    
    listened_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    memo = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    # Relationships
    track = relationship("TrackORM", backref="diaries")
    context = relationship("ContextORM", backref="diaries")
