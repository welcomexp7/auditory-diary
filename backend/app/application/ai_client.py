import google.generativeai as genai
from app.core.config import settings
import logging
import asyncio
import random
from collections import Counter

logger = logging.getLogger(__name__)


class AICapsuleClient:
    """Gemini API를 통해 하루의 청취 기록을 감성적인 한 줄 요약으로 변환하는 AI 클라이언트."""

    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        if self.api_key:
            genai.configure(api_key=self.api_key)
            # gemini-2.0-flash-lite: 무료 티어 분당 30회 허용 (비용 최적화)
            self.model = genai.GenerativeModel('gemini-2.0-flash-lite')
        else:
            self.model = None
            logger.warning("GEMINI_API_KEY is not set. AI Capsule features will not work.")

    # ──────────────────────────────────────────────
    # Private: 트랙 컨텍스트에서 최빈 아티스트를 추출하는 유틸리티
    # ──────────────────────────────────────────────
    @staticmethod
    def _extract_top_artist(tracks_context: list[str]) -> str | None:
        """
        "'Track Title' by Artist Name" 포맷의 문자열 리스트에서
        가장 많이 등장한 아티스트를 추출합니다.
        여러 아티스트가 동률이면 첫 번째 등장 아티스트를 사용합니다.
        """
        artists: list[str] = []
        for track in tracks_context:
            # 포맷: "'곡명' by 아티스트" — 'by' 키워드로 분리
            if " by " in track:
                artist_part = track.split(" by ", 1)[1].strip()
                # 피처링(feat) 등이 포함된 경우 첫 번째 아티스트만 사용
                primary_artist = artist_part.split(",")[0].strip()
                artists.append(primary_artist)

        if not artists:
            return None

        # 빈도수 기준 최빈 아티스트 반환
        artist_counts = Counter(artists)
        return artist_counts.most_common(1)[0][0]

    # ──────────────────────────────────────────────
    # Private: API 실패 시 청취 데이터 기반 동적 폴백 문구 생성
    # Why: 고정된 더미 텍스트는 어떤 날에나 똑같아서 사용자에게 무의미하므로,
    #      실제 들은 아티스트/날씨를 기반으로 맥락 있는 문구를 조립합니다.
    # ──────────────────────────────────────────────
    @staticmethod
    def _build_context_aware_fallback(
        tracks_context: list[str],
        majority_weather: str | None = None
    ) -> str:
        """트랙 리스트와 날씨 정보를 활용해 맥락에 맞는 폴백 문구를 조립합니다."""

        top_artist = AICapsuleClient._extract_top_artist(tracks_context)
        track_count = len(tracks_context)

        # 날씨 기반 분위기 키워드 매핑 (도메인 정책)
        weather_moods: dict[str, str] = {
            "Clear": "맑은 하늘 아래",
            "Clouds": "구름이 낮게 드리운 오후",
            "Rain": "빗소리가 배경음이 된 하루",
            "Snow": "눈이 내리는 고요한 시간",
            "Drizzle": "이슬비가 내리는 잔잔한 하루",
            "Thunderstorm": "천둥이 울리는 격정의 하루",
            "Mist": "안개 속을 걷는 듯한 몽환적인 하루",
            "Fog": "안개에 싸인 아늑한 하루",
        }
        weather_phrase = weather_moods.get(majority_weather, "") if majority_weather else ""

        # 아티스트 기반 + 날씨 기반 조합 템플릿 (랜덤 셔플로 매번 다른 느낌)
        if top_artist and weather_phrase:
            templates = [
                f"{weather_phrase}, {top_artist}의 음악이 유독 마음에 머물렀던 하루. 그 선율이 당신의 작은 위로가 되었기를 바랍니다.",
                f"{weather_phrase} {top_artist}의 목소리가 함께했네요. {track_count}곡의 여운이 오래 남는 밤이 되기를.",
                f"{top_artist}와 함께한 {weather_phrase}. 음악이 만들어 준 오늘의 온도를 기억해 주세요.",
            ]
        elif top_artist:
            templates = [
                f"{top_artist}의 음악이 유독 마음에 머물렀던 하루. 그 선율이 당신의 작은 위로가 되었기를 바랍니다.",
                f"오늘 하루, {top_artist}의 노래가 당신 곁에 머물렀네요. {track_count}곡의 여운이 밤을 채워주기를.",
                f"{top_artist}의 멜로디가 하루를 감싸 안았던 오늘. 음악이 건네는 위로를 느끼셨기를 바랍니다.",
            ]
        else:
            # 아티스트 추출 실패 시에도 곡 수라도 반영
            templates = [
                f"오늘 하루 {track_count}곡의 음악이 당신 곁을 지켰습니다. 그 선율들이 작은 위로가 되었기를 바랍니다.",
                f"{track_count}개의 음표가 수놓은 하루. 음악이 만들어 준 오늘의 온도를 기억해 주세요.",
            ]

        return random.choice(templates)

    # ──────────────────────────────────────────────
    # Public: 하루 요약 생성 (LLM 호출 + Graceful Fallback)
    # ──────────────────────────────────────────────
    async def generate_daily_summary(
        self,
        tracks_context: list[str],
        majority_weather: str | None = None,
        genres_map: dict[str, list[str]] | None = None
    ) -> str:
        """
        트랙 컨텍스트(아티스트, 곡명), 날씨, 장르 정보를 Gemini API에 전달하여
        감성적인 1~2문장 요약을 생성합니다.
        API 실패 시에는 실제 청취 데이터를 기반으로 동적 폴백 문구를 반환합니다.
        """
        if not self.model:
            return "AI 요약 기능이 설정되지 않았습니다. (API KEY 누락)"

        if not tracks_context:
            return "오늘은 기록된 노래가 없네요. 어떤 하루를 보내셨나요?"

        # 토큰 비용 절약: 상위 15곡만 프롬프트에 포함
        trimmed_tracks = tracks_context[:15]
        track_list_str = "\n".join([f"- {t}" for t in trimmed_tracks])
        weather_str = f"오늘의 주된 날씨: {majority_weather}" if majority_weather else ""
        extra_note = (
            f"(총 {len(tracks_context)}곡 중 대표 {len(trimmed_tracks)}곡 기준)"
            if len(tracks_context) > 15 else ""
        )

        # 장르 컨텍스트 조립 — LLM이 곡의 무드/에너지를 추론하는 핵심 단서
        genre_str = ""
        if genres_map:
            genre_lines = [
                f"- {artist}: {', '.join(genres)}"
                for artist, genres in genres_map.items()
            ]
            genre_str = "아티스트별 음악 장르:\n" + "\n".join(genre_lines)

        prompt = f"""당신은 감성적인 '음악 다이어리 큐레이터'이자 음악 전문가입니다.
사용자가 오늘 하루 동안 들은 플레이리스트와 아티스트 장르 정보를 바탕으로,
곡들의 전체적인 무드, 에너지, 감정적 톤을 분석하고,
그 하루의 분위기를 시적이고 감성적인 1~2문장으로 요약해주세요.

{weather_str}
{genre_str}
오늘 들은 곡들 {extra_note}:
{track_list_str}

지침:
- 곡명이나 아티스트명을 직접 언급하지 말고, 음악의 분위기와 감정을 중심으로 서술하세요.
- 장르 정보를 활용하여 곡들의 에너지(차분한/격렬한), 무드(몽환적/밝은/어두운), 감정(위로/설렘/그리움) 등을 추론하세요.
- 날씨 정보가 있다면 자연스럽게 녹여내세요.
- 가상의 곡을 지어내지 말 것.
- 마침표로 끝나는 부드러운 평어체 존댓말.
- 요약 문장만 반환."""

        # 최대 3회 시도 (ResourceExhausted 등 일시적 에러 대비)
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

                is_rate_limited = "ResourceExhausted" in str(e) or "429" in str(e)
                if is_rate_limited and attempt < 2:
                    wait_time = (attempt + 1) * 5
                    logger.info(f"Rate limit hit, {wait_time}s 대기 후 재시도...")
                    await asyncio.sleep(wait_time)
                    continue

                # 재시도 한도 초과 OR 비-Rate Limit 에러 → 동적 폴백
                fallback = self._build_context_aware_fallback(tracks_context, majority_weather)
                logger.info(f"Fallback 문구 반환: {fallback[:60]}...")
                return fallback

        # 루프를 모두 소진한 경우 (이론상 도달하지 않지만 안전망)
        return self._build_context_aware_fallback(tracks_context, majority_weather)
