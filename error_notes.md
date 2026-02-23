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

## 15. Vercel 배포 시 React 19 Peer Dependency 충돌 (ERESOLVE)
- **상황**: Vercel 배포 진행 중 `npm ERR! ERESOLVE could not resolve` 에러가 발생하며 `npm install` 단계에서 빌드가 실패함.
- **원인(Root Cause)**: 프로젝트는 Next.js 최신 버전에 맞춰 `react@19.2.3`을 사용 중이나, `lucide-react@0.378.0` 및 기타 UI 라이브러리들이 `peerDependencies`로 `<19.0.0` 버전만을 명시하고 있어 npm v10+의 엄격한 의존성 검사에 걸려 설치가 중단됨.
- **해결**: 프론트엔드 루트 폴더(`frontend/.npmrc`)에 `legacy-peer-deps=true` 옵션을 담은 구성 파일을 생성하여, Vercel 환경에서 패키지를 설치할 때 의존성 버전 검사를 우회하도록 강제함.
- **예방 규칙**: React 19 환경에서 최신이 아닌 UI 라이브러리들을 다수 섞어 쓸 경우, 배포 서버(Vercel)에서도 `--legacy-peer-deps` 옵션이 적용될 수 있도록 반드시 **`.npmrc` 파일을 활용**하여 충돌을 미연에 방지할 것.

## 16. Spotify OAuth State 누락으로 인한 세션/식별자 맵핑 증발 (보안 및 연동 끊김)
- **상황**: 대시보드에서 스포티파이 연동을 마쳤는데도 연동이 유지되지 않거나, 내가 아닌 다른 유저의 스포티파이 데이터가 뒤섞이는 현상이 발생할 수 있는 중대한 취약점 발견.
- **원인(Root Cause)**: 백엔드 `spotify_callback` 로직에서 OAuth 완료 후 Spotify가 던져준 토큰을 무조건 **'DB에서 가장 마지막으로 가입/생성된 유저(`order_by(created_at.desc()).limit(1)`)'** 에게 할당하는 하드코딩 목업(Mock) 코드가 프로덕션에 그대로 남아있었음. 브라우저가 다이렉트로 백엔드(`GET /auth/spotify/login`)로 넘어가기 때문에 JWT 헤더가 유실되어 내가 누군지 백엔드가 모르는 상태였음.
- **해결**: `DashboardClient.tsx`에서 연동 버튼을 누를 때 쿼리스트링으로 `?token=${access_token}`을 백엔드에 넘김. ➡️ 백엔드(`auth.py`)가 토큰을 풀어서 `user_id`를 알아낸 후 스포티파이 `state` 파라미터에 집어넣어 보냄. ➡️ 스포티파이가 콜백 때 그 `state`를 그대로 돌려주면, 백엔드가 정확히 그 `user_id`를 찾아 토큰을 맵핑(Full-fix 적용).
- **예방 규칙**: 브라우저 리다이렉트를 수반하는 OAuth 연동 흐름(Third-party Authentication)에서는 HTTP 인증 헤더(Bearer Token)가 유지되지 않으므로, **반드시 OAuth 표준의 `state` 파라미터를 활용**하여 요청자의 식별자를 끝까지 보존하는 세션 유지 설계를 필수로 해야 함.

