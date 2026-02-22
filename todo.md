# Auditory Diary Service: To-Do List (Blueprint)

## 프론트엔드 (Next.js, TypeScript, Tailwind CSS, Framer Motion)
- [x] Next.js (App Router) 초기 세팅 및 PWA 설정 (Service 시뮬레이션용)
- [x] Google OAuth 소셜 로그인 및 Spotify 권한 연동 페이지
- [x] 메인 대시보드 (타임라인 뷰): 날짜/장소에 따른 오디오 모먼트 리스트
- [x] 감성적인 '회상(Time Capsule)' 뷰 애니메이션 (Framer Motion 트리거)
- [x] UI/UX 개선: 게스트 모드 뒤로가기, 반응형 및 텍스트/이미지 깨짐 수정
- [x] (옵션) 모바일 웹 Geolocation API 연동 및 Background Sync 테스트

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
