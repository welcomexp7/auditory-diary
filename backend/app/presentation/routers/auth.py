from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
import httpx
from datetime import datetime, timedelta
import jwt

from app.core.config import settings
from app.infrastructure.db.database import get_db_session
from app.infrastructure.repositories.user_repository import UserRepository
from app.presentation.schemas.auth_schemas import GoogleAuthResponse, TokenResponse, SpotifyLinkRequest
import urllib.parse
from fastapi.responses import RedirectResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])

def create_access_token(data: dict, expires_delta: timedelta):
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

@router.post("/google", response_model=TokenResponse)
async def google_auth(
    auth_data: GoogleAuthResponse, 
    session: AsyncSession = Depends(get_db_session)
):
    """
    프론트엔드에서 구글 로그인 후 받은 access_token을 넘겨주면,
    백엔드가 구글 UserInfo를 조회하여 검증 후 자체 JWT 토큰을 발급하는 엔드포인트
    """
    try:
        # 1. Google UserInfo API 호출을 통해 토큰 유효성 검증
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {auth_data.access_token}"}
            )
            if resp.status_code != 200:
                raise ValueError(f"유효하지 않은 Google Access Token (Status: {resp.status_code})")
            
            idinfo = resp.json()

        email = idinfo.get('email')
        if not email:
            raise ValueError("이메일 정보가 제공되지 않았습니다.")
            
        name = idinfo.get('name', '')
        google_id = idinfo.get('sub')

        repo = UserRepository(session)
        
        # 2. 기존 유저 확인 또는 신규 가입 (Application 로직)
        user = await repo.get_by_google_id(google_id)
        if not user:
            user = await repo.create_user(email=email, name=name, google_id=google_id)

        # 3. JWT 베어러 토큰 생성 (Presentation 응답)
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": str(user.id), "email": user.email},
            expires_delta=access_token_expires
        )

        return TokenResponse(
            access_token=access_token,
            user_id=str(user.id),
            email=user.email
        )

    except ValueError as e:
        # Invalid token
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Google Token: {str(e)}"
        )
    except Exception as e:
        # DB 에러 등 예상 못한 오류 → 500이 CORS 헤더를 삼키지 않도록 명시적 HTTPException으로 변환
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"서버 내부 오류: {str(e)}"
        )


@router.get("/spotify/login")
async def spotify_login(token: str):
    """
    프론트엔드에서 스포티파이 연동 버튼 클릭 시 호출하여,
    Spotify OAuth 동의 화면으로 리다이렉트 시키는 엔드포인트.
    사용자 식별을 위해 JWT 토큰을 쿼리파라미터로 받아 검증 후 state에 넣습니다.
    """
    try:
        # JWT 파싱하여 유저 ID 추출
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise ValueError()
    except Exception:
        raise HTTPException(status_code=401, detail="유효하지 않은 토큰입니다.")

    scope = "user-read-recently-played user-read-currently-playing"
    params = {
        "client_id": settings.SPOTIFY_CLIENT_ID,
        "response_type": "code",
        "redirect_uri": settings.SPOTIFY_REDIRECT_URI,
        "scope": scope,
        "state": user_id,
        "show_dialog": "true"
    }
    url = f"https://accounts.spotify.com/authorize?{urllib.parse.urlencode(params)}"
    return RedirectResponse(url)


@router.get("/spotify/callback")
async def spotify_callback(
    code: str,
    state: str,
    session: AsyncSession = Depends(get_db_session)
):
    """
    Spotify에서 사용자가 동의(Agree) 후 브라우저가 GET으로 리다이렉트되는 콜백.
    1. code를 받아 Spotify Token API로 access/refresh token 교환
    2. state 파라미터(user_id)를 이용해 해당 유저 검색 및 토큰 업데이트
    3. 프론트엔드 대시보드로 리다이렉트
    """
    try:
        if not state:
            return RedirectResponse(f"{settings.FRONTEND_URL}/dashboard?spotify_error=no_state")

        # 1. Spotify Token API로 인가 코드 → 토큰 교환
        token_url = "https://accounts.spotify.com/api/token"
        payload = {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": settings.SPOTIFY_REDIRECT_URI,
            "client_id": settings.SPOTIFY_CLIENT_ID,
            "client_secret": settings.SPOTIFY_CLIENT_SECRET,
        }

        async with httpx.AsyncClient() as client:
            resp = await client.post(token_url, data=payload)
            if resp.status_code != 200:
                return RedirectResponse(
                    f"{settings.FRONTEND_URL}/dashboard?spotify_error={urllib.parse.quote(resp.text)}"
                )
            token_data = resp.json()

        # 2. state에 담긴 uuid로 유저 조회
        import uuid
        from app.infrastructure.db.user_models import UserORM
        
        try:
            user_uuid = uuid.UUID(state)
        except ValueError:
            return RedirectResponse(f"{settings.FRONTEND_URL}/dashboard?spotify_error=invalid_state")
            
        user = await session.get(UserORM, user_uuid)

        if not user:
            return RedirectResponse(f"{settings.FRONTEND_URL}/dashboard?spotify_error=no_user")

        user.spotify_access_token = token_data.get("access_token")
        
        new_refresh = token_data.get("refresh_token")
        if new_refresh:
            user.spotify_refresh_token = new_refresh

        expires_in = token_data.get("expires_in", 3600)
        user.spotify_token_expires_at = datetime.utcnow() + timedelta(seconds=expires_in)

        await session.commit()

        # 3. 성공 → 프론트엔드 대시보드로 리다이렉트
        return RedirectResponse(f"{settings.FRONTEND_URL}/dashboard?spotify=connected")

    except Exception as e:
        import traceback
        traceback.print_exc()
        return RedirectResponse(
            f"{settings.FRONTEND_URL}/dashboard?spotify_error={urllib.parse.quote(str(e))}"
        )

