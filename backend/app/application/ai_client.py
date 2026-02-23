import google.generativeai as genai
from app.core.config import settings
import logging
import asyncio

logger = logging.getLogger(__name__)

class AICapsuleClient:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        if self.api_key:
            genai.configure(api_key=self.api_key)
            # gemini-2.0-flash-lite는 무료 티어에서 분당 30회 허용 (ResourceExhausted 방지)
            self.model = genai.GenerativeModel('gemini-2.0-flash-lite')
        else:
            self.model = None
            logger.warning("GEMINI_API_KEY is not set. AI Capsule features will not work.")

    async def generate_daily_summary(self, tracks_context: list[str], majority_weather: str = None) -> str:
        """
        제공된 트랙 컨텍스트(아티스트, 트랙명 등)와 날씨 정보를 바탕으로
        감성적이고 시적인 형태의 다이어리 한 줄 요약을 생성합니다.
        """
        if not self.model:
            return "AI 요약 기능이 설정되지 않았습니다. (API KEY 누락)"

        if not tracks_context:
            return "오늘은 기록된 노래가 없네요. 어떤 하루를 보내셨나요?"

        # 트랙이 너무 많으면 토큰 절약을 위해 상위 15곡만 사용
        trimmed_tracks = tracks_context[:15]
        track_list_str = "\n".join([f"- {track}" for track in trimmed_tracks])
        weather_str = f"오늘의 주된 날씨: {majority_weather}" if majority_weather else ""
        extra_note = f"(총 {len(tracks_context)}곡 중 대표 {len(trimmed_tracks)}곡 기준)" if len(tracks_context) > 15 else ""

        prompt = f"""당신은 감성적인 '음악 다이어리 큐레이터'입니다.
사용자가 오늘 들은 플레이리스트를 바탕으로, 하루의 분위기를 시적이고 감성적인 1~2문장으로 요약해주세요.

{weather_str}
오늘 들은 곡들 {extra_note}:
{track_list_str}

조건: 가상의 곡을 지어내지 말 것. 마침표로 끝나는 부드러운 평어체 존댓말. 요약 문장만 반환."""

        # 최대 2회 재시도 (ResourceExhausted 등 일시적 에러 대응)
        for attempt in range(3):
            try:
                logger.info(f"Gemini API 호출 (attempt {attempt+1}) — 트랙 {len(trimmed_tracks)}곡")
                response = await asyncio.to_thread(
                    self.model.generate_content, prompt
                )
                summary_text = response.text.strip().replace("*", "")
                logger.info(f"Gemini API 응답 성공: {summary_text[:80]}...")
                return summary_text
            except Exception as e:
                error_name = type(e).__name__
                logger.error(f"Gemini API Error (attempt {attempt+1}): {error_name}: {str(e)}")
                if "ResourceExhausted" in str(e) or "429" in str(e):
                    if attempt < 2:
                        wait_time = (attempt + 1) * 5
                        logger.info(f"Rate limit, {wait_time}s 대기 후 재시도...")
                        await asyncio.sleep(wait_time)
                        continue
                return f"AI가 오늘의 분위기를 읽어내는 중 오류가 발생했어요. ({error_name})"
        
        return "AI 요약 생성에 실패했어요. 잠시 후 다시 시도해주세요."
