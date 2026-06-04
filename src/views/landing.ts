import { sharedHead, navbar } from "./layout";
import { ReportMeta } from "../reporter";

export function landingPage(reports: ReportMeta[], isAdmin: boolean): string {
  return `<!DOCTYPE html>
<html lang="ko">
<head>${sharedHead("YouTube 트렌드 리서치", landingCSS)}</head>
<body>
${navbar(isAdmin)}

<!-- Global Insights Banner -->
<section class="insights-banner">
  <div class="container">
    <div class="insights-header">
      <span class="section-label">🌍 Global YouTube Insights</span>
      <span id="insights-updated" style="font-size:.72rem;color:var(--muted)"></span>
    </div>
    <div class="insights-tabs">
      <button class="tab-btn active" onclick="switchTab('global',this)">🌐 글로벌 트렌딩</button>
      <button class="tab-btn" onclick="switchTab('korean',this)">🇰🇷 한국 트렌딩</button>
    </div>
    <div id="insights-loading" class="insight-scroll">
      ${[...Array(6)].map(() => `<div class="insight-skeleton"></div>`).join("")}
    </div>
    <div id="insights-global" class="insight-scroll" style="display:none"></div>
    <div id="insights-korean" class="insight-scroll" style="display:none"></div>
  </div>
</section>

<!-- Report Cards -->
<section class="reports-section">
  <div class="container">
    <div class="reports-header">
      <div>
        <h2 class="reports-title">📊 트렌드 리포트</h2>
        <p style="font-size:.82rem;color:var(--muted);margin-top:4px">${reports.length}개의 분석 리포트</p>
      </div>
      ${isAdmin ? `<a href="/admin" class="btn btn-primary">+ 새 분석</a>` : ""}
    </div>
    ${reports.length
      ? `<div class="report-grid">${reports.map(reportCard).join("")}</div>`
      : emptyState(isAdmin)}
  </div>
</section>

<script>
const TABS = { global: null, korean: null };

async function loadInsights() {
  try {
    const res = await fetch('/api/insights');
    if (!res.ok) throw new Error();
    const data = await res.json();
    TABS.global = data.globalTrending;
    TABS.korean = data.koreanTrending;

    renderInsights('insights-global', data.globalTrending);
    renderInsights('insights-korean', data.koreanTrending);

    document.getElementById('insights-loading').style.display = 'none';
    document.getElementById('insights-global').style.display = 'flex';

    const d = new Date(data.updatedAt);
    document.getElementById('insights-updated').textContent =
      '업데이트 ' + d.toLocaleTimeString('ko-KR', {hour:'2-digit',minute:'2-digit'});
  } catch(e) {
    document.getElementById('insights-loading').innerHTML =
      '<p style="color:var(--muted);font-size:.82rem;padding:8px">인사이트를 불러올 수 없습니다.</p>';
  }
}

function renderInsights(elId, items) {
  const el = document.getElementById(elId);
  el.innerHTML = items.map((v,i) => \`
    <a class="insight-card" href="https://www.youtube.com/watch?v=\${v.videoId}" target="_blank" rel="noopener">
      <div class="insight-thumb"><img src="\${v.thumbnailUrl}" alt="" loading="lazy" /></div>
      <div class="insight-body">
        <span class="insight-rank">\${i+1}</span>
        <p class="insight-title">\${esc(v.title)}</p>
        <p class="insight-channel">\${esc(v.channelTitle)}</p>
        <p class="insight-views">\${fmtNum(v.viewCount)} 조회</p>
      </div>
    </a>\`).join('');
}

function switchTab(tab, btn) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('insights-global').style.display = tab==='global'?'flex':'none';
  document.getElementById('insights-korean').style.display = tab==='korean'?'flex':'none';
}

// Save / Like (localStorage)
function getSaved() {
  try { return JSON.parse(localStorage.getItem('saved_reports')||'[]'); } catch { return []; }
}
function toggleSave(e, id) {
  e.stopPropagation();
  const saved = getSaved();
  const idx = saved.indexOf(id);
  if (idx > -1) saved.splice(idx, 1); else saved.push(id);
  localStorage.setItem('saved_reports', JSON.stringify(saved));
  renderSaveButtons();
}
function renderSaveButtons() {
  const saved = getSaved();
  document.querySelectorAll('.save-btn').forEach(btn => {
    const id = btn.dataset.id;
    btn.textContent = saved.includes(id) ? '♥' : '♡';
    btn.style.color = saved.includes(id) ? 'var(--red)' : 'var(--soft)';
  });
}

function fmtNum(n) {
  if (n >= 100000000) return (n/100000000).toFixed(1)+'억';
  if (n >= 10000) return (n/10000).toFixed(1)+'만';
  return n.toLocaleString();
}
function esc(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

loadInsights();
renderSaveButtons();
</script>
</body>
</html>`;
}

