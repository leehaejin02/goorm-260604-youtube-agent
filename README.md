# YouTube 트렌드 리서치 에이전트

YouTube Data API v3와 OpenAI API를 활용하여 키워드 기반 트렌드 영상을 자동 수집·분석하고, 핀터레스트 스타일의 트렌드 매거진으로 제공하는 멀티 에이전트 앱입니다.

---

## 주요 기능

### 콘텐츠 & UI
- **핀터레스트 매거진 레이아웃** — CSS Grid 카드 형식으로 트렌드 리포트 제공
- **글로벌 인사이트 배너** — 전 세계 / 한국 YouTube 실시간 트렌딩 영상 (탭 전환)
- **리포트 카드** — 썸네일 · 키워드 태그 · 요약 · 날짜 표시
- **Top 10 영상** — 썸네일, YouTube 링크, 조회수/좋아요/급상승 스코어 포함

### 인증 & 권한
- **관리자 로그인** — 이메일 + 비밀번호 (bcrypt 해싱, express-session)
- **독자(일반 사용자)** — 로그인 없이 리포트 열람 + 찜하기 (localStorage)

### 분석 엔진
- **키워드 검색** — YouTube `search.list`로 최근 3/7/30일 내 인기 영상 최대 50개 수집
- **급상승 스코어** — `조회수 / 게시 후 경과 시간(h)` 공식으로 자동 판별
- **OpenAI 분석** — `gpt-4o-mini`로 급부상 토픽 요약, 제목 패턴, 채널별 콘텐츠 아이디어 생성
- **실시간 진행 표시** — SSE(Server-Sent Events)로 분석 상태 스트리밍
- **Markdown 저장** — 분석 결과를 `reports/` 폴더에 자동 저장

---

## 시스템 아키텍처

```
브라우저 (http://localhost:5151)
        ↓
   Express 웹 서버
   ├─ GET  /                 → 매거진 랜딩 (리포트 카드 + 글로벌 인사이트)
   ├─ GET  /report/:id       → 리포트 상세 (Top10 영상 + 트렌드 분석)
   ├─ GET  /admin            → 관리자 대시보드 (분석 실행)
   ├─ GET  /api/insights     → 글로벌/한국 트렌딩 JSON
   └─ POST /admin/analyze    → SSE 분석 스트림
        ↓
   ① Search Agent            YouTube search.list
   ② Video Stats Agent       YouTube videos.list (50개 묶음)
   ③ Global Insights Agent   YouTube videos.list?chart=mostPopular
        ↓
   OpenAI gpt-4o-mini (트렌드 분석)
        ↓
   JSON 저장 (reports/data/) + Markdown 저장 (reports/)
```

---

## 급상승 판정 기준

| 조건 | 레이블 |
|------|--------|
| 게시 후 24h 이내 + 시간당 조회수 > 10,000 | 🔥 급상승 |
| 게시 후 7일 이내 + 시간당 조회수 > 3,000 | 📈 상승세 |
| 그 외 | 일반 |

---

## 기술 스택

| 레이어 | 기술 |
|--------|------|
| 런타임 | Node.js + TypeScript |
| 웹 서버 | Express 5 |
| 인증 | express-session + bcryptjs |
| YouTube 데이터 수집 | YouTube Data API v3 |
| AI 분석 | OpenAI API (`gpt-4o-mini`) |
| 리포트 ID | uuid v4 |
| 찜하기 | localStorage (클라이언트 전용) |

---

## 빠른 시작

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경변수 설정

`.env.example`을 복사하여 `.env` 파일을 생성하고 값을 채웁니다.

```bash
cp .env.example .env
```

```env
YOUTUBE_API_KEY=발급받은_유튜브_API_키
OPENAI_API_KEY=발급받은_오픈AI_API_키

ADMIN_EMAIL=naebon1@gmail.com
ADMIN_PASSWORD=사용할_비밀번호
SESSION_SECRET=랜덤_문자열
```

