import { sharedHead, navbar } from "./layout";
import { ReportMeta } from "../reporter";
import type { UserInfo } from "../types";

export function adminDashboardPage(reports: ReportMeta[], user: UserInfo): string {
  return `<!DOCTYPE html>
<html lang="ko">
<head>${sharedHead("관리자 대시보드", dashCSS)}</head>
<body>
${navbar(user)}

<div class="container dash-wrap">

  <!-- Analyzer Panel -->
  <section class="panel">
    <h2 class="panel-title">🔍 새 트렌드 분석</h2>
    <div class="analyze-form">
      <input type="text" id="keyword" class="field-input" placeholder="키워드 입력 (예: AI, 챗GPT)" />
      <div class="days-row">
        <span class="field-label">수집 기간</span>
        <label class="radio-label"><input type="radio" name="days" value="3" /> 3일</label>
        <label class="radio-label"><input type="radio" name="days" value="7" checked /> 7일</label>
        <label class="radio-label"><input type="radio" name="days" value="30" /> 30일</label>
      </div>
      <button id="runBtn" class="btn btn-primary run-btn" onclick="runAnalysis()">▶ 분석 시작</button>
    </div>
    <div id="progress" class="progress-box" style="display:none">
      <div class="progress-spinner"></div>
      <p id="progressText" class="progress-text">준비 중...</p>
      <a id="reportLink" href="#" class="btn btn-primary report-link-btn" style="display:none" target="_blank">리포트 보기 →</a>
    </div>
  </section>

  <!-- Reports Table -->
  <section class="panel">
    <h2 class="panel-title">📋 저장된 리포트 (${reports.length}개)</h2>
    ${reports.length
      ? `<div class="report-table-wrap">
          <table class="report-table">
            <thead><tr><th>키워드</th><th>기간</th><th>생성일</th><th></th></tr></thead>
            <tbody>
              ${reports.map(r => `
              <tr>
                <td><span class="tag tag-red">${r.keyword}</span></td>
                <td style="color:var(--muted)">${r.days}일</td>
                <td style="color:var(--muted)">${new Date(r.generatedAt).toLocaleDateString("ko-KR")}</td>
                <td><a href="/report/${r.id}" class="btn btn-ghost" style="padding:4px 12px">보기</a></td>
              </tr>`).join("")}
            </tbody>
          </table>
         </div>`
      : `<p class="empty-note">아직 분석 결과가 없습니다. 위에서 분석을 실행하세요.</p>`}
  </section>
</div>

<script>
async function runAnalysis() {
  const keyword = document.getElementById('keyword').value.trim();
  if (!keyword) { alert('키워드를 입력하세요.'); return; }
  const days = document.querySelector('input[name="days"]:checked').value;

  const btn = document.getElementById('runBtn');
  const progress = document.getElementById('progress');
  const progressText = document.getElementById('progressText');
  const reportLink = document.getElementById('reportLink');

  btn.disabled = true;
  progress.style.display = 'flex';
  reportLink.style.display = 'none';
  progressText.textContent = '분석 시작...';

  try {
    const res = await fetch('/admin/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyword, days: parseInt(days) }),
    });

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split('\\n');
      buf = lines.pop() || '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = JSON.parse(line.slice(6));
        if (data.status) progressText.textContent = data.status;
        if (data.reportId) {
          reportLink.href = '/report/' + data.reportId;
          reportLink.style.display = 'inline-flex';
          setTimeout(() => location.reload(), 3000);
        }
      }
    }
  } catch(e) {
    progressText.textContent = '❌ 오류: ' + e.message;
  } finally {
    btn.disabled = false;
  }
}
document.getElementById('keyword').addEventListener('keydown', e => {
  if (e.key === 'Enter') runAnalysis();
});
</script>
</body>
</html>`;
}

const dashCSS = `
.dash-wrap{padding:36px 28px;display:flex;flex-direction:column;gap:28px}
.panel{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:28px}
.panel-title{font-size:1.05rem;font-weight:700;margin-bottom:20px}
.analyze-form{display:flex;flex-direction:column;gap:14px}
.field-input{background:#1a1a1a;border:1px solid var(--border);border-radius:8px;padding:11px 14px;color:var(--text);font-size:.9rem;outline:none;transition:border-color .2s;width:100%}
.field-input:focus{border-color:var(--red)}
.field-label{font-size:.78rem;font-weight:600;color:var(--soft)}
.days-row{display:flex;align-items:center;gap:16px;flex-wrap:wrap}
.radio-label{display:flex;align-items:center;gap:5px;font-size:.82rem;color:var(--soft);cursor:pointer}
.radio-label input{accent-color:var(--red)}
.run-btn{width:fit-content;padding:11px 28px}
.progress-box{display:flex;align-items:center;gap:14px;background:#1a1a1a;border:1px solid var(--border);border-radius:10px;padding:16px;margin-top:4px;flex-wrap:wrap}
.progress-spinner{width:18px;height:18px;border:2px solid var(--border);border-top-color:var(--red);border-radius:50%;animation:spin .8s linear infinite;flex-shrink:0}
@keyframes spin{to{transform:rotate(360deg)}}
.progress-text{font-size:.85rem;color:var(--soft);flex:1}
.report-link-btn{padding:7px 16px}
.report-table-wrap{overflow-x:auto}
.report-table{width:100%;border-collapse:collapse;font-size:.85rem}
.report-table th{text-align:left;color:var(--muted);font-size:.75rem;font-weight:600;padding:8px 12px;border-bottom:1px solid var(--border)}
.report-table td{padding:10px 12px;border-bottom:1px solid #1a1a1a;vertical-align:middle}
.report-table tr:last-child td{border-bottom:none}
.empty-note{font-size:.85rem;color:var(--muted);text-align:center;padding:20px 0}
`;
