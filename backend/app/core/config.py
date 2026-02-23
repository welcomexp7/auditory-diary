from pydantic import BaseModel, ConfigDict, Field
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """
    애플리케이션 전역 환경 변수 관리 (Pydantic Settings)
    .env 파일 생성을 권장합니다.
    """
    model_config = ConfigDict(env_file=".env", env_file_encoding="utf-8")

    # App
    PROJECT_NAME: str = "Auditory Diary API"
    VERSION: str = "1.0.0"

    # Frontend URL (배포 시 Vercel URL로 변경)
    FRONTEND_URL: str = "http://127.0.0.1:3000"

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./auditory_diary.db"

    # Google OAuth (회원가입/로그인용)
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://127.0.0.1:8000/api/auth/google/callback" # 프론트나 백엔드 콜백 주소

    # Spotify (음악 스크로블링/검색용)
    SPOTIFY_CLIENT_ID: str = ""
    SPOTIFY_CLIENT_SECRET: str = ""
    SPOTIFY_REDIRECT_URI: str = "http://127.0.0.1:8000/api/auth/spotify/callback"

    # JWT (세션 유지용)
    SECRET_KEY: str = "your-super-secret-key-change-it-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days

    # AI (Gemini)
    GEMINI_API_KEY: str = ""

settings = Settings()
