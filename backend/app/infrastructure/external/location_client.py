import httpx
from typing import Optional

class LocationAPIClient:
    """
    Google Maps Reverse Geocoding API 등을 활용해 위경도를 장소명(Place Name)으로 반환하는 클라이언트
    """
    # TODO: .env에 GOOGLE_MAPS_API_KEY 추가 필요
    BASE_URL = "https://maps.googleapis.com/maps/api/geocode/json"
    
    def __init__(self, api_key: str = "demo_key"):
        self.api_key = api_key

    async def get_place_name(self, lat: float, lon: float) -> Optional[str]:
        """
        위경도를 기반으로 사람이 읽을 수 있는 주소/장소명을 반환
        """
        url = f"{self.BASE_URL}?latlng={lat},{lon}&key={self.api_key}&language=ko"
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url, timeout=5.0)
                response.raise_for_status()
                data = response.json()
                
                if data.get("status") == "OK" and len(data.get("results", [])) > 0:
                    # 첫 번째(가장 상세한) 결과의 formatted_address 또는 장소명을 반환
                    return data["results"][0]["formatted_address"]
                return None
        except httpx.RequestError:
            return None
