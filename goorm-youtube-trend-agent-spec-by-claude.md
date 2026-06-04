# YouTube 트렌드 리서치 에이전트 — 기술명세서 v0.1

**프로젝트명:** YouTube Trend Research Agent  
**작성일:** 2026-06-04  
**작성자:** 이해진 / NextPlatform  
**버전:** 0.1 (초안)

---

## 1. 개요

### 1.1 문제 정의

콘텐츠 제작자는 매일 다음 세 가지 질문에 답해야 한다.

- 어떤 주제가 지금 뜨고 있는가?
- 어떤 채널이 빠르게 성장하고 있는가?
- 어떤 키워드와 제목 패턴이 조회수를 만드는가?

이 작업은 현재 수작업 검색 → 스프레드시트 정리 → 분석 작성으로 이어지는 2~3시간짜리 반복 작업이다. 에이전트는 이 전 과정을 자동화하고, 결과를 즉시 활용 가능한 트렌드 리포트로 출력한다.

### 1.2 활용 채널

| 채널 | 활용 방식 |
|------|----------|
| NextPlatform 블로그 | 주간 트렌드 리포트 → 뉴스레터 콘텐츠 소재 |
| AI 뉴스 채널 (YouTube) | 급상승 토픽 → 영상 기획 |
| 쇼츠 채널 | 인기 키워드 + 제목 패턴 → 쇼츠 아이디어 |

---

## 2. 시스템 아키텍처

### 2.1 멀티 에이전트 구조

```
사용자 입력 (키워드 / 채널 URL / 카테고리)
        ↓
   Orchestrator Agent
   (작업 분배 · 결과 통합)
        ↓
  ┌──────────────────────────────────┐
  │  서브 에이전트 풀                │
  │  ① Search Agent                 │
  │  ② Video Stats Agent            │
  │  ③ Channel Analysis Agent       │
  │  ④ Pattern Analysis Agent       │
  └──────────────────────────────────┘
        ↓
   Claude API (분석 · 요약)
        ↓
   트렌드 리포트 출력
   (Markdown / JSON / 뉴스레터 초안)
```

### 2.2 에이전트 역할 분담

**Orchestrator Agent**
- 사용자 입력을 파싱하고 서브 에이전트에 작업 분배
- 각 서브 에이전트 결과를 수집·통합
- Claude API에 최종 분석 요청

**① Search Agent**
- YouTube Data API `search.list` 호출
- 파라미터: `q`, `order=viewCount`, `publishedAfter` (최근 7/30일), `regionCode=KR`, `relevanceLanguage=ko`
- 반환: 상위 20~50개 영상의 videoId, 제목, 채널명, 게시일

**② Video Stats Agent**
- `videos.list` 호출 (파라미터: `part=statistics,snippet,contentDetails`)
- 수집 항목: viewCount, likeCount, commentCount, duration, 썸네일 URL
- 급상승 지표 계산: `조회수 / 게시 후 경과 시간` = 시간당 조회수 속도

**③ Channel Analysis Agent**
- `channels.list` 호출 (파라미터: `part=statistics,snippet,brandingSettings`)
- 수집 항목: 구독자수, 총 조회수, 영상 수, 채널 개설일
- 성장률 추정: 최근 업로드 영상 평균 조회수 / 구독자수 비율

**④ Pattern Analysis Agent**
- Search Agent 결과에서 제목 텍스트 추출
- Claude API를 통해 제목 패턴 분석 (숫자 포함 여부, 의문문/감탄문, 특정 키워드 빈도)
- 썸네일 URL 수집 (시각적 패턴 분석용 — Phase 2)

---

## 3. 데이터 흐름 및 YouTube API 매핑

### 3.1 핵심 API 엔드포인트

| 기능 | API 리소스 | 메서드 | 주요 파라미터 |
|------|-----------|--------|--------------|
| 키워드 검색 | `search` | `list` | `q`, `type=video`, `order`, `publishedAfter`, `maxResults` |
| 영상 통계 | `videos` | `list` | `id` (복수), `part=statistics,snippet` |
| 채널 정보 | `channels` | `list` | `id` 또는 `forHandle`, `part=statistics,snippet` |
| 카테고리 목록 | `videoCategories` | `list` | `regionCode=KR`, `hl=ko` |

### 3.2 급상승 영상 탐지 로직

```
급상승 스코어 = viewCount / max(1, hours_since_published)

급상승 판정 기준 (예시):
- 게시 후 24시간 이내 + 시간당 조회수 > 10,000 → 🔥 급상승
- 게시 후 7일 이내 + 시간당 조회수 > 3,000  → 📈 상승세
```

### 3.3 Quota 관리 전략

YouTube Data API는 하루 10,000 유닛 제한이 있다.

| 작업 | 유닛 소비 | 비고 |
|------|----------|------|
| `search.list` 1회 | 100 유닛 | 가장 비싼 호출 |
| `videos.list` 1회 (50개) | 1 유닛 | 묶음 호출 필수 |
| `channels.list` 1회 | 1 유닛 | |

