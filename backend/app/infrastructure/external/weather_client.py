import httpx
from typing import Optional, Dict, Any
from app.core.config import settings

class WeatherAPIClient:
    """
    OpenWeather API 등을 활용해 주어진 위경도의 현재 날씨를 가져오는 클라이언트
    """
    # TODO: .env에 OPENWEATHER_API_KEY 추가 필요
    BASE_URL = "https://api.openweathermap.org/data/2.5/weather"
    
    def __init__(self, api_key: str = "demo_key"):
        self.api_key = api_key

    async def get_weather_by_coordinates(self, lat: float, lon: float) -> Optional[str]:
        """
        위경도를 기반으로 날씨 상태(예: 'Clear', 'Clouds', 'Rain')를 반환
        """
        url = f"{self.BASE_URL}?lat={lat}&lon={lon}&appid={self.api_key}&units=metric"
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url, timeout=5.0)
                response.raise_for_status()
                data = response.json()
                
                # weather 배열의 첫 번째 항목의 main 상태를 반환
                if "weather" in data and len(data["weather"]) > 0:
                    return data["weather"][0]["main"]
                return None
        except httpx.RequestError:
            # 외부 API 장애 시 전체 로직이 죽지 않도록 예외 처리 후 None 반환 (Graceful degradation)
            return None
