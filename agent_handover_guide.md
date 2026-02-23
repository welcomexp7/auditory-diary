# Auditory Diary (Musitory) - AI Agent Handoff Guide

> **이 문서는 본 프로젝트에 새로 투입되는 AI 에이전트(혹은 개발자)를 위한 "통합 인수인계 및 기술 명세서"입니다.** 이 문서와 루트의 `error_notes.md`, `project_context.md`, `todo.md`를 함께 읽으면 현재 프로젝트의 컨텍스트를 완벽히 이해할 수 있습니다.

---

## 1. 프로젝트 비즈니스 요약 (Business Summary)
- **목적:** 사용자가 Spotify에서 들은 음악을 기반으로, 그 순간의 날씨 정보를 결합해 자동으로 **청각적 일기(Auditory Diary)**를 기록해 주는 서비스.
- **가치 제안:** 사용자의 수동 개입 최소화 (Auto-Scrobbling), 음악과 감정을 엮어주는 AI 요약(Daily Capsule).
- **디자인 컨셉:** 아날로그 감성(LP, 카세트 테이프)을 디지털로 재해석한 **모던 스큐어모피즘(Modern Skeuomorphism)**과 **글래스모피즘(Glassmorphism)**의 결합.

---

## 2. 아키텍처 및 기술 스택 (Architecture & Tech Stack)
본 프로젝트는 **DDD (Domain-Driven Design)** 아키텍처 기반의 **4-Tier 아키텍처**를 엄격하게 준수합니다.