function reportCard(r: ReportMeta): string {
  return `<article class="report-card" onclick="location.href='/report/${r.id}'">
  <div class="card-thumb">
    ${r.topThumbnail ? `<img src="${r.topThumbnail}" alt="" loading="lazy" />` : `<div class="thumb-placeholder">▶</div>`}
    <button class="save-btn" data-id="${r.id}" onclick="toggleSave(event,'${r.id}')">♡</button>
  </div>
  <div class="card-body">
    <div class="card-meta">
      <span class="tag tag-red">${r.keyword}</span>
      <span style="font-size:.72rem;color:var(--muted)">${r.days}일</span>
    </div>
    <p class="card-summary">${r.summarySnippet.slice(0, 120)}…</p>
    <p class="card-date">${new Date(r.generatedAt).toLocaleDateString("ko-KR")}</p>
  </div>
</article>`;
}

function emptyState(isAdmin: boolean): string {
  return `<div class="empty-state">
  <div class="empty-icon">📊</div>
  <p>아직 분석된 리포트가 없습니다.</p>
  ${isAdmin ? `<a href="/admin" class="btn btn-primary" style="margin-top:16px">첫 번째 분석 시작하기</a>` : `<p style="font-size:.82rem;color:var(--muted);margin-top:6px">관리자가 분석을 실행하면 여기에 표시됩니다.</p>`}
</div>`;
}

const landingCSS = `
.insights-banner{background:var(--surface);border-bottom:1px solid var(--border);padding:24px 0 28px}
.insights-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}
.insights-tabs{display:flex;gap:8px;margin-bottom:16px}
.tab-btn{padding:6px 14px;border-radius:20px;border:1px solid var(--border);background:transparent;color:var(--muted);font-size:.8rem;font-weight:600;cursor:pointer;transition:all .2s}
.tab-btn.active{background:var(--grad);color:#fff;border-color:transparent}
.insight-scroll{display:flex;gap:14px;overflow-x:auto;padding-bottom:6px;scrollbar-width:thin;scrollbar-color:#333 transparent}
.insight-skeleton{flex:0 0 160px;height:180px;background:#1e1e1e;border-radius:12px;animation:pulse 1.4s ease-in-out infinite}
@keyframes pulse{0%,100%{opacity:.5}50%{opacity:1}}
.insight-card{flex:0 0 160px;border-radius:12px;overflow:hidden;background:var(--card);border:1px solid var(--border);transition:transform .2s,box-shadow .2s;cursor:pointer}
.insight-card:hover{transform:translateY(-3px);box-shadow:0 8px 30px rgba(255,59,59,.15)}
.insight-thumb{height:90px;overflow:hidden;background:#1a1a1a}
.insight-body{padding:10px}
.insight-rank{font-size:.68rem;font-weight:800;color:var(--red)}
.insight-title{font-size:.75rem;font-weight:600;line-height:1.35;margin:4px 0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.insight-channel{font-size:.7rem;color:var(--muted);margin-bottom:3px}
.insight-views{font-size:.68rem;color:var(--orange);font-weight:700}
.reports-section{padding:36px 0 60px}
.reports-header{display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:24px}
.reports-title{font-size:1.3rem;font-weight:800}
.report-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:20px}
.report-card{background:var(--card);border:1px solid var(--border);border-radius:14px;overflow:hidden;cursor:pointer;transition:transform .2s,box-shadow .2s}
.report-card:hover{transform:translateY(-4px);box-shadow:0 12px 40px rgba(255,59,59,.12)}
.card-thumb{position:relative;height:160px;background:#1a1a1a;overflow:hidden}
.thumb-placeholder{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:2rem;color:var(--border)}
.save-btn{position:absolute;top:10px;right:10px;width:32px;height:32px;border-radius:50%;background:rgba(0,0,0,.7);border:none;font-size:1rem;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--soft);transition:transform .15s}
.save-btn:hover{transform:scale(1.15)}
.card-body{padding:14px 16px 16px}
.card-meta{display:flex;align-items:center;gap:8px;margin-bottom:8px}
.card-summary{font-size:.8rem;color:var(--soft);line-height:1.5;margin-bottom:10px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.card-date{font-size:.72rem;color:var(--muted)}
.empty-state{text-align:center;padding:80px 0;color:var(--muted)}
.empty-icon{font-size:3rem;margin-bottom:16px}
.empty-state p{font-size:.9rem}
`;
