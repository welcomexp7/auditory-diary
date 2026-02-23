# 오답 노트 및 자가 학습 (Error Notes)

## 1. PowerShell의 Start-Process 명령어 구문 오류
- **상황**: 백엔드와 프론트엔드 서버를 팝업 터미널(새 창)에서 띄우기 위해 `start cmd /k "..."` 명령어를 사용하였으나, PowerShell에서 `start` 명령어(Start-Process Alias)의 인자 파싱 규칙에 위배되어("A positional parameter cannot be found...") 프로세스가 실행되지 않고 튕기는 현상 발생. 
- **원인**: Windows PowerShell에서는 `cmd`를 Arguments 형태로 올바르게 전달하려면 인용 부호나 `-ArgumentList` 파라미터 컨벤션을 정확히 명시하거나, 백그라운드 명령어 시스템(Antigravity Agent's Runner)에서 네이티브하게 데몬(Daemon)으로 띄웠어야 했습니다.
- **예방 규칙**: 클라이언트/서버를 띄울 가시적인 창이 필요할 때는 신중하게 문법(`Start-Process`)을 사용하거나 단일 러너로 띄웁니다.

## 2. Windows 내 Python 환경변수 누락 오류 (실행 불가)
- **상황**: 백엔드를 구동하려고 시도했으나 `python` 명령어가 Windows Store로 리다이렉트되어(Exit code 1) 스크립트가 강제 종료됨.
- **원인**: 시스템 환경 변수에 Python.exe가 정상적으로 등록되지 않았거나, Python 자체가 설치되지 않은 깡통 상태입니다.
- **예방 규칙**: 로컬 백엔드 서버를 띄우기 전에 의존성 프로그램(Python, Docker, Node.js) 패키지가 실제로 잘 깔려 있는 시스템인지 `--version` 명령어로 먼저 체크(Sanity Check) 후 실행 명령을 내립니다.

## 3. Next.js 환경 변수(`.env`) 수정 후 핫리로딩 미지원으로 인한 크래시
- **상황**: 구글/스포티파이 연동 키를 `.env` 파일에 기재했음에도 불구하고, 소셜 로그인 팝업 시 `400 Invalid Client` 에러 등 인증 오류가 발생함.
- **원인**: Next.js의 `npm run dev` 서버는 실행 시점에만 `.env` 환경 변수를 로드하며 파일이 변경되어도 자동으로 갱신(Hot-reload)되지 않습니다. 따라서 과거 40분 전 켜둔 구버전 서버가 여전히 예전 가짜 더미 코드를 들고 구글 서버에 요청을 보냈기 때문입니다. 더불어 포트 충돌로 3001번에 새 서버가 켜지는 등의 사이드 이펙트가 발생했습니다.
- **예방 규칙**: `.env` 등 환경 변수 파일을 수정한 직후에는 반드시 실행 중인 로컬 서버 프로세스(`node.exe`, `python.exe` 등)를 완전히 강제 종료(Kill)하고 다시 구동하여 최신 키값을 메모리에 적재해야 합니다.

## 4. 비개발자 PM을 고려하지 않은 불친절한 문서화 리스크
- **상황**: 배포 준비 완료 후 가이드라인을 제공했으나, 단순히 "환경변수를 플랫폼 세팅에 추가하라"는 식의 기술적/추상적인 안내만 하여 개발 지식이 없는 PM이 배포를 수행할 수 없는 문제 발생.
- **원인**: 사용자의 역할(PM)을 사전에 숙지했음에도 불구하고, Vercel이나 Render 같은 클라우드 서비스에서 구체적으로 어떤 버튼을 클릭하고 어디에 값을 붙여넣어야 하는지 GUI 기반의 Step-by-Step 절차를 간과했습니다.
- **예방 규칙**: 비개발자(PM 등)에게 인수인계나 배포 가이드를 작성할 때는 화면에서 어떤 버튼을 클릭해야 하는지 눈에 훤히 보이듯 과정 하나하나를 상세하고 친절하게 작성해야 합니다.

## 5. SQLAlchemy ForeignKey 누락으로 인한 Mapper 초기화 실패 (CORS 에러로 위장됨)
- **상황**: 구글 로그인 시 프론트엔드에서 "로그인 처리 중 오류가 발생했습니다" alert가 뜨고 브라우저 콘솔에는 CORS 에러가 표시됨. 실제로는 백엔드 500 Internal Server Error.
- **원인(Root Cause)**: `AuditoryDiaryORM.user_id` 컬럼에 `ForeignKey("users.id")`가 빠져 있어, `UserORM.diaries = relationship("AuditoryDiaryORM", backref="user")`의 조인 방향을 SQLAlchemy가 추론하지 못하고 Mapper 초기화 시점에 크래시 발생. FastAPI에서 unhandled 500 에러가 발생하면 CORSMiddleware 체인을 건너뛰므로, 브라우저에는 "CORS 에러"로 위장되어 원인 파악이 매우 어려웠음.
- **해결**: (1) `models.py`에 `ForeignKey("users.id")` 추가, (2) `auth.py`에 catch-all `Exception` 핸들러 추가하여 500 에러도 HTTPException으로 변환(CORS 헤더 유지), (3) 기존 SQLite DB 삭제 후 재생성.
- **예방 규칙**: 
  - ORM 모델에서 `relationship()`을 정의할 때는 **반드시** 대상 테이블의 컬럼에 `ForeignKey`가 명시되어 있는지 확인할 것.
  - FastAPI 라우터의 모든 엔드포인트에는 `except Exception`으로 감쌀 것(`HTTPException`으로 변환해야 CORS 헤더가 유지됨).
  - 브라우저에서 CORS 에러가 뜨면 **진짜 CORS 문제인지 vs 백엔드 500 에러가 위장된 건지** 반드시 의심할 것.

## 6. Spotify OAuth 콜백 HTTP 메서드 불일치 (POST vs GET → 405 Method Not Allowed)
- **상황**: 대시보드에서 스포티파이 Connect 버튼을 누르면 동의 화면은 정상적으로 뜨지만, Agree 후 `{"detail":"Method Not Allowed"}` 에러 화면이 나타남.
- **원인(Root Cause)**: Spotify OAuth는 사용자 동의 후 브라우저를 **GET** `redirect_uri?code=xxx`로 리다이렉트하는데, 백엔드 콜백 엔드포인트가 `@router.post`로 선언되어 있어 405 에러 발생. OAuth 표준에서 Authorization Code 콜백은 항상 **GET** 요청임을 간과한 설계 오류.
- **해결**: `@router.post("/spotify/callback")` → `@router.get("/spotify/callback")`으로 변경. `code`를 쿼리 파라미터로 직접 수신하고, 토큰 교환 후 프론트엔드 대시보드로 RedirectResponse 반환.
- **예방 규칙**: OAuth 콜백 라우트는 반드시 **GET** 메서드로 선언할 것. OAuth Authorization Code Flow에선 인증 서버(Spotify 등)가 사용자의 브라우저를 GET으로 리다이렉트함.

## 7. 대시보드가 Spotify 실제 데이터를 표시하지 않고 Mock 데이터만 보여주는 문제
- **상황**: Spotify Connect 성공 후에도 대시보드에 "밤편지", "Hype Boy" 같은 하드코딩된 Mock 데이터만 표시됨.
- **원인**: 대시보드 컴포넌트가 `localStorage.getItem("guest_diaries")` 또는 `MOCK_DIARIES` 상수에서만 데이터를 읽었고, 백엔드 API를 호출하여 실제 Spotify 최근 재생 목록을 가져오는 로직이 전혀 없었음.
- **해결**: (1) 백엔드에 `GET /api/diaries/me/recently-played` 엔드포인트 추가, (2) 프론트엔드 대시보드에서 `access_token` 유무로 로그인 상태를 판단하고 로그인 시 백엔드 API에서 실제 데이터 fetch.
- **예방 규칙**: Mock 데이터로 개발할 때는 반드시 `// TODO: 실제 API 연동 필요` 주석을 남기고, 연동 작업 시 해당 TODO를 반드시 해결할 것.

## 8. 뒤로가기 버튼 클릭 시 로그인 상태가 풀리는 문제
- **상황**: 대시보드 좌측 상단 뒤로가기 버튼 클릭 시 랜딩 페이지(로그인 화면)로 돌아가면서 로그인이 풀리는 것처럼 보임.
- **원인**: `<Link href="/">`로 랜딩 페이지로 직행했는데, 랜딩 페이지에서 `localStorage`의 `access_token` 존재 여부를 체크하지 않아 무조건 로그인 화면을 보여줌.
- **해결**: (1) 뒤로가기 버튼을 `<button onClick>` 방식으로 변경, 로그인 상태에서는 `window.confirm("로그아웃하시겠습니까?")`를 띄우고, (2) 랜딩 페이지(`page.tsx`)에서 `useEffect`로 `access_token` 체크 후 대시보드로 `router.replace` 자동 리다이렉트.
- **예방 규칙**: SPA에서 인증 상태가 있는 페이지 간 이동 시, 항상 **인증 가드(Auth Guard)** 로직을 적용하여 로그인 상태에 맞는 페이지를 보여줄 것.

## 9. Vercel 빌드 실패 3연속 — 추측 수정 금지 (반성문)
- **상황**: Vercel에서 Next.js 16 빌드 시 `/dashboard` 프리렌더링 에러가 반복 발생. 3번 연속 push → 실패 → 다른 추측으로 수정 → push → 실패를 반복하여 PM의 시간을 낭비함.
- **원인 (Root Cause)**: 
  1. **1차 실패**: `turbo.createProject is not supported by wasm bindings` 에러를 보고 `--no-turbopack` 플래그를 추가했으나, 이 플래그는 **Next.js 16에서 유효하지 않은 옵션**이었음.
  2. **2차 실패**: `useSearchParams()` Suspense 에러를 `export const dynamic = "force-dynamic"`으로 고치려 했으나, **클라이언트 컴포넌트(`"use client"`)에는 적용되지 않음**.
  3. **3차 실패**: 서버/클라이언트 컴포넌트를 분리하고 `Suspense` + `force-dynamic`을 올바르게 적용했지만, **1차에서 넣은 유효하지 않은 `--no-turbopack` 플래그가 여전히 package.json에 남아 있어서** 빌드 자체가 크래시됨.
- **근본 문제**: **로컬에서 빌드를 재현하지 않고 추측으로 수정했음**. 로컬에서 `next build`를 한 번이라도 실행했으면 1차 시도에서 끝났을 문제.
- **해결**: `--no-turbopack` 제거 + 서버 컴포넌트에 `force-dynamic` + `Suspense` 래퍼 조합.
- **🚨 절대 규칙**:
  1. **배포 전 반드시 `npm run build`를 로컬에서 실행하여 빌드 통과를 확인한 후 push할 것.**
  2. **추측으로 코드를 고치지 말 것. 에러를 로컬에서 재현(Reproduce)하고, 정확한 에러 메시지를 확인한 후 수정할 것.**
  3. **CLI 플래그를 추가할 때는 반드시 `--help`로 해당 버전에서 유효한 옵션인지 확인할 것.**
  4. **Next.js에서 `export const dynamic`은 서버 컴포넌트에서만 동작한다. 클라이언트 컴포넌트(`"use client"`)에는 절대 넣지 말 것.**

## 10. 브라우저 자동화의 한계 — 시간 낭비 방지
- **상황**: Render 환경변수 설정을 브라우저 서브에이전트로 자동화하려다 40분 이상 소요됨.
- **원인**: 복잡한 웹 UI(모달, 동적 폼 등)를 자동화하면 클릭 실패, DOM 변경 등으로 반복 시도가 발생하여 PM이 직접 하는 것보다 훨씬 느림.
- **🚨 절대 규칙**: 
  1. **Web UI 조작(환경변수 입력, 외부 서비스 설정 등)은 PM에게 직접 안내하는 것이 더 빠르다. 자동화 시도하지 말 것.**
  2. **복붙 작업이 필요하면 값만 정리해서 표로 전달할 것.**

## 11. IPv6 localhost vs 127.0.0.1 (API Fetch 연결 실패 & Login Error)
- **상황**: 프론트엔드 환경변수 지정 시 `API_URL`을 `http://localhost:8000/api`로 두었을 때 로그인 과정 중 "로그인 처리중 오류가 발생했습니다" 발생.
- **원인(Root Cause)**: Uvicorn 백엔드는 기본적으로 IPv4인 `127.0.0.1:8000`에 바인딩 되는데, 프론트엔드에서 `localhost` 도메인 사용 시 환경에 따라 IPv6 `::1` 우선 해석(prefer-IPv6)을 시도하여 Connection Refused 에러로 통신 자체가 실패함.
- **예방 규칙**: 로컬 환경 통신(클라이언트 단위의 `fetch`)에서 알 수 없는 Network Exception이나 인증 과정 오류가 난다면, **가장 먼저 `localhost` 대신 명시적인 `127.0.0.1`로 URL을 변경**하여 IPv6 해석 문제를 원천 차단할 것.

## 12. 마이크로서비스/독립 웹 분리 의도 파악 실패
- **상황**: Phase 3 랜딩 페이지 개발 요청을 받고, 기존 서비스 본체인 `frontend` 디렉토리의 메인 페이지(`page.tsx`)를 덮어씌워 화려한 홍보용 랜딩 페이지를 구축함.
- **원인**: "서비스를 소개할 랜딩 페이지"라는 기획안을 단순히 앱의 루트 라우트(`/`) 디자인 개편으로 단편적으로 해석함. 운영 환경과 트래픽 관점, 도메인 목적(서비스용 vs 홍보용)이 다름에도 완전히 독립된 별개의 프로젝트(웹)로 분리해야 한다는 엔지니어링적 판단을 내리지 못함.
## 13. Flexbox UI에서 whitespace-nowrap 남용 오류
- **상황**: 대시보드 타이틀("기억의 조각들")이 줄바꿈되는 것을 막기 위해 `whitespace-nowrap` 속성을 주었더니 좌우 마진이 깨지고 텍스트가 삐져나가는 현상 발생.
- **원인**: Flex 구조 내부에서 `min-width: 0`이나 텍스트 크기 조정 없이 `whitespace-nowrap`만 강제할 경우, 부모 컨테이너의 너비 상한선을 무시하고 텍스트 길이만큼 요소가 무한정 늘어나게 되어 전체 그리드/마진 시스템이 붕괴됨.
- **예방 규칙**: 반응형 텍스트 줄바꿈/찌그러짐 문제를 해결할 때는 텍스트 크기 자체를 줄이거나 컨테이너의 max-width 설정을 먼저 고려하고, `whitespace-nowrap`은 매우 제한된 버튼이나 뱃지(`shrink-0` 조합)에서만 최소한으로 사용할 것.

## 14. 클라이언트 상태 변경과 데이터 영속화(DB) 연동 누락 버그
- **상황**: 대시보드 타임라인에서 '기록(메모)' 버튼을 눌러 메모를 적었으나, 새로고침 시 기입한 메모가 전부 증발하는 현상 발견.
- **원인(Root Cause)**: `handleMemoAdd` 함수 내부에 단순 React `setDiaries` 상태 업데이트만 존재하고 백엔드 DB에 저장하는 API 호출 로직이 아예 없었음. 또한 실시간 `recently-played`로 읽어온 곡들은 아직 Background Scrobbling(5분 주기)를 거치지 않아 DB의 진짜 식별자(UUID)가 없는 상태였는데, 이를 백엔드로 보내려는 아키텍처 결함도 존재.
- **해결**: (Hotfix) UUID 자리수(길이 10 미만)를 체크하여 아직 DB에 동기화되지 않은 실시간 재생 곡은 알림창을 띄워 저장을 막음. (Full-fix) 백엔드에 `PATCH /api/diaries/{diary_id}/memo` 라우터와 DB 업데이트 메서드(`update_memo`)를 구현하고, 프론트에서 인증 토큰과 함께 메모 데이터를 쏴서 영속화시킴.
- **예방 규칙**: 프론트엔드의 `React State` 변경은 반드시 **백엔드 리포지토리(DB) 업데이트 흐름(Fetch/Axios)** 이 일치하는지 체크할 것. 외부 API(Spotify) 데이터와 내부 DB 데이터를 혼용할 때는, 외부 데이터가 내부 DB에 적재되기 전(Sync 전) Primary Key 누락의 예외 상황을 설계 단계부터 철저히 대비할 것.
