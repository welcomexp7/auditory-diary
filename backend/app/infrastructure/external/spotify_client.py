import httpx
from datetime import datetime
from typing import Optional, List, Dict, Any

from app.domain.models import Track as DomainTrack
from app.core.config import settings

class SpotifyAPIClient:
    """
    Spotify Web API 연동을 담당하는 Infrastructure 계층의 클라이언트
    """
    BASE_URL = "https://api.spotify.com/v1"

    async def _get_headers(self, access_token: str) -> dict:
        return {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }

    async def get_recently_played(self, access_token: str, limit: int = 10) -> List[Dict[str, Any]]:
        """
        사용자의 최근 재생 목록을 가져옵니다.
        주의: Spotify API는 최근 50개까지의 제약이 있으며,
             현재 재생 중인 곡은 포함되지 않을 수 있습니다.
        """
        url = f"{self.BASE_URL}/me/player/recently-played?limit={limit}"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                url, headers=await self._get_headers(access_token)
            )
            
            if response.status_code == 401:
                # TODO: Token Refresh 로직 호출 필요 (Application 계층에서 처리하거나 여기서 Exception throw)
                raise ValueError("Spotify Access Token is expired or invalid.")
            
            response.raise_for_status()
            data = response.json()
            
            # API 응답 원본 반환 (파싱은 Application/Domain 서비스에서 수행하여 결합도 낮춤)
            return data.get("items", [])

    async def get_currently_playing(self, access_token: str) -> Optional[Dict[str, Any]]:
        """
        사용자가 현재 재생 중인 곡을 가져옵니다.
        재생 중이 아니라면 None을 반환합니다.
        """
        url = f"{self.BASE_URL}/me/player/currently-playing"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                url, headers=await self._get_headers(access_token)
            )
            
            if response.status_code == 204: # No Content (현재 진행 중인 재생 없음)
                return None
            
            if response.status_code == 401:
                raise ValueError("Spotify Access Token is expired or invalid.")
                
            response.raise_for_status()
            return response.json()
