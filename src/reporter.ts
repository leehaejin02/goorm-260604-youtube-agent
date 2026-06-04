import fs from "fs";
import path from "path";
import { TrendReport } from "./types";

// Vercel 서버리스는 /tmp 외 파일시스템이 읽기 전용
const BASE = process.env.VERCEL ? "/tmp" : process.cwd();
const DATA_DIR = path.join(BASE, "reports", "data");
const MD_DIR = path.join(BASE, "reports");

export interface ReportMeta {
  id: string;
  keyword: string;
  days: number;
  generatedAt: string;
  topThumbnail: string;
  summarySnippet: string;
}

function ensureDirs() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

export function saveReport(report: TrendReport): void {
  ensureDirs();

  fs.writeFileSync(
    path.join(DATA_DIR, `${report.id}.json`),
    JSON.stringify(report, null, 2),
    "utf-8"
  );

  const indexPath = path.join(DATA_DIR, "index.json");
  let index: ReportMeta[] = fs.existsSync(indexPath)
    ? JSON.parse(fs.readFileSync(indexPath, "utf-8"))
    : [];

  index = index.filter((m) => m.id !== report.id);
  index.unshift({
    id: report.id,
    keyword: report.keyword,
    days: report.days,
    generatedAt: report.generatedAt,
    topThumbnail: report.topVideos[0]?.thumbnailUrl ?? "",
    summarySnippet: report.trendSummary.replace(/[#*`]/g, "").slice(0, 160),
  });

  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2), "utf-8");

  // Markdown 파일도 유지
  const date = report.generatedAt.slice(0, 10);
  fs.writeFileSync(
    path.join(MD_DIR, `trend_${report.keyword.replace(/\s+/g, "_")}_${date}.md`),
    buildMarkdownReport(report),
    "utf-8"
  );
}

export function getAllReports(): ReportMeta[] {
  ensureDirs();
  const indexPath = path.join(DATA_DIR, "index.json");
  if (!fs.existsSync(indexPath)) return [];
  return JSON.parse(fs.readFileSync(indexPath, "utf-8"));
}

export function getReportById(id: string): TrendReport | null {
  ensureDirs();
  const p = path.join(DATA_DIR, `${id}.json`);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf-8"));
}

export function buildMarkdownReport(report: TrendReport): string {
  const date = report.generatedAt.slice(0, 10);
  const rows = report.topVideos
    .map(
      (v, i) =>
        `| ${i + 1} | ${v.title.slice(0, 40)} | ${v.channelTitle} | ${fmt(v.viewCount)} | ${v.publishedAt.slice(0, 10)} | ${v.trendingScore.toLocaleString()} ${v.trendingLabel} |`
    )
    .join("\n");

  return `# YouTube 트렌드 리포트
생성일: ${date} | 분석 키워드: ${report.keyword}

## 📊 상위 영상 분석 (Top 10)

| 순위 | 제목 | 채널 | 조회수 | 게시일 | 급상승 스코어 |
|------|------|------|-------|--------|-------------|
${rows}

---

## 🔥 트렌드 분석 (by OpenAI)

${report.trendSummary}

---
*생성: ${report.generatedAt}*
`;
}

function fmt(n: number): string {
  return n >= 10000 ? `${(n / 10000).toFixed(1)}만` : n.toLocaleString();
}
