# Auditory Diary - 프로젝트 Handoff & Context Document

이 문서는 다음 작업을 이어갈 AI 에이전트(혹은 개발자)가 **최근까지 진행된 Phase 5 (AI Daily Capsule) 개발 내용과 현재 극복한 주요 이슈**를 빠르게 파악할 수 있도록 압축된 요약본입니다.

---

## 1. 최근 구현된 핵심 기능 (Phase 5: AI Daily Capsule)
사용자가 하루 동안 Spotify에서 들은 곡들을 KST(한국시간) 기준으로 모아, 그날의 날씨 정보와 함께 **AI가 시적인 한 줄 일기(요약)**를 작성해주고, 이 결과를 인스타그램 스토리 비율(9:16)의 이미지로 저장할 수 있게 하는 기능입니다.

### [Backend (FastAPI)]
- **DB 스키마:** `models.py`에 `DailyCapsuleORM` 추가. (id, user_id, target_date, ai_summary, representative_image_url, created_at). 로컬 환경이라 alembic 대신 서버 기동 시 `Base.metadata.create_all`로 자동 매핑됨.
- **AI 연동 (`ai_client.py`):** 
  - `google-generativeai` 라이브러리 연동 (API Key는 `.env`의 `GEMINI_API_KEY` 사용)
  - 비용 및 무료 티어 제한 회피를 위해 모델을 `gemini-2.0-flash-lite`로 사용 (`ResourceExhausted` 시 3회 재시도 로직 포함).
  - uvicorn 이벤트 루프 블로킹 방지를 위해 `asyncio.to_thread`로 동기 호출 래핑.
  - API 할당량 완벽 고갈 시 에러 메시지 대신 우아한 **Fallback 감성 문장**을 반환하여 UI 퀄리티 방어.
- **캡슐 API (`capsule.py`):** 
  - `POST /api/capsules/generate`: 해당 날짜의 KST 자정~자정 청취 기록 조회 후 AI 호출 및 DB 저장.
  - `GET /api/capsules/me`: 특정 날짜의 생성된 캡슐 조회.
  - **`GET /api/capsules/image-proxy`**: (중요) Spotify CDN 이미지(`i.scdn.co` 등)를 프론트에서 html2canvas로 캡처할 때 발생하는 CORS Taint 문제를 피하기 위한 백엔드 이미지 프록시 라우터.

### [Frontend (Next.js)]
- **대시보드 UI 연동 (`DashboardClient.tsx`):**
  - 타임라인 상단에 "✨ 오늘의 AI 캡슐 만들기" CTA 버튼 배치.
  - 캡슐 생성/조회 상태 관리 및 Framer Motion 기반 **풀스크린 Dimmer 모달** 레이어로 분리. (dimmer 클릭 시 닫힘)
- **카드 렌더링 및 캡처 (`daily-capsule-card.tsx`):**
  - Glassmorphism & Vinyl Record 디자인 (CSS blur, 앨범 아트 회전 애니메이션).
  - `html2canvas` 라이브러리로 9:16 인스타 스토리 캡처 기능 연동.
  - **이미지 로딩 최적화**: 모든 앨범 이미지 `src`를 백엔드 `/api/capsules/image-proxy`로 경유시켰으며, 브라우저 캐시 및 캔버스 오염을 막기 위해 렌더링되는 `<img>` 태그에 **`crossOrigin="anonymous"`**를 강제 명시.

---

## 2. 발생했던 Critical Error & Troubleshooting 레포트 (`error_notes.md`)
개발 과정에서 서버 전체를 셧다운시키거나 핵심 기능을 마비시켰던 이슈와 해결책(현재 코드에 모두 반영 완료)입니다.

### 🚨 Error #20: timezone 불일치 및 히스토리 조회 버그
- **증상**: 프론트엔드는 KST(UTC+9), 서버의 `datetime.utcnow()` 등은 UTC 기준이라 "오늘"의 범주가 9시간 어긋나 Spotify 리스트가 밀려 보임.
- **해결**: 백엔드 조회 쿼리에서 KST 자정을 기준으로 `start_utc`와 `end_utc`를 명확히 변환해 비교하도록 수정.

### 🚨 Error #21: ImportError로 인한 백엔드(FastAPI) 셧다운
- **증상**: `capsule.py`에서 `get_current_user_id`를 `auth.py`에서 import 하려 했으나, 실제로는 `diary.py`에 정의되어 있어서 서버 기동 시 크래시(Exit node: 1)가 나며 모든 API(로그인 포함)가 먹통이 됨.
- **해결**: 순환 참조를 막기 위해 `capsule.py` 안에 Jwt 토큰 파싱 함수인 `get_current_user_id`를 인라인으로 중복 정의하여 종속성 끊어냄. (향후 리팩토링 시 common 모듈로 뺄 것)

### 🚨 Error #22: html2canvas CORS Taint & Gemini ResourceExhausted
- **증상**: 이미지 저장 버튼을 눌러도 canvas가 Opaque(불투명) 처리되어 다운로드가 안 되며, Gemini API 무료 쿼터 소진 시 에러 로그가 카드의 결과값으로 들어감.
- **해결**: 
  1. `<img>`에 `crossOrigin="anonymous"` 부착 + 백엔드 Proxy 라우터 신설을 조합해 브라우저 보안 정책 완벽 통과.
  2. Gemini `gemini-2.0-flash-lite` 변경 + Retry 로직 추가 + 실패 시 기본 문장("오늘의 잔잔한 선율들이 마음에 깊은 울림을 남기네요. 평온한 밤 되세요.") 리턴 체계(Graceful Degradation) 확립.

---

## 3. 현행 과제 (Next Steps)
다음 에이전트가 투입된다면 진행할 만한 작업 목록입니다 (`todo.md` 참조):
- 배포 준비(Production 환경 대응, CORS allowed_origins 목록 검증)
- 중복된 `get_current_user_id` 등의 인증 로직을 `core/security.py` 또는 `dependencies` 계층으로 분리(Refactoring)
- Frontend의 Modal, Alert 등의 에러 메시징 고도화
- (옵셔널) Database를 SQLite에서 PostgreSQL 연결로 완벽히 전환하고 Alembic 마이그레이션 적용.
