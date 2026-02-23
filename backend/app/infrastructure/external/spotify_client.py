import httpx
from datetime import datetime
from typing import Optional, List, Dict, Any, Set
import logging

from app.domain.models import Track as DomainTrack
from app.core.config import settings

logger = logging.getLogger(__name__)


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
                raise ValueError("Spotify Access Token is expired or invalid.")
            
            response.raise_for_status()
            data = response.json()
            
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
            
            if response.status_code == 204:
                return None
            
            if response.status_code == 401:
                raise ValueError("Spotify Access Token is expired or invalid.")
                
            response.raise_for_status()
            return response.json()

    # ──────────────────────────────────────────────
    # 아티스트 장르 조회 (AI Capsule용)
    # Why: Audio Features API 폐기(2024.11) 이후, 장르 데이터가
    #      LLM에게 곡의 무드를 추론시키는 핵심 단서가 됩니다.
    # ──────────────────────────────────────────────
    async def get_artists_genres(
        self,
        access_token: str,
        artist_names: List[str]
    ) -> Dict[str, List[str]]:
        """
        아티스트 이름 목록을 받아 Spotify Search API로 ID를 찾고,
        각 아티스트의 장르(genres) 리스트를 반환합니다.
        실패해도 캡슐 생성을 막지 않도록 빈 dict를 반환합니다.
        """
        if not artist_names:
            return {}

        # 중복 제거 (같은 아티스트를 여러 번 조회하지 않도록)
        unique_artists = list(dict.fromkeys(artist_names))[:10]  # 최대 10명으로 제한 (API 비용 절약)
        result: Dict[str, List[str]] = {}

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                headers = await self._get_headers(access_token)

                for artist_name in unique_artists:
                    try:
                        # Spotify Search API로 아티스트 ID 조회
                        search_url = f"{self.BASE_URL}/search"
                        params = {
                            "q": f'artist:"{artist_name}"',
                            "type": "artist",
                            "limit": 1
                        }
                        resp = await client.get(search_url, headers=headers, params=params)

                        if resp.status_code != 200:
                            logger.warning(f"Artist search failed for '{artist_name}': {resp.status_code}")
                            continue

                        artists_data = resp.json().get("artists", {}).get("items", [])
                        if not artists_data:
                            continue

                        # 첫 번째 매칭 결과에서 장르 추출
                        genres = artists_data[0].get("genres", [])
                        if genres:
                            result[artist_name] = genres

                    except Exception as e:
                        logger.warning(f"Genre fetch failed for '{artist_name}': {e}")
                        continue

        except Exception as e:
            # 전체 장르 조회 실패해도 캡슐 생성에는 영향 없음 (Graceful Degradation)
            logger.error(f"Artists genres batch fetch failed: {e}")

        return result