**전략:** search.list는 하루 최대 5~10회로 제한. videoId는 50개씩 묶어서 `videos.list` 1회 호출.

---

## 4. Claude API 분석 레이어

### 4.1 분석 태스크

Orchestrator가 서브 에이전트 결과를 취합한 뒤 Claude API에 다음 분석을 요청한다.

**태스크 1: 트렌드 요약**
- 입력: 상위 영상 20개의 제목 + 조회수 + 급상승 스코어
- 출력: 현재 급부상 중인 토픽 3~5개, 각 토픽에 대한 2~3줄 해설

**태스크 2: 제목 패턴 분석**
- 입력: 상위 50개 영상 제목 텍스트
- 출력: 자주 등장하는 패턴 (숫자형, 의문형, 비교형 등), 추천 제목 공식 2~3개

**태스크 3: 콘텐츠 아이디어 생성**
- 입력: 트렌드 요약 + 채널 성격 (NXP 블로그 / AI 뉴스 / 쇼츠)
- 출력: 채널별 즉시 활용 가능한 콘텐츠 아이디어 3~5개 + 추천 제목 후보

### 4.2 Claude API 호출 구조

```
model: claude-sonnet-4-20250514
system: "당신은 YouTube 콘텐츠 트렌드 분석 전문가입니다. ..."
messages: [
  { role: "user", content: "[수집된 YouTube 데이터 JSON]" }
]
tools: [
  get_trending_videos(),
  get_channel_stats(),
  get_video_details()
]
```

Tool Use 방식으로 Claude가 필요한 데이터를 직접 요청하는 구조도 고려 가능 (Phase 2 MCP 연계 시).

---

## 5. 출력 형식

### 5.1 트렌드 리포트 구조

```
# YouTube 트렌드 리포트
생성일: YYYY-MM-DD | 분석 키워드: [입력값]

## 🔥 이번 주 급상승 토픽
1. [토픽명] — [2~3줄 요약]
2. ...

## 📊 상위 영상 분석 (Top 10)
| 순위 | 제목 | 채널 | 조회수 | 게시일 | 급상승 스코어 |
|------|-----|------|-------|--------|------------|
| ...  |

## 💡 제목 패턴 인사이트
- 자주 등장하는 패턴: ...
- 추천 제목 공식: ...

## 🚀 채널별 콘텐츠 아이디어
### NXP 블로그
- ...
### AI 뉴스 채널
- ...
### 쇼츠
- ...
```

### 5.2 출력 포맷 옵션

| 포맷 | 용도 |
|------|------|
| Markdown | NextPlatform 블로그 직접 붙여넣기 |
| JSON | 자동화 파이프라인 연동 |
| 뉴스레터 초안 | Silver/Gold 멤버십 콘텐츠 |

---

## 6. 기술 스택

| 레이어 | 기술 |
|--------|-----|
| 런타임 | Node.js (TypeScript) 또는 Python |
| 에이전트 프레임워크 | Anthropic Tool Use (claude-sonnet-4-20250514) |
| YouTube 데이터 수집 | YouTube Data API v3 |
| 스케줄링 | GitHub Actions cron (매일 06:00 KST) |
| 결과 저장 | JSON 파일 → Vercel KV 또는 Neon PostgreSQL |
| 배포 | Vercel (API Route) 또는 Railway |
| 프론트엔드 (선택) | React + Vite — 대시보드 뷰 |

---

## 7. 단계별 빌드 계획

### Phase 1 — CLI MVP (1~2일)
- Search Agent + Video Stats Agent 구현
- 키워드 입력 → 급상승 Top 10 리스트 출력
- Claude API 연동: 트렌드 요약 1개 생성
- 결과: Markdown 파일 저장

### Phase 2 — 멀티 에이전트 + 스케줄링 (3~5일)
- Channel Analysis Agent + Pattern Analysis Agent 추가
- Orchestrator Agent로 통합
- GitHub Actions 스케줄러 연동 (매일 자동 실행)
- 결과: Neon DB 저장 + Slack/이메일 알림

### Phase 3 — MCP 서버 연동 (추후)
- `get_trending_videos(keyword)`, `get_channel_stats(channelId)` Tool 공개
- NextPlatform MCP 서버에 통합
- AIGrape 교육 에이전트 백엔드 연계

---

## 8. 주요 제약 및 고려사항

**YouTube API 제한**
- `search.list`는 썸네일 이미지 다운로드 불가 (URL만 수집)
- 실시간 조회수 스트리밍 미지원 — 폴링 방식으로 대응
- 비공개 채널/영상 데이터 접근 불가 (OAuth 불필요, API Key만 사용)

**썸네일 분석**
- Phase 1에서는 썸네일 URL 수집만 진행
- 시각적 패턴 분석 (색상, 텍스트 위치, 얼굴 포함 여부)은 Claude Vision API 활용 — Phase 2 이후

**보안**
- YouTube API Key는 환경변수로 관리 (`.env`)
- 서버사이드 전용 호출 — 클라이언트 노출 금지
- AIGrape 보안 패턴 적용: rate limiting + IP 기반 접근 제어

---

*NextPlatform | 동준상 | nextplatform.net*
