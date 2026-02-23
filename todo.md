# Auditory Diary Service: To-Do List (Blueprint)

## 프론트엔드 (Next.js, TypeScript, Tailwind CSS, Framer Motion)
- [x] Next.js (App Router) 초기 세팅 및 PWA 설정 (Service 시뮬레이션용)
- [x] Google OAuth 소셜 로그인 및 Spotify 권한 연동 페이지
- [x] 메인 대시보드 (타임라인 뷰): 날짜/장소에 따른 오디오 모먼트 리스트
- [x] 감성적인 '회상(Time Capsule)' 뷰 애니메이션 (Framer Motion 트리거)
- [x] UI/UX 개선: 게스트 모드 뒤로가기, 반응형 및 텍스트/이미지 깨짐 수정
- [x] (옵션) 모바일 웹 Geolocation API 연동 및 Background Sync 테스트

## 프론트엔드 UI 리디자인 (Phase 2)
- [x] Aceternity UI 셋업 (`clsx`, `tailwind-merge` 설치 및 `cn` 유틸리티 추가)
- [x] 랜딩 페이지(`page.tsx`) 모던 스큐어모피즘 리디자인 (LP/카세트 테이프 메타포 적용)
- [x] 메인 대시보드(`DashboardClient.tsx`) 물리적 다이어리 질감 + 글래스모피즘(Glassmorphism) 기반 타임라인 개편
- [x] 오디오 재생/음악 테마에 맞는 인터랙티브 컴포넌트 추가 (Framer Motion 심화)

## 랜딩 페이지 및 Aceternity UI 도입 (Phase 3: Musitory LP)
- [x] Hero Section 구현: Aurora Background를 활용하여 사운드웨이브 느낌의 첫 화면 구성
- [x] Feature Section 구현: Bento Grid를 활용하여 Musitory 핵심 기능(음악 연동, 감정 기록 등) 시각화
- [x] Scroll Interaction 구현: Sticky Scroll Reveal로 서비스 이용 플로우(로그인 -> 플레이 -> 기록) 안내
- [x] Sample Showcase 구현: Infinite Moving Cards를 활용한 다른 유저들의 공개 다이어리 엿보기
- [x] CTA (Call to Action) 구현: Background Beams를 활용하여 하단에서 서비스 시작 유도
- [x] 모바일/태블릿 반응형 브레이크포인트 최적화 및 접근성 점검

## 백엔드 API (FastAPI, Python)
- [x] FastAPI 프로젝트 초기화 및 Pydantic 기반 도메인 모델(Entity, Value Object) 정의
- [x] User 인증 (Google OAuth) 및 Spotify 연동 시스템 구축
- [x] Spotify 'Currently Playing' 또는 'Recently Played' API 연동 모듈 (Infrastructure Layer)
- [x] 날씨/위치 API (e.g., OpenWeather, Google Maps) 연동 모듈
- [x] AuditoryDiary 생성 및 조회 Endpoint 구현 (Presentation Layer)
- [x] 주기에 따른 자동 스크로블링(Auto-Scrobbling) 백그라운드 워커/크론 작업 세팅

## 데이터 설계 & DB (PostgreSQL / ORM 예상)
- [x] DB 스키마 설계 (`users`, `tracks`, `contexts`, `auditory_diaries` 테이블)
- [x] SQLAlchemy / SQLModel 등을 활용한 인프라스트럭처 레포지토리 세팅
- [x] 환경 변수 설정 스크립트 작성 및 로컬 DB 구동 환경 구성

## Phase 4: 과거 기록 조회 (Calendar & Timeline History)
- [x] [DB/데이터] `AuditoryDiary` 모델에 날짜 기반 인덱싱 및 집계(Group By) 쿼리 리서치.
- [x] [백엔드] `/api/diaries/calendar/monthly` 엔드포인트 구현 (특정 연/월의 날짜별 기록 갯수 및 대표 썸네일 반환).
- [x] [백엔드] `/api/diaries/history` 엔드포인트 구현 (특정 날짜의 일기 타임라인 반환, 사용자 권한 및 Timezone 격리 적용).
- [x] [프론트엔드] 대시보드 타이틀 하단에 가로 스크롤 가능한 '미니 달력(Horizontal Calendar)' 네비게이터 UI 구현 (Glassmorphism 테마 적용).
- [x] [프론트엔드] 달력 날짜 칩 클릭 시 상태(selectedDate) 업데이트 로직 및 하단 타임라인 API 재호출 연동.
- [x] [프론트엔드] 해당 날짜에 기록이 없는 경우에 표시될 "이 날은 무얼 했을까요.." UI(Empty State) 추가.

## Phase 5: Interactive Features (AI Daily Capsule)
### [데이터 설계]
- [x] DB 스키마 업데이트: `daily_capsules` 신규 테이블 추가 (Alembic 마이그레이션 적용)
### [백엔드 API]
- [x] `/api/diaries/daily-capsule` (POST): 특정 날짜의 날씨, 플레이리스트 맥락을 OpenAI/Gemini API로 보내 AI 하루 요약 일기(문장)를 생성/저장하는 API 구현
- [x] `/api/diaries/daily-capsule` (GET): 특정 날짜의 생성된 캡슐 내역 조회 API 구현
### [프론트엔드 UI]
- [x] "✨ Daily Capsule 생성하기" 버튼 추가 및 AI 로딩 스켈레톤 애니메이션 (Framer Motion)
- [x] 생성된 Daily Capsule(앨범 아트 꼴라주 + AI 한 줄 평) 렌더링 카드 UI 구현
- [x] HTML2Canvas를 활용해 캡슐 카드를 인스타그램 스토리 비율(9:16) 이미지로 다운로드/공유하는 기능 구현

## Phase 5.5: Daily Capsule Redesign (UI/UX & AI Fallback)
### [데이터 설계]
- [x] 프론트엔드 DailyCapsule 상태 관리에 `Theme` 타입 도입 (Modern, Futuristic, Film, Retro)
### [백엔드 API]
- [x] `ai_client.py`: API 호출 실패(ResourceExhausted 등) 시 더미 텍스트 반환을 `tracks_context` 기반 '최빈 아티스트 중심 다이나믹 폴백' 문구로 고도화
### [프론트엔드 UI]
- [x] `daily-capsule-card.tsx`: 이미지 저장 직전(`isDownloading == true`), 무한 회전하는 LP 요소를 강제로 0도(`rotate-0`)로 정지시키는 동적 스타일링 적용
- [x] `daily-capsule-card.tsx`: 4가지 캡슐 테마(배경, 폰트, 필터)를 스위칭할 수 있는 씬 상단 또는 하단 컨트롤러 UI 추가
- [x] `daily-capsule-card.tsx`: AI 요약 멘트 부분의 탁한 디자인(배경/이모지)을 걷어내고 세련된 타이포그래피(인용구 표시, 세로/가로 배치 디자인)로 개편
