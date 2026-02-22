from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import Optional
import uuid

from app.infrastructure.db.user_models import UserORM

class UserRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_email(self, email: str) -> Optional[UserORM]:
        stmt = select(UserORM).where(UserORM.email == email)
        result = await self.session.execute(stmt)
        return result.scalars().first()
    
    async def get_by_google_id(self, google_id: str) -> Optional[UserORM]:
        stmt = select(UserORM).where(UserORM.google_id == google_id)
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def get_by_id(self, user_id: uuid.UUID) -> Optional[UserORM]:
        stmt = select(UserORM).where(UserORM.id == user_id)
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def create_user(self, email: str, name: str, google_id: str) -> UserORM:
        new_user = UserORM(
            email=email,
            name=name,
            google_id=google_id
        )
        self.session.add(new_user)
        await self.session.commit()
        await self.session.refresh(new_user)
        return new_user
    
    async def update_spotify_tokens(self, user_id: uuid.UUID, access_token: str, refresh_token: str, expires_at) -> Optional[UserORM]:
        stmt = select(UserORM).where(UserORM.id == user_id)
        result = await self.session.execute(stmt)
        user = result.scalars().first()
        
        if user:
            user.spotify_access_token = access_token
            user.spotify_refresh_token = refresh_token
            user.spotify_token_expires_at = expires_at
            await self.session.commit()
            await self.session.refresh(user)
        return user