### 💻 Frontend (프론트엔드)
- **Framework:** Next.js (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS v4, `clsx`, `tailwind-merge`
- **UI Components & Animation:** Framer Motion, Aceternity UI, Magic UI (Aurora Background, Bento Grid, Sticky Scroll 등)
- **State/Auth:** React Hooks, `localStorage` (JWT 토큰 보관), `@react-oauth/google`
- **주요 기능 라이브러리:** `html2canvas` (캡슐 이미지 다운로드용)

### ⚙️ Backend (백엔드)
- **Framework:** FastAPI (Python), Uvicorn, Pydantic (엄격한 타입 힌팅)
- **Database / ORM:** SQLite (로컬, `aiosqlite`), SQLAlchemy (비동기), Alembic (마이그레이션)
- **Auth:** 자체 JWT, Google OAuth, Spotify OAuth
- **External APIs:** Spotify Web API, Gemini API (`gemini-2.0-flash-lite`, AI 일기 요약)
- **Background Worker:** 스포티파이 자동 스크로블링을 위한 Async Worker 로직 내장 (`scrobble_worker.py`)

---

## 3. 핵심 디렉토리 및 도메인 구조 (Directory Structure)

### 백엔드 (FastAPI) ➡️ `backend/app/`
- **`domain/`**: `AuditoryDiary`, `DailyCapsule`, `User`, `Track` 등 핵심 엔티티(Entities) 정의. (순수 비즈니스 모델 규격, 외부 의존성 없음)
- **`application/`**: 도메인 객체를 지휘하여 유스케이스 흐름을 제어하는 서비스 계층 (e.g., `DiaryService`, `ai_client.py`).
- **`presentation/`**: 외부 요청/응답 형식과 라우팅 처리 (e.g., API 라우터 `routers/` / Pydantic 스키마 `schemas/`).
- **`infrastructure/`**: 데이터 연동 및 외부 요인 제어 (DB Repository 설정, `spotify_client.py`, `scrobble_worker.py`).

### 프론트엔드 (Next.js) ➡️ `frontend/src/`
- **`app/page.tsx`**: 랜딩 페이지 (Aurora Background, Bento Grid, Sticky Scroll 등 화려한 인터랙션).
- **`app/dashboard/`**: 메인 서비스 화면(`DashboardClient.tsx`). 가로 스크롤형 미니 캘린더, 글래스모피즘 기반 과거 타임라인 뷰 제공.
- **`app/auth/spotify/callback/`**: Spotify 동의 후 백엔드로 인가 코드를 전달하는 콜백.
- **`components/ui/`**: Framer Motion 기반 커스텀 컴포넌트(`daily-capsule-card.tsx` 등).
- **`lib/api.ts`**: 글로벌 Axios/Fetch 로직 (IPv6 폴백을 위해 `localhost` 대신 `127.0.0.1` 하드코딩 필수).

---

## 4. 현재 개발 진행 상황 요약 (Progress 100% of Initial Plan)
**현재 Phase 1부터 Phase 5까지 기획했던 모든 뼈대 기능이 100% 완료되었습니다.**

- **Phase 1 (인프라/연동):** FastAPI 4-Tier 스캐폴딩, Google/Spotify OAuth 파이프라인 완성, 스키마 정의 매핑.
- **Phase 2 (UI 셋업):** Aceternity UI 셋업, 대시보드 기본 타임라인(Glassmorphism) 구현.
- **Phase 3 (랜딩 페이지):** Aurora Background, Sticky Scroll, LP 턴테이블 스큐어모피즘 애니메이션이 결합된 고퀄리티 랜딩 페이지 완성.
- **Phase 4 (캘린더/히스토리 뷰):** 미니 달력을 통한 날짜별 타임라인 조회 기능, Empty State UI. (KST Timezone 기반 격리 쿼리 적용).
- **Phase 5 (AI 하루 요약 캡슐):** 
  - 타임라인 상단의 Dimmer 오버레이 모달로 구동되는 `AI Daily Capsule`.
  - Gemini API를 이용한 그날의 트랙 감성 요약(`gemini-2.0-flash-lite`, Fallback 로직 포함).
  - Spotify 외부 이미지를 우회하기 위한 백엔드 Image Proxy 연동 및 Web API(`html2canvas`)를 활용한 9:16 인스타 스토리 비율 강제 캡처/다운로드.

---

## 5. 💡 다음 에이전트를 위한 핵심 그라운드 룰 (Must Follow)
이 프로젝트의 에이전트는 코드 수정 전 아래의 규칙을 반드시 준수해야 합니다.

1. **The Three-Step Rule:**
   - (1) Define Mode: 변경할 도메인 용어 파악.
   - (2) Plan Mode: 4계층 DDD 규칙에 맞는 파일/구조 계획을 사용자(PM)에게 컨펌받기.
   - (3) Act Mode: 승인 후 논리적 단위로 점진적 코드 수정.
2. **KST Timezone 원칙:**
   - DB 저장은 UTC 기반이더라도, 애플리케이션 내의 "하루(Daily)" 집계 기준은 무조건 **KST(Asia/Seoul, UTC+9) 자정부터 자정까지**로 클리핑하여 쿼리해야 합니다. (`start_utc`, `end_utc` 계산 주의)
3. **LLM Error Fallback Rule:**
   - Gemini 등 AI 외부 호출 로직을 짤 때는 반드시 `ResourceExhausted(HTTP 429)` 발생을 디폴트로 가정하십시오. 할당량 소진 시 에러 로그를 리턴하면 프론트엔드 UI가 박살 나므로, **반드시 우아한 대체 텍스트(Mock Fallback)**를 반환하도록 설계해야 합니다.
4. **CORS & Image Proxy Rule:**
   - 프론트엔드에서 캔버스(`html2canvas` 등)를 이용해 캡처 기능을 사용할 때, 외부 CDN(Spotify 등)의 이미지는 브라우저 Taint(오염)를 냅니다. 반드시 백엔드의 `/api/capsules/image-proxy` 라우터를 거쳐 렌더링하고, `<img />` 태그에 **`crossOrigin="anonymous"`** 속성을 누락하지 마십시오.
5. **Auto Error-Note Recording:**
   - 에러가 발생하여 수정(Troubleshooting)할 경우, 코드 수정과 동시에 루트 디렉토리의 **`error_notes.md`**를 까서 발병 원인과 재발 방지책을 스스로 남겨야 합니다.

---

## 6. 로컬 구동 스크립트 명세
새로운 기능을 로컬에서 개발하고 테스트할 때 터미널에서 아래 명령어로 두 서버를 동시에 띄워야 합니다.

**백엔드 (포트 8000)**
```bash
cd backend
.\venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

**프론트엔드 (포트 3000)**
```bash
cd frontend
npm run dev
```
