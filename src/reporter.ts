import fs from "fs";
import path from "path";
import { TrendReport } from "./types";

function formatNumber(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}만`;
  return n.toLocaleString();
}

export function buildMarkdownReport(report: TrendReport): string {
  const date = report.generatedAt.slice(0, 10);

  const tableRows = report.topVideos
    .map(
      (v, i) =>
        `| ${i + 1} | ${v.title.slice(0, 40)} | ${v.channelTitle} | ${formatNumber(v.viewCount)} | ${v.publishedAt.slice(0, 10)} | ${v.trendingScore.toLocaleString()} ${v.trendingLabel} |`
    )
    .join("\n");

  return `# YouTube 트렌드 리포트
생성일: ${date} | 분석 키워드: ${report.keyword}

## 📊 상위 영상 분석 (Top 10)

| 순위 | 제목 | 채널 | 조회수 | 게시일 | 급상승 스코어 |
|------|------|------|-------|--------|-------------|
${tableRows}

---

## 🔥 트렌드 분석 (by OpenAI)

${report.trendSummary}

---
*생성: ${report.generatedAt}*
`;
}

export function saveReport(report: TrendReport): string {
  const reportsDir = path.resolve(process.cwd(), "reports");
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const filename = `trend_${report.keyword.replace(/\s+/g, "_")}_${report.generatedAt.slice(0, 10)}.md`;
  const filepath = path.join(reportsDir, filename);

  const markdown = buildMarkdownReport(report);
  fs.writeFileSync(filepath, markdown, "utf-8");

  return filepath;
}
