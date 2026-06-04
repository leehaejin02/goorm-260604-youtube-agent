import { sharedHead, navbar } from "./layout";
import { TrendReport } from "../types";

export function reportDetailPage(report: TrendReport, isAdmin: boolean): string {
  const date = new Date(report.generatedAt).toLocaleDateString("ko-KR", {
    year: "numeric", month: "long", day: "numeric",
  });

  return `<!DOCTYPE html>
<html lang="ko">
<head>${sharedHead(report.keyword + " 트렌드", detailCSS)}</head>
<body>
${navbar(isAdmin)}

<div class="report-hero">
  <div class="container">
    <a href="/" class="back-link">← 리포트 목록</a>
    <div class="hero-meta">
      <span class="tag tag-red">${report.keyword}</span>
      <span class="tag tag-gray">최근 ${report.days}일</span>
      <button class="save-btn-hero" id="saveBtnHero" onclick="toggleSave()">♡ 찜하기</button>
    </div>
    <h1 class="hero-title">"${report.keyword}" 트렌드 리포트</h1>
    <p class="hero-date">${date} 생성</p>
  </div>
</div>

<!-- Trend Summary -->
<section class="summary-section">
  <div class="container">
    <h2 class="section-label">🔥 트렌드 분석 (by OpenAI)</h2>
    <div class="summary-card">
      <div class="summary-body">${formatSummary(report.trendSummary)}</div>
    </div>
  </div>
</section>

<!-- Top 10 Videos -->
<section class="videos-section">
  <div class="container">
    <h2 class="section-label">📊 상위 영상 분석 (Top ${report.topVideos.length})</h2>
    <div class="video-grid">
      ${report.topVideos.map((v, i) => `
      <a class="video-card" href="https://www.youtube.com/watch?v=${v.videoId}" target="_blank" rel="noopener">
        <div class="video-thumb">
          ${v.thumbnailUrl
            ? `<img src="${v.thumbnailUrl}" alt="" loading="lazy" />`
            : `<div class="thumb-fallback">▶</div>`}
          <span class="video-rank">${i + 1}</span>
          <span class="video-label-badge">${v.trendingLabel}</span>
        </div>
        <div class="video-info">
          <p class="video-title">${esc(v.title)}</p>
          <p class="video-channel">${esc(v.channelTitle)}</p>
          <div class="video-stats">
            <span>👁 ${fmt(v.viewCount)}</span>
            <span>👍 ${fmt(v.likeCount)}</span>
            <span class="trending-score">⚡ ${v.trendingScore.toLocaleString()}/h</span>
          </div>
          <p class="video-date">${v.publishedAt.slice(0, 10)}</p>
        </div>
      </a>`).join("")}
    </div>
  </div>
</section>

<script>
const REPORT_ID = '${report.id}';
function getSaved(){try{return JSON.parse(localStorage.getItem('saved_reports')||'[]')}catch{return[]}}
function toggleSave(){
  const saved=getSaved();const idx=saved.indexOf(REPORT_ID);
  if(idx>-1)saved.splice(idx,1);else saved.push(REPORT_ID);
  localStorage.setItem('saved_reports',JSON.stringify(saved));
  renderBtn();
}
function renderBtn(){
  const saved=getSaved();const btn=document.getElementById('saveBtnHero');
  if(!btn)return;
  btn.textContent=saved.includes(REPORT_ID)?'♥ 찜됨':'♡ 찜하기';
  btn.style.borderColor=saved.includes(REPORT_ID)?'var(--red)':'var(--border)';
  btn.style.color=saved.includes(REPORT_ID)?'var(--red)':'var(--soft)';
}
renderBtn();
</script>
</body>
</html>`;
}

function formatSummary(text: string): string {
  return text
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/^#{1,3}\s+(.+)$/gm, "<h3 class='sum-heading'>$1</h3>")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br/>")
    .replace(/^/, "<p>")
    .replace(/$/, "</p>");
}

function esc(s: string): string {
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

function fmt(n: number): string {
  if (n >= 100000000) return (n / 100000000).toFixed(1) + "억";
  if (n >= 10000) return (n / 10000).toFixed(1) + "만";
  return n.toLocaleString();
}

const detailCSS = `
.report-hero{background:var(--surface);border-bottom:1px solid var(--border);padding:28px 0 32px}
.back-link{font-size:.82rem;color:var(--muted);display:inline-block;margin-bottom:16px;transition:color .2s}
.back-link:hover{color:var(--red)}
.hero-meta{display:flex;align-items:center;gap:10px;margin-bottom:12px;flex-wrap:wrap}
.hero-title{font-size:2rem;font-weight:800;margin-bottom:6px;line-height:1.2}
.hero-date{font-size:.82rem;color:var(--muted)}
.save-btn-hero{margin-left:auto;padding:6px 16px;border-radius:20px;background:transparent;border:1px solid var(--border);color:var(--soft);font-size:.82rem;font-weight:700;cursor:pointer;transition:all .2s}
.save-btn-hero:hover{border-color:var(--red);color:var(--red)}
.summary-section{padding:32px 0}
.summary-card{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:28px 32px}
.summary-body{font-size:.9rem;line-height:1.8;color:var(--soft)}
.summary-body .sum-heading{font-size:1rem;font-weight:700;color:var(--text);margin:18px 0 8px}
.summary-body strong{color:var(--text)}
.summary-body p{margin-bottom:10px}
.videos-section{padding:0 0 60px}
.video-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:18px}
.video-card{display:block;background:var(--card);border:1px solid var(--border);border-radius:12px;overflow:hidden;transition:transform .2s,box-shadow .2s}
.video-card:hover{transform:translateY(-3px);box-shadow:0 10px 32px rgba(255,59,59,.12)}
.video-thumb{position:relative;height:158px;background:#1a1a1a;overflow:hidden}
.thumb-fallback{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:2rem;color:var(--border)}
.video-rank{position:absolute;top:8px;left:10px;font-size:.75rem;font-weight:800;background:rgba(0,0,0,.8);color:#fff;padding:2px 8px;border-radius:4px}
.video-label-badge{position:absolute;bottom:8px;right:8px;font-size:.7rem;background:rgba(0,0,0,.8);padding:2px 8px;border-radius:4px}
.video-info{padding:12px 14px 14px}
.video-title{font-size:.85rem;font-weight:600;line-height:1.4;margin-bottom:6px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.video-channel{font-size:.75rem;color:var(--muted);margin-bottom:8px}
.video-stats{display:flex;gap:12px;font-size:.72rem;color:var(--soft);margin-bottom:6px;flex-wrap:wrap}
.trending-score{color:var(--orange);font-weight:700}
.video-date{font-size:.7rem;color:var(--muted)}
`;
