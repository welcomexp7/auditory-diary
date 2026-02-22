from pydantic import BaseModel, Field
from typing import Optional

class GoogleAuthResponse(BaseModel):
    access_token: str = Field(..., description="Google에서 발급받은 OAuth 향 액세스 토큰")

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str

class SpotifyLinkRequest(BaseModel):
    authorization_code: str = Field(..., description="Spotify 로그인 후 받은 코드")
