import "dotenv/config";
import express from "express";
import session from "express-session";
import OpenAI from "openai";
import { randomUUID } from "crypto";
import { initAuth, verifyAdmin, requireAdmin } from "./auth";
import { saveReport, getAllReports, getReportById } from "./reporter";
import { getGlobalInsights } from "./agents/globalInsightsAgent";
import { searchVideos } from "./agents/searchAgent";
import { getVideoStats } from "./agents/videoStatsAgent";
import { landingPage } from "./views/landing";
import { reportDetailPage } from "./views/reportDetail";
import { adminLoginPage } from "./views/adminLogin";
import { adminDashboardPage } from "./views/adminDashboard";
import type { GlobalInsights } from "./types";

const app = express();
const PORT = 5151;

// --- Global insights cache ---
let insightsCache: GlobalInsights | null = null;
let insightsCachedAt = 0;

async function getCachedInsights(): Promise<GlobalInsights | null> {
  const THIRTY_MIN = 30 * 60 * 1000;
  if (!insightsCache || Date.now() - insightsCachedAt > THIRTY_MIN) {
    try {
      insightsCache = await getGlobalInsights();
      insightsCachedAt = Date.now();
      console.log("✅ 글로벌 인사이트 갱신 완료");
    } catch (e) {
      console.warn("⚠️  글로벌 인사이트 수집 실패:", (e as Error).message);
    }
  }
  return insightsCache;
}

// --- Middleware ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET ?? "dev-secret-please-change",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 },
  })
);

// --- Public routes ---

app.get("/", (req, res) => {
  const reports = getAllReports();
  res.send(landingPage(reports, req.session.isAdmin ?? false));
});

app.get("/report/:id", (req, res) => {
  const report = getReportById(req.params.id);
  if (!report) { res.status(404).send("리포트를 찾을 수 없습니다."); return; }
  res.send(reportDetailPage(report, req.session.isAdmin ?? false));
});

app.get("/api/reports", (_req, res) => {
  res.json(getAllReports());
});

app.get("/api/reports/:id", (req, res) => {
  const report = getReportById(req.params.id);
  if (!report) { res.status(404).json({ error: "not found" }); return; }
  res.json(report);
});

app.get("/api/insights", async (_req, res) => {
  const insights = await getCachedInsights();
  if (!insights) { res.status(503).json({ error: "insights unavailable" }); return; }
  res.json(insights);
});

// --- Admin auth routes ---

app.get("/admin/login", (req, res) => {
  if (req.session.isAdmin) { res.redirect("/admin"); return; }
  res.send(adminLoginPage());
});

app.post("/admin/login", async (req, res) => {
  const { email, password } = req.body as { email: string; password: string };
  const ok = await verifyAdmin(email ?? "", password ?? "");
  if (ok) {
    req.session.isAdmin = true;
    res.redirect("/admin");
  } else {
    res.send(adminLoginPage("이메일 또는 비밀번호가 올바르지 않습니다."));
  }
});

app.post("/admin/logout", (req, res) => {
  req.session.destroy(() => {});
  res.redirect("/");
});

// --- Admin protected routes ---

app.get("/admin", requireAdmin, (_req, res) => {
  res.send(adminDashboardPage(getAllReports()));
});

// SSE: 분석 실행
app.post("/admin/analyze", requireAdmin, async (req, res) => {
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
    const searchResults = await searchVideos(keyword, 50, Number(days));
    send({ status: `📊 ${searchResults.length}개 영상 통계 수집 중...` });

    const videoStats = await getVideoStats(searchResults);
    send({ status: "🤖 OpenAI로 트렌드 분석 중..." });

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const summaries = videoStats.slice(0, 20).map((v, i) => ({
      rank: i + 1, title: v.title, channel: v.channelTitle,
      viewCount: v.viewCount.toLocaleString(),
      trendingScore: v.trendingScore.toLocaleString(),
      label: v.trendingLabel, publishedAt: v.publishedAt.slice(0, 10),
    }));

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "당신은 YouTube 콘텐츠 트렌드 분석 전문가입니다. 데이터 기반으로 실용적이고 즉시 활용 가능한 인사이트를 제공합니다.",
        },
        {
          role: "user",
          content: `다음은 YouTube에서 "${keyword}" 키워드로 수집한 최근 급상승 영상 Top 20 데이터입니다.\n\n${JSON.stringify(summaries, null, 2)}\n\n아래 형식으로 트렌드 분석 리포트를 작성해주세요:\n1. **이번 주 급부상 토픽 3~5개** — 각 토픽에 대한 2~3줄 해설\n2. **제목 패턴 인사이트** — 자주 등장하는 패턴, 추천 제목 공식 2~3개\n3. **채널별 콘텐츠 아이디어** — NXP 블로그 / AI 뉴스 채널 / 쇼츠 각 3개씩\n\n한국어로 작성해주세요.`,
        },
      ],
      temperature: 0.7,
    });

    const trendSummary = completion.choices[0].message.content ?? "";

    const report = {
      id: randomUUID(),
      generatedAt: new Date().toISOString(),
      keyword,
      days: Number(days),
      topVideos: videoStats.slice(0, 10),
      trendSummary,
    };

    saveReport(report);
    send({ status: "✅ 분석 완료!", reportId: report.id });
  } catch (err: unknown) {
    send({ status: `❌ 오류: ${err instanceof Error ? err.message : String(err)}` });
  } finally {
    res.end();
  }
});

// --- Initialize ---
// initAuth는 동기 함수 (bcrypt.hashSync) — 서버리스 콜드 스타트 안전
initAuth();

// Vercel 서버리스: app을 export, listen 불필요
// 로컬 개발: listen 호출
if (!process.env.VERCEL) {
  if (!process.env.YOUTUBE_API_KEY) {
    console.error("❌ YOUTUBE_API_KEY 환경변수가 없습니다.");
    process.exit(1);
  }
  if (!process.env.OPENAI_API_KEY) {
    console.error("❌ OPENAI_API_KEY 환경변수가 없습니다.");
    process.exit(1);
  }
  app.listen(PORT, () => {
    console.log(`\n🚀 YouTube 트렌드 에이전트 실행 중`);
    console.log(`   http://localhost:${PORT}`);
    console.log(`   관리자: ${process.env.ADMIN_EMAIL ?? "(ADMIN_EMAIL 미설정)"}\n`);
  });
  getCachedInsights().catch(() => {});
}

export default app;
