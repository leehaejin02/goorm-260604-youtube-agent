# YouTube 트렌드 리서치 에이전트

YouTube Data API v3와 OpenAI API를 활용하여 키워드 기반 트렌드 영상을 자동 수집·분석하고, 즉시 활용 가능한 트렌드 리포트를 생성하는 멀티 에이전트 앱입니다.

---

## 주요 기능

- **키워드 검색** — YouTube `search.list`로 최근 7일/30일 내 인기 영상 최대 50개 수집
- **급상승 스코어 계산** — `조회수 / 게시 후 경과 시간(h)` 공식으로 급상승 영상 자동 판별
- **OpenAI 트렌드 분석** — `gpt-4o-mini`가 급부상 토픽 요약, 제목 패턴, 채널별 콘텐츠 아이디어 생성
- **웹 UI** — 브라우저에서 키워드 입력 → 실시간 진행 상황 표시 → 리포트 출력
- **Markdown 저장** — 분석 결과를 `reports/` 폴더에 자동 저장

---

## 시스템 아키텍처

```
사용자 입력 (키워드 / 수집 기간)
        ↓
   Express 웹 서버 (port 5151)
        ↓
   Orchestrator
   ┌──────────────────────────┐
   │  ① Search Agent          │  YouTube search.list
   │  ② Video Stats Agent     │  YouTube videos.list
   └──────────────────────────┘
        ↓
   OpenAI gpt-4o-mini (분석·요약)
        ↓
   트렌드 리포트 출력 (화면 + Markdown 파일)
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
| YouTube 데이터 수집 | YouTube Data API v3 |
| AI 분석 | OpenAI API (`gpt-4o-mini`) |
| 에이전트 설계 참조 | Anthropic 멀티 에이전트 패턴 |

---

## 빠른 시작

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경변수 설정

`.env.example`을 복사하여 `.env` 파일을 생성하고 API 키를 입력합니다.

```bash
cp .env.example .env
```

```env
YOUTUBE_API_KEY=발급받은_유튜브_API_키
OPENAI_API_KEY=발급받은_오픈AI_API_키
```

> YouTube API 키: [Google Cloud Console](https://console.cloud.google.com/) → YouTube Data API v3 사용 설정  
> OpenAI API 키: [OpenAI Platform](https://platform.openai.com/)

### 3. 웹 서버 실행 (권장)

```bash
npm run server
```

브라우저에서 **http://localhost:5151** 접속

### 4. CLI 실행

```bash
npx ts-node src/index.ts AI
npx ts-node src/index.ts "챗GPT 활용법"
```

---

## 프로젝트 구조

```
src/
├── index.ts                 # CLI 진입점
├── server.ts                # Express 웹 서버 (port 5151)
├── reporter.ts              # Markdown 리포트 생성·저장
├── agents/
│   ├── searchAgent.ts       # YouTube search.list 호출
│   ├── videoStatsAgent.ts   # videos.list + 급상승 스코어 계산
│   └── orchestrator.ts      # 에이전트 조율 + OpenAI 분석 요청
└── types/
    └── index.ts             # 공유 타입 정의
reports/                     # 생성된 Markdown 리포트 저장 폴더
```

---

## YouTube API Quota 관리

| 호출 | 유닛 소비 |
|------|----------|
| `search.list` 1회 | 100 유닛 |
| `videos.list` 50개 묶음 1회 | 1 유닛 |

- `search.list`는 하루 최대 5~10회로 제한 권장 (일일 한도 10,000 유닛)
- `videoId`는 50개씩 묶어 `videos.list` 단건 호출로 유닛 절약

---

## 빌드 계획

| 단계 | 내용 | 상태 |
|------|------|------|
| Phase 1 | CLI + 웹 UI MVP — Search Agent + Video Stats Agent + OpenAI 분석 | ✅ 완료 |
| Phase 2 | Channel Analysis Agent + Pattern Analysis Agent + GitHub Actions 스케줄러 | 예정 |
| Phase 3 | MCP 서버 연동 — `get_trending_videos()` Tool 공개 | 예정 |

---

## 오류 수정 이력

| 항목 | 내용 |
|------|------|
| API 계층 변경 | 명세서 원안의 Claude API → **OpenAI API** (`gpt-4o-mini`)로 교체 |
| 서버 미존재 | CLI 전용 앱에 **Express 웹 서버** 추가 (port 5151) |
| 실시간 피드백 부재 | SSE(Server-Sent Events)로 분석 진행 상황 실시간 스트리밍 구현 |
| Quota 낭비 | `videos.list` 개별 호출 → **50개 묶음 호출**로 유닛 절약 |

---

*NextPlatform · goorm 7-day project · 2026-06-04*
