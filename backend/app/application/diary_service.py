from typing import Optional, List
import uuid

from app.domain.models import AuditoryDiary as DomainDiary, Track as DomainTrack, Context as DomainContext
from app.infrastructure.repositories.diary_repository import AuditoryDiaryRepository
from app.infrastructure.external.spotify_client import SpotifyAPIClient
from app.infrastructure.external.weather_client import WeatherAPIClient
from app.infrastructure.external.location_client import LocationAPIClient

class DiaryService:
    """
    Application Layer: 다이어리 생성 및 조회 유스케이스 구현
    도메인 로직과 외부 인프라스트럭처의 조율(Orchestration) 담당
    """
    def __init__(self, 
                 repository: AuditoryDiaryRepository,
                 spotify_client: SpotifyAPIClient,
                 weather_client: WeatherAPIClient,
                 location_client: LocationAPIClient):
        self.repo = repository
        self.spotify_client = spotify_client
        self.weather_client = weather_client
        self.location_client = location_client

    async def create_diary_from_current_context(
        self, user_id: uuid.UUID, spotify_access_token: str, 
        lat: Optional[float] = None, lon: Optional[float] = None, memo: Optional[str] = None
    ) -> DomainDiary:
        """
        사용자의 상태(위치, 토큰)를 기반으로 최신 재생 곡을 가져와 일기를 생성합니다.
        """
        # 1. 외부 API 연동하여 데이터 수집
        currently_playing = await self.spotify_client.get_currently_playing(spotify_access_token)
        track_data = None
        
        if currently_playing and "item" in currently_playing:
            track_data = currently_playing["item"]
        else:
            # 재생 중인게 없다면 최근 재생 목록의 가장 최신 곡을 가져옴
            recent = await self.spotify_client.get_recently_played(spotify_access_token, limit=1)
            if recent:
                track_data = recent[0]["track"]
                
        if not track_data:
            raise ValueError("감지된 음악 재생 기록이 없습니다.")
            
        # 2. Track VO 생성
        track = DomainTrack(
            title=track_data.get("name", "Unknown Title"),
            artist=", ".join([artist["name"] for artist in track_data.get("artists", [])]),
            album_artwork_url=track_data.get("album", {}).get("images", [{}])[0].get("url"),
            external_platform_id=track_data.get("id", ""),
            platform_name="spotify"
        )
        
        # 3. Context VO 생성 (위경도가 있다면 날씨/장소명 조회)
        weather, place_name = None, None
        if lat and lon:
            # NOTE: 병렬(asyncio.gather)로 호출하여 성능 최적화 가능
            weather = await self.weather_client.get_weather_by_coordinates(lat, lon)
            place_name = await self.location_client.get_place_name(lat, lon)
            
        context = DomainContext(
            latitude=lat,
            longitude=lon,
            place_name=place_name,
            weather=weather,
            timezone="UTC"
        )
        
        # 4. Entity 지휘 및 저장
        diary = DomainDiary(
            user_id=user_id,
            track=track,
            context=context,
            memo=memo
        )
        
        return await self.repo.save(diary)

    async def sync_recently_played(
        self, user_id: uuid.UUID, session: Any, limit: int = 10
    ) -> List[Any]:
        """
        [Sync-on-Demand] 
        사용자의 최근 스포티파이 재생 목록을 가져와서 DB에 저장(없으면 생성)한 뒤,
        UUID가 부여된 최신 상태의 다이어리 ORM 리스트를 반환합니다.
        (토큰이 만료된 경우 자동으로 Refresh Token을 사용해 갱신합니다)
        """
        import datetime
        import httpx
        from app.infrastructure.db.user_models import UserORM
        from app.core.config import settings
        
        # 1. 유저 정보 로드
        user = await session.get(UserORM, user_id)
        if not user or not user.spotify_access_token:
            return []

        # 2. 토큰 만료 검사 및 자동 갱신
        if user.spotify_token_expires_at and datetime.datetime.utcnow() >= user.spotify_token_expires_at:
            if user.spotify_refresh_token:
                token_url = "https://accounts.spotify.com/api/token"
                payload = {
                    "grant_type": "refresh_token",
                    "refresh_token": user.spotify_refresh_token,
                    "client_id": settings.SPOTIFY_CLIENT_ID,
                    "client_secret": settings.SPOTIFY_CLIENT_SECRET,
                }
                async with httpx.AsyncClient() as client:
                    resp = await client.post(token_url, data=payload)
                    if resp.status_code == 200:
                        token_data = resp.json()
                        user.spotify_access_token = token_data.get("access_token")
                        if "refresh_token" in token_data:
                            user.spotify_refresh_token = token_data.get("refresh_token")
                        expires_in = token_data.get("expires_in", 3600)
                        user.spotify_token_expires_at = datetime.datetime.utcnow() + datetime.timedelta(seconds=expires_in)
                        await session.commit()
                    else:
                        print("Failed to refresh token:", resp.text)
                        return [] # 갱신 실패 시 빈 배열

        # 3. 데이터 동기화
        items = await self.spotify_client.get_recently_played(user.spotify_access_token, limit=limit)
        
        result_orms = []
        for item in items:
            track_data = item.get("track", {})
            played_at_str = item.get("played_at")
            if not track_data or not played_at_str:
                continue
                
            try:
                # ISO8601 parsing (Z -> +00:00 for compatibility)
                played_at = datetime.datetime.fromisoformat(played_at_str.replace("Z", "+00:00"))
            except Exception:
                continue

            track = DomainTrack(
                title=track_data.get("name", "Unknown Title"),
                artist=", ".join([a.get("name") for a in track_data.get("artists", [])]),
                album_artwork_url=track_data.get("album", {}).get("images", [{}])[0].get("url"),
                external_platform_id=track_data.get("id", ""),
                platform_name="spotify"
            )
            
            context = DomainContext(
                place_name="Spotify에서 재생",
                weather="",
                timezone="UTC"
            )
            
            diary_domain = DomainDiary(
                id=uuid.uuid4(),
                user_id=user_id,
                track=track,
                context=context,
                listened_at=played_at,
                memo=None
            )
            
            diary_orm = await self.repo.get_or_create_by_listened_at(diary_domain)
            result_orms.append(diary_orm)
            
        return result_orms