## 17. 스포티파이 연동/동기화 관련 연쇄 에러 및 아키텍처 반성문 (Retrospective)
- **상황**: 데이터를 정상적으로 동기화하지 못하고 UI가 어긋나는 현상이 여러 계층(프론트, 백엔드 DB, 외부 연동)에 걸쳐 복합적으로 발생.
- **원인 분석(Root Causes) 및 해결 카테고리**:
  1. **[보안/세션 유지] OAuth State 누락**: 위 16번 항목과 동일. 사용자가 브라우저를 벗어났다 돌아올 때 식별자가 날아가 다른 유저에게 토큰이 갱신되는 심각한 오염 발생. `state` 파라미터와 `get_current_user_id` JWT Validation 연동으로 디커플링 및 보안 해결.
  2. **[토큰 생명주기 관리] Refresh Token 재발급권 소멸 로직 부재**: 
     - *문제*: `sync_recently_played`에서 1시간 뒤 Access Token이 만료됐을 때 갱신하는 로직 자체가 없었음.
     - *문제2*: 재연동 시 Spotify가 `refresh_token`을 돌려주지 않을 때, DB에 강제로 `None`을 덮어씌워 영구적으로 갱신 불가 상태에 빠짐.
     - *해결*: 토큰 만료 전 API 호출 시 자동 Refresh 하도록 서비스 레이어 보강. 콜백에서 `token_data.get('refresh_token')`이 존재할 때만 업데이트하도록 방어 코드 추가.
  3. **[외부 의존성 상태 동기화] App 연동 강제 해제 감지 실패**: 
     - *문제*: 유저가 스포티파이 사이트에서 앱 권한을 철회해도, 내부 DB에는 옛날 토큰이 남아있어 프론트엔드는 영원히 "연동됨"으로 착각. 버튼도 막힘.
     - *해결*: 트래픽 호출(`get_recently_played` 또는 Token Refresh) 시 400/401(Invalid Grant 등) 에러를 맞으면 즉시 DB의 Token을 `None`으로 날리고 세션을 커밋하여, 프론트가 즉시 "연동 끊김" 상태를 인지하게 만듦.
  4. **[글로벌 시차(Timezone) 동기화] KST vs UTC 불일치에 따른 데이터 증발**: 
     - *문제*: 프론트 `Date.toISOString()`과 렌더 서버 DB(PostgreSQL)의 그룹핑 함수들이 UTC를 베이스로 돌면서 한국의 아침 9시 이전 데이터가 전부 전날로 그룹핑되거나 `isToday` 로직이 빗나감.
     - *해결*: 프론트엔드 전역에 절대 기준인 KST(UTC+9) `getKstDateString` 헬퍼 함수를 적용. 백엔드 `diary_repository.py`에서는 DB 의존성 강한 Date Grouping 쿼리를 버리고, 범위 내 모든 객체를 가져와 **파이썬 메모리단에서 KST 시간대로 확실하게 Group By** 하도록 N+1 방지 튜닝 적용.
- **최종 예방 규칙(Golden Rules)**: 
  - 외부 연동 프로젝트 시, 외부 리소스(State, Token Lifecycle, App Permissions 제어권)는 언제든 사용자나 플랫폼에 의해 끊어지거나 만료될 수 있음을 가정하고, **API Exception을 Catch하여 내부 상태를 즉시 무효화(Invalidate)하는 방어 로직을 최우선으로 작성하라.**
  - **날짜 기반 조회 로직은 시스템 클럭(UTC)에 암묵적으로 의존해선 안되며**, 클라이언트의 기준 Timezone을 명시적으로 파라미터로 받거나 하드코딩된 지역 표준시(KST)로 서버와 프론트 양쪽 모두 명시적 형변환을 거쳐야 한다.


## [Error #18] 타임존 불일치 (UTC->KST) 및 기간 필터링 누락 (2026-02-23)

###  문제 상황 (Symptom)
1. 스포티파이 동기화 목록에서 '어제(22일)' 들은 곡이 '오늘(23일)' 대시보드 메인에 여전히 노출됨.
2. 프론트엔드에서 재생 시간이 오후 2시가 아닌 오전 5시(UTC 기준 시간)로 -9시간 어긋나게 렌더링됨.

###  원인 분석 (Root Cause)
1. **기간 필터링 누락:** 백엔드에서 최대 50곡을 가져올 때, API가 단순히 '최근 50곡'을 반환하게 두어 과거 날짜의 곡까지 섞여서 Today 뷰로 응답됨.
2. **타임존 마커 누락:** DB에 저장된 listened_at 타임스탬프(UTC)를 JSON 응답으로 내려줄 때 Z (UTC 식별자)가 빠져있어서, 프론트엔드의 
ew Date()가 이를 로컬 시간(KST)으로 오해하여 결과적으로 KST 표시 시 -9시간이 발생함.

