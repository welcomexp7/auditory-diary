import google.generativeai as genai
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class AICapsuleClient:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        if self.api_key:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel('gemini-1.5-flash')
        else:
            self.model = None
            logger.warning("GEMINI_API_KEY is not set. AI Capsule features will not work.")

    async def generate_daily_summary(self, tracks_context: list[str], majority_weather: str = None) -> str:
        """
        제공된 트랙 컨텍스트(아티스트, 트랙명 등)와 날씨 정보를 바탕으로
        감성적이고 시적인 형태의 다이어리 한 줄 요약을 생성합니다.

        tracks_context: ["Song Title 1 by Artist 1", "Song Title 2 by Artist 2", ...]
        """
        if not self.model:
            return "AI 요약 기능이 설정되지 않았습니다. (API KEY 누락)"

        if not tracks_context:
            return "오늘은 기록된 노래가 없네요. 어떤 하루를 보내셨나요?"

        # 프롬프트 설계: 환각 방지 및 톤앤매너 고정
        track_list_str = "\n".join([f"- {track}" for track in tracks_context])
        weather_str = f"오늘의 주된 날씨: {majority_weather}" if majority_weather else ""

        prompt = f"""
        당신은 감성적이고 통찰력 있는 '음악 다이어리 큐레이터'입니다.
        사용자가 오늘 하루 동안 들은 아래의 플레이리스트와 날씨 정보를 바탕으로, 
        오늘 하루가 어떤 분위기였을지 유추하여 시적이고 감성적인 '한 줄 평(1~2문장)' 형태의 일기를 써주세요.

        [데이터]
        {weather_str}
        오늘 들은 곡들:
        {track_list_str}

        [조건]
        1. 절대 듣지 않은 가상의 곡이나 아티스트 이름을 지어내면 안 됩니다. (환각 금지)
        2. 제공된 데이터를 완벽하게 믿고, 그 바탕 위에서만 감정/분위기를 추론하세요.
        3. 마침표로 끝나는 깔끔한 완성형 문장으로 작성하며, 존댓말(~해요. ~했네요. 부드러운 평어체)을 사용하세요.
        4. 오직 요약된 다이어리 문장만 반환하세요. (쓸데없는 서론 금지)
        """

        try:
            # Gemini-1.5-flash 호출 시 보통 1~3초 소요
            response = await self.model.generate_content_async(prompt)
            summary_text = response.text.strip()
            # 마크다운 등 제거 (필요 시)
            summary_text = summary_text.replace("*", "")
            return summary_text
        except Exception as e:
            logger.error(f"Gemini API Error: {str(e)}")
            return "오늘 하루의 분위기를 AI가 읽어내는 중 오류가 발생했어요."
