# Auditory Diary - Project Handover Document

> **이 문서는 Phase 3(랜딩 페이지 심화 및 Aceternity 기능 고도화)를 이어갈 다음 AI 에이전트를 위한 통합 기술/기능 명세서입니다.**

## 1. 프로젝트 개요 (Business Summary)
- **비즈니스 목적**: 사용자가 방문한 장소와 날씨, 그리고 당시 듣고 있던 **Spotify 음악**을 감성적인 타임라인 형태의 "청각적 일기(Auditory Diary)"로 자동 기록(Auto-Scrobbling)해 주는 서비스.
- **핵심 타겟 UI/UX**: 아날로그 감성(LP, 카세트 테이프, 종이 다이어리 질감)을 디지털로 재해석한 **모던 스큐어모피즘(Modern Skeuomorphism)**과 **글래스모피즘(Glassmorphism)**의 결합.

---

## 2. 아키텍처 및 기술 스택 (Architecture & Tech Stack)
본 프로젝트는 **DDD (Domain-Driven Design)** 아키텍처와 **4-Tier 아키텍처**를 엄격하게 준수합니다.

### Frontend
- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript
- **Styling**: Tailwind CSS v4 + Framer Motion
- **UI Libraries**: `@heroicons/react`, `@tabler/icons-react`, `lucide-react`, Aceternity UI (`clsx`, `tailwind-merge`)
- **State/Auth Management**: React Hooks (e.g., `useAuth.ts`), `localStorage` (JWT 베어러 토큰), `@react-oauth/google`
- **Deploy**: Vercel (`https://auditory-diary.vercel.app`) - SSR 및 SPA 혼합 구조. 

### Backend
- **Framework**: FastAPI (Python) + Uvicorn + Pydantic (타입 검증)
- **Database / ORM**: PostgreSQL (Render) / SQLite (로컬 개발용), SQLAlchemy (비동기 `asyncpg`), SQLModel
- **Auth**: Google OAuth (회원가입/로그인), Spotify OAuth (음악 데이터 연동 및 자동 스크로블링 워커)
- **Deploy**: Render (`https://auditory-diary-api.onrender.com`) - `render.yaml` Blueprint 기반.

---

## 3. 핵심 디렉토리 및 도메인 구조 (Domain Structure)

### 백엔드 (FastAPI) => `backend/app/`
- **`domain/`**: `AuditoryDiary`, `User`, `Track` 등 핵심 비즈니스 모델(Entities)과 `DiaryContext` 등 값 객체(Value Objects) 정의. 외부 의존성 없음.
- **`application/`**: 도메인 객체를 오케스트레이션하여 비즈니스 유스케이스 흐름 제어 (e.g., `DiaryService`).
- **`presentation/`**: 외부 요청/응답 형식과 라우팅 처리 (e.g., 라우터 `routers/auth.py`, `routers/diary.py` / Pydantic 스키마 `schemas/`).
- **`infrastructure/`**: 데이터 연동 및 외부 요인 (DB Repository, HTTP 클라이언트 `spotify_client.py`).
  - **Worker**: `scrobble_worker.py` (5분 간격 스포티파이 최근 재생 곡 자동 수집 태스크 운영 중).

### 프론트엔드 (Next.js) => `frontend/src/`
- **`app/page.tsx`**: 랜딩 페이지. (아날로그 LP 턴테이블 스큐어모피즘 애니메이션 및 구글 로그인 CTA).
- **`app/dashboard/`**: 메인 대시보드 컴포넌트(`DashboardClient.tsx`). 글래스모피즘 다이어리 타임라인 뷰 제공.
- **`app/auth/spotify/callback/`**: Spotify 동의 리다이렉션을 받아 백엔드 API와 토큰을 교환하는 중간 페이지.
- **`components/ui/`**: Aceternity UI 및 Framer Motion 커스텀 공통 컴포넌트 군 (`aurora-background`, `infinite-moving-cards` 등).
- **`hooks/useAuth.ts`**: 구글 로그인 모듈.
- **`lib/api.ts`**: 자동 헤더 주입 등 Axios/Fetch 글로벌 설정 모듈 (로컬일 경우 `127.0.0.1:8000` 폴백).

---

## 4. 로컬 구동 및 사전 요구사항 (Prerequisites)

이 프로젝트를 이어받아 기능(Phase 3)을 개발할 때 필요한 구동 명령어입니다.

### 환경 변수 명세
> **참고**: `frontend/.env` 파일과 `backend/.env` 파일이 물리적으로 나뉘어 있습니다.

**Frontend (`frontend/.env`)**
| 변수명 | 설명 및 기본값 |
|---|---|
| `NEXT_PUBLIC_API_URL` | `http://127.0.0.1:8000/api` (백엔드 로컬 엔드포인트) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | 제공된 Google Cloud OAuth 클라이언트 ID |

**Backend (`backend/.env`)**
| 변수명 | 설명 및 기본값 |
|---|---|
| `DATABASE_URL` | `sqlite+aiosqlite:///./auditory_diary.db` |
| `FRONTEND_URL` | `http://127.0.0.1:3000` (CORS 용) |
| `GOOGLE_CLIENT...`, `SPOTIFY_CLIENT...`| OAuth Provider Secret Keys |

### 로컬 서버 시작
1. **백엔드 (Windows 환경)**:
    ```bash
    cd backend
    .\venv\Scripts\uvicorn.exe app.main:app --reload --port 8000
    ```
2. **프론트엔드**:
    ```bash
    cd frontend
    npm run dev
    ```

---

## 5. 현재 개발 완료 상태 요약 및 다음 할 일(Next Steps)

### ✅ Phase 1 & 2 완료 (현재 상태)
- Next.js 16 (App Router) 렌더 트리거 충돌 해결 및 Vercel 배포 완료 (`npm run build` 테스트 통과).
- FastAPI Render DB `asyncpg` 등 프로덕션 환경 Blueprint 설정 완료.
- Spotify Access Token 만료 대응 및 OAuth 라우터 엔드포인트 연결 (버그 없음).
- **UI/UX 리디자인(Phase 2)**: `page.tsx`(LP 메타포) 및 `DashboardClient.tsx`(글래스모피즘 타임라인) 적용 완료. 
- IPv6의 `localhost` Fetch 블로킹 문제를 해결하기 위해 **명시적인 `127.0.0.1` 하드코딩 완료**.

### 🚀 Phase 3 진행 (다음 AI 에이전트 작업 영역)
`todo.md`의 Phase 3(랜딩 페이지 심화) 작업을 이어가면 됩니다. 
현재 사용자가 `page.tsx` 하단에 사용자 증언(Infinite Moving Cards) 및 CTA(Background Beams) 섹션을 직접 코딩해 놓은 상태입니다.
- **목표 1:** 추가적인 Aceternity UI 부품 완성 (`Bento Grid` 활용, Scroll Interaction, Music Player 컴포넌트 추가 등).
- **목표 2:** 음악 재생 및 상호작용 관련 Framer Motion 심화 래스터/벡터 이펙트 작업 수행.

> **💡 다음 에이전트를 위한 당부사항 (Error Notes 규칙)**
> 1. Next.js App Router에서 컴포넌트 최상단에 `"use client"`가 있다면, **`export const dynamic = "force-dynamic"`을 절대 붙이지 마라.** (Server Component 영역임)
> 2. 터미널 명령어를 통해 브라우저를 띄우거나 자동화를 시도하지 마라.
> 3. HTTP Client Fetch 시 `localhost` 대신 무조건 `127.0.0.1`을 사용하여 IPv6 문제를 회피하라.