> YouTube API 키: [Google Cloud Console](https://console.cloud.google.com/) → YouTube Data API v3 사용 설정
> OpenAI API 키: [OpenAI Platform](https://platform.openai.com/)

### 3. 서버 실행

```bash
npm run server
```

브라우저에서 **http://localhost:5151** 접속

### 4. CLI 실행 (선택)

```bash
npx ts-node src/index.ts AI
```

---

## 프로젝트 구조

```
src/
├── index.ts                       # CLI 진입점
├── server.ts                      # Express 웹 서버 (port 5151)
├── auth.ts                        # 관리자 인증 (bcrypt + session)
├── reporter.ts                    # JSON/Markdown 리포트 저장·조회
├── agents/
│   ├── searchAgent.ts             # YouTube search.list
│   ├── videoStatsAgent.ts         # videos.list + 급상승 스코어
│   ├── orchestrator.ts            # CLI용 에이전트 조율
│   └── globalInsightsAgent.ts     # YouTube 글로벌/한국 트렌딩
├── views/
│   ├── layout.ts                  # 공유 CSS + 네비게이션
│   ├── landing.ts                 # 매거진 랜딩 페이지
│   ├── reportDetail.ts            # 리포트 상세 (썸네일 + 링크)
│   ├── adminLogin.ts              # 관리자 로그인 폼
│   └── adminDashboard.ts          # 관리자 대시보드 (SSE)
└── types/
    └── index.ts                   # 공유 타입 정의
reports/
├── data/
│   ├── index.json                 # 리포트 목록 인덱스
│   └── [uuid].json                # 리포트 데이터
└── trend_[keyword]_[date].md      # Markdown 리포트
```

---

## YouTube API Quota 관리

| 호출 | 유닛 소비 |
|------|----------|
| `search.list` 1회 | 100 유닛 |
| `videos.list` 50개 묶음 1회 | 1 유닛 |
| `videos.list?chart=mostPopular` (글로벌 인사이트) | 1 유닛 × 2 |

- `search.list`는 하루 최대 5~10회 권장 (일일 한도 10,000 유닛)
- 글로벌 인사이트는 30분 캐시로 Quota 절약

---

## 빌드 계획

| 단계 | 내용 | 상태 |
|------|------|------|
| Phase 1 | CLI + 웹 UI MVP | ✅ 완료 |
| Phase 1.1 | 매거진 UI + 글로벌 인사이트 + 관리자 인증 + 찜하기 | ✅ 완료 |
| Phase 2 | Channel Analysis Agent + GitHub Actions 스케줄러 | 예정 |
| Phase 3 | MCP 서버 연동 | 예정 |

---

## 변경 이력

### v0.2 — 매거진 UI + 인증 (2026-06-04)

| 항목 | 내용 |
|------|------|
| UI 전면 개편 | 핀터레스트 매거진 스타일로 재구성 |
| 글로벌 인사이트 | `videos.list?chart=mostPopular` 글로벌/한국 트렌딩 배너 추가 |
| 리포트 카드 | 썸네일 · 요약 · 날짜 카드 그리드 |
| 관리자 로그인 | bcrypt 비밀번호 해싱 + express-session |
| 독자 찜하기 | localStorage 기반 하트 토글 |
| Top 10 영상 | 썸네일 이미지 + YouTube 링크 추가 |
| 리포트 저장 | JSON + Markdown 이중 저장, UUID 기반 ID |

### v0.1 — CLI MVP (2026-06-04)

| 항목 | 내용 |
|------|------|
| API 변경 | 명세서 원안의 Claude API → **OpenAI API** (`gpt-4o-mini`) |
| 웹 서버 추가 | Express + SSE 실시간 스트리밍 (port 5151) |
| Quota 최적화 | `videos.list` 50개 묶음 호출 |

---

*NextPlatform · goorm 7-day project · 2026-06-04*
