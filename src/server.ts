import "dotenv/config";
import express from "express";
import { runOrchestrator } from "./agents/orchestrator";
import { buildMarkdownReport, saveReport } from "./reporter";

const app = express();
const PORT = 5151;

app.use(express.json());

app.get("/", (_req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>YouTube 트렌드 리서치 에이전트</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #0f0f0f;
      color: #f1f1f1;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px 16px;
    }
    .container { width: 100%; max-width: 860px; }
    h1 {
      font-size: 1.8rem;
      font-weight: 700;
      margin-bottom: 6px;
      background: linear-gradient(90deg, #ff4e4e, #ff9b4e);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .subtitle { color: #aaa; font-size: 0.9rem; margin-bottom: 32px; }
    .search-box {
      display: flex;
      gap: 10px;
      margin-bottom: 12px;
    }
    input[type="text"] {
      flex: 1;
      padding: 14px 18px;
      border-radius: 10px;
      border: 1px solid #333;
      background: #1a1a1a;
      color: #fff;
      font-size: 1rem;
      outline: none;
      transition: border-color 0.2s;
    }
    input[type="text"]:focus { border-color: #ff4e4e; }
    .days-row {
      display: flex;
      gap: 8px;
      margin-bottom: 20px;
      font-size: 0.85rem;
      color: #aaa;
    }
    .days-row label { display: flex; align-items: center; gap: 4px; cursor: pointer; }
    .days-row input[type="radio"] { accent-color: #ff4e4e; }
    button {
      padding: 14px 28px;
      border-radius: 10px;
      border: none;
      background: linear-gradient(90deg, #ff4e4e, #ff9b4e);
      color: #fff;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      transition: opacity 0.2s;
    }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    #status {
      padding: 12px 16px;
      border-radius: 8px;
      background: #1a1a1a;
      border: 1px solid #333;
      font-size: 0.9rem;
      color: #aaa;
      min-height: 48px;
      margin-bottom: 20px;
      display: none;
    }
    #status.active { display: block; }
    #result {
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 12px;
      padding: 28px;
      white-space: pre-wrap;
      font-family: 'Menlo', 'Consolas', monospace;
      font-size: 0.82rem;
      line-height: 1.7;
      color: #e0e0e0;
      display: none;
      max-height: 80vh;
      overflow-y: auto;
    }
    #result.active { display: block; }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.75rem;
      background: #2a2a2a;
      color: #ff9b4e;
      border: 1px solid #ff9b4e44;
      margin-bottom: 28px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>YouTube 트렌드 리서치 에이전트</h1>
    <p class="subtitle">키워드를 입력하면 급상승 영상을 분석하고 트렌드 리포트를 생성합니다.</p>
    <span class="badge">Phase 1 MVP · OpenAI gpt-4o-mini</span>
    <div class="search-box">
      <input type="text" id="keyword" placeholder="예: AI, 챗GPT, 재테크, 쇼츠" value="AI" />
      <button id="runBtn" onclick="runAgent()">분석 시작</button>
    </div>
    <div class="days-row">
      <span>수집 기간:</span>
      <label><input type="radio" name="days" value="3" /> 최근 3일</label>
      <label><input type="radio" name="days" value="7" checked /> 최근 7일</label>
      <label><input type="radio" name="days" value="30" /> 최근 30일</label>
    </div>
    <div id="status"></div>
    <pre id="result"></pre>
  </div>

  <script>
    async function runAgent() {
      const keyword = document.getElementById('keyword').value.trim();
      if (!keyword) return alert('키워드를 입력해주세요.');
      const days = document.querySelector('input[name="days"]:checked').value;
      const btn = document.getElementById('runBtn');
      const status = document.getElementById('status');
      const result = document.getElementById('result');

      btn.disabled = true;
      status.className = 'active';
      result.className = '';
      status.textContent = '🔍 YouTube 검색 중...';

      try {
        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ keyword, days: parseInt(days) }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || '서버 오류');
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = JSON.parse(line.slice(6));
              if (data.status) status.textContent = data.status;
              if (data.report) {
                result.textContent = data.report;
                result.className = 'active';
                status.textContent = '✅ 분석 완료 — reports/ 폴더에도 저장됐습니다.';
              }
            }
          }
        }
      } catch (e) {
        status.textContent = '❌ 오류: ' + e.message;
      } finally {
        btn.disabled = false;
      }
    }

    document.getElementById('keyword').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') runAgent();
    });
  </script>
</body>
</html>`);
});

// SSE 스트리밍으로 진행 상황 실시간 전달
app.post("/api/analyze", async (req, res) => {
  const { keyword, days = 7 } = req.body as { keyword: string; days: number };

  if (!keyword?.trim()) {
    res.status(400).json({ error: "keyword가 필요합니다." });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const send = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  try {
    send({ status: `🔍 "${keyword}" 검색 중 (최근 ${days}일)...` });
    const { searchVideos } = await import("./agents/searchAgent");
    const searchResults = await searchVideos(keyword, 50, days);
    send({ status: `📊 ${searchResults.length}개 영상 통계 수집 중...` });

    const { getVideoStats } = await import("./agents/videoStatsAgent");
    const videoStats = await getVideoStats(searchResults);
    send({ status: `🤖 OpenAI로 트렌드 분석 중...` });

    const OpenAI = (await import("openai")).default;
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const videoSummaries = videoStats.slice(0, 20).map((v, i) => ({
      rank: i + 1,
      title: v.title,
      channel: v.channelTitle,
      viewCount: v.viewCount.toLocaleString(),
      trendingScore: v.trendingScore.toLocaleString(),
      label: v.trendingLabel,
      publishedAt: v.publishedAt.slice(0, 10),
    }));

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "당신은 YouTube 콘텐츠 트렌드 분석 전문가입니다. 데이터 기반으로 실용적이고 즉시 활용 가능한 인사이트를 제공합니다.",
        },
        {
          role: "user",
          content: `다음은 YouTube에서 "${keyword}" 키워드로 수집한 최근 급상승 영상 Top 20 데이터입니다.\n\n${JSON.stringify(videoSummaries, null, 2)}\n\n아래 형식으로 트렌드 분석 리포트를 작성해주세요:\n1. **이번 주 급부상 토픽 3~5개** — 각 토픽에 대한 2~3줄 해설\n2. **제목 패턴 인사이트** — 자주 등장하는 패턴, 추천 제목 공식 2~3개\n3. **채널별 콘텐츠 아이디어** — NXP 블로그 / AI 뉴스 채널 / 쇼츠 각 3개씩\n\n한국어로 작성해주세요.`,
        },
      ],
      temperature: 0.7,
    });

    const trendSummary = completion.choices[0].message.content ?? "";

    const report = {
      generatedAt: new Date().toISOString(),
      keyword,
      topVideos: videoStats.slice(0, 10),
      trendSummary,
    };

    saveReport(report);
    send({ status: "✅ 완료", report: buildMarkdownReport(report) });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    send({ status: `❌ 오류: ${message}` });
  } finally {
    res.end();
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 YouTube 트렌드 에이전트 실행 중`);
  console.log(`   http://localhost:${PORT}\n`);
});