###  해결책 (Solution)
1. **KST 기준 Date Boundary:** /me/recently-played 라우터에서 KST 시간대 기준으로 '오늘 00:00 ~ 23:59' 범위만 쿼리 반환하도록 where() 필터링 로직 추가.
2. **명시적 UTC 직렬화:** DiaryResponse 스키마에 Pydantic @field_validator('listened_at')를 추가하여 반환되는 datetime 객체가 명시적으로 	zinfo=timezone.utc를 가지도록 강제. 프론트엔드가 정확한 offset(+9)을 적용할 수 있게 됨.

###  재발 방지 (Prevention Rule)
- **[Timezone-Aware Rule]** DB에 Timestamp를 저장할 때와 클라이언트로 내보낼 때는 반드시 타임존 마커(UTC Z 또는 offset)를 명시적으로 붙여서 직렬화한다.
- 프론트엔드의 View 성격(Today, History)에 맞게 백엔드 API 단에서 철저하게 Date boundary 필터링을 거친 후 응답한다.


## [Error #19] localhost와 127.0.0.1 혼용으로 인한 OAuth/CORS 컨텍스트 파괴 (2026-02-23)

###  문제 상황 (Symptom)
로컬 개발 환경 테스트를 안내하면서 PM님께 접속 URL을 \http://localhost:3000\으로 잘못 안내함. PM님의 로컬 환경 및 OAuth 리다이렉트 설정(Spotify, Google 등)은 모두 \127.0.0.1\로 고정되어 있어, 브라우저가 다르게 인식하여 인증 세션이 깨지거나 리다이렉트가 엇갈리는 치명적 불편함 유발.

###  원인 분석 (Root Cause)
- 개발 편의상 \localhost\와 \127.0.0.1\을 무의식적으로 동일시하는 안일한 태도.
- OAuth 2.0 스펙상 URI 매칭은 **Strict String Matching(엄격한 문자열 일치)**을 따르기 때문에, 도메인이 다르면 완전히 다른 출처(Origin)로 취급된다는 보안/웹 아키텍처의 기본 원칙을 간과함.

###  재발 방지 (Prevention Rule)
- **[Strict Origin Rule]** 로컬 환경의 접속 URL, API 엔드포인트, 콜백 주소를 언급하거나 설정할 때는 **단 하나라도 틀림없이 절대적으로 \127.0.0.1\로 고정하여 표기하고 안내한다.**
- 절대 \localhost\라는 단어를 입에 올리지 않으며, 코드나 환경 변수 내부에서도 혼용을 원천 차단한다.


## [Error #20] 브라우저 로컬 타임존 의존에 따른 UI 랜더링 시간 어긋남 잠재 위험 (2026-02-23)

###  문제 상황 (Symptom)
백엔드의 KST 필터링과 UTC 직렬화는 정상적으로 수정되었으나, 프론트엔드에서 Date 렌더링 시 \date.toLocaleTimeString()\을 사용할 때 명시적인 타임존 옵션이 없어, 사용자의 **로컬 브라우저 기기 환경(예: 해외 접속 또는 컴퓨터 시간/지역 설정 오류)**에 따라 KST가 아닌 다른 시간으로 보여질 잠재적인 버그(에러) 요인이 남아있었음.

###  원인 분석 (Root Cause)
- JS의 내장 Date 포맷팅 함수(\	oLocaleDateString\, \	oLocaleTimeString\)는 옵션을 주지 않으면 클라이언트(OS/브라우저)의 시스템 현재 시간대에 100% 종속됨.
- 이 서비스는 '한국 시간(KST)'을 기준으로 자정 경계를 끊고 다이어리를 기록하므로, 해외에서 접속하든 타임존 설정이 잘못되었든 화면에는 무조건 통일된 KST로 보여져야 하는 **도메인 정책(Domain Policy)**이 코드에 하드코딩되지 못함.

###  해결책 (Solution)
- 프론트엔드의 화면 랜더링 로직(\DashboardClient.tsx\, \capsule/page.tsx\)에 사용된 모든 \	oLocale...\ 함수 인자에 \{ timeZone: 'Asia/Seoul' }\ 옵션을 강제로 주입하여 클라이언트 OS 환경에 관계없이 KST로 고정출력 하도록 렌더링 정책을 보완함.

###  재발 방지 (Prevention Rule)
- **[KST Forced View Rule]** 도메인 시간 기준이 KST인 앱에서는, 프론트엔드가 날짜와 시간을 화면에 그릴 때 절대 \
ew Date().toLocaleTimeString()\ 같이 아무 옵션 없이 브라우저 시간에 의존하도록 놔두면 안 된다. 반드시 \{ timeZone: 'Asia/Seoul' }\ 옵션을 명시하여 환경 독립성을 보장해야 한다.

## [Error #21] Tailwind v4 `lab()`/`oklch()` 색상 함수와 `html2canvas` 렌더링 호환성 파괴 버그 (2026-02-23)

### 문제 상황 (Symptom)
1. 사용자가 '스토리 저장하기(Download)' 버튼을 클릭했을 때 이미지 다운로드가 먹통이 되며 콘솔에 `Error: Attempting to parse an unsupported color function "lab"` 에러가 출력됨.
2. AI Daily Capsule(Gemini) 호출이 무료 할당량 소진으로 인해 `ResourceExhausted` 에러를 뿜었고, 이를 대비한 Fallback 문구가 UI에 노출되지 않음. 심지어 코드 수정 후에도 DB에 해당 에러 문구가 "캐싱(당일 1회 생성 원칙)"되어 있어 계속 노출됨.

### 원인 분석 (Root Cause)
1. **렌더링 라이브러리 호환성:** 프로젝트가 최근 출시된 Tailwind CSS v4를 사용하면서, 내부적으로 `rgba()` 대신 최신 색역(Color Space)인 `oklch()`나 `lab()` 함수를 CSS 변수로 적극 치환하기 시작함. 반면 구버전 스펙에 머물러 있는 `html2canvas`는 이를 파싱할 수 없어 DOM 순회 중 크래시가 발생.
2. **AI 데이터 영속성 (Caching) 간과:** 하루에 한 번만 캡슐을 생성하도록 DB 락(Lock)이 걸려있어, 처음 1회 API 호출 시 터진 에러 메시지(ResourceExhausted) 자체가 DB(`ai_summary` 컬럼)에 그대로 영속화(Save)되었음. 백엔드 코드의 Fallback 로직을 아무리 고쳐도, 프론트는 DB에 저장된 어제의 실패 기록을 그대로 가져오기 때문에 UI 픽스가 체감되지 않음.

### 해결책 (Solution)
1. **[Hotfix -> Full-fix]**: `html2canvas`를 버리고 DOM 파싱 유연성이 조금 더 나은 `dom-to-image` 패키지로 캡처 로직 교체. `lab()` 파싱 에러 우회 완료.
2. DB에 캐싱된 오염된 데이터(ResourceExhausted)를 파이썬 스크립트(sqlite3)로 직접 `DELETE` 쿼리하여 지운 후 다시 생성 테스트하여 정상 폴백(머금은 음악들이 위로가 되기를...) 작동을 확인. 

### 재발 방지 (Prevention Rule)
- **[CSS Next-Gen Rule]** 프론트엔드에서 최신 기술 스택(Tailwind v4)을 도입할 때는, DOM을 직접 파싱하는 레거시 화면 캡처, PDF 생성 라이브러리들(ex. html2canvas)의 최신 색상 함수(`lab`, `oklch`) 지원 여부를 반드시 사전 검증한다.
- **[Error Propagation Rule]** 외부 AI API가 터졌을 때 발생한 시스템 에러 메시지(`Exception` 텍스트)를 그대로 DB의 유저 도메인 컬럼(`ai_summary`)에 `INSERT`하지 않는다. DB 영속화 전에 정제(Fallback 문자열 변환)를 반드시 먼저 수행하라.
