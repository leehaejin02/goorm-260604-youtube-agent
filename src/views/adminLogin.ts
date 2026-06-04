import { sharedHead } from "./layout";

export function adminLoginPage(error?: string): string {
  return `<!DOCTYPE html>
<html lang="ko">
<head>${sharedHead("관리자 로그인", loginCSS)}</head>
<body>
<div class="login-wrap">
  <a href="/" class="login-logo">▶ YT Trend Research</a>
  <div class="login-card">
    <h1 class="login-title">관리자 로그인</h1>
    <p class="login-sub">트렌드 분석을 실행하려면 로그인하세요.</p>
    ${error ? `<div class="login-error">${error}</div>` : ""}
    <form method="POST" action="/admin/login" class="login-form">
      <label class="field-label">이메일</label>
      <input type="email" name="email" class="field-input" placeholder="admin@example.com" required autocomplete="email" />
      <label class="field-label" style="margin-top:16px">비밀번호</label>
      <input type="password" name="password" class="field-input" placeholder="••••••••" required autocomplete="current-password" />
      <button type="submit" class="btn btn-primary login-btn">로그인</button>
    </form>
  </div>
</div>
</body>
</html>`;
}

const loginCSS = `
body{display:flex;align-items:center;justify-content:center;min-height:100vh}
.login-wrap{width:100%;max-width:400px;padding:24px;display:flex;flex-direction:column;align-items:center;gap:28px}
.login-logo{font-weight:800;font-size:1rem;background:linear-gradient(135deg,#ff3b3b,#ff8c00);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.login-card{width:100%;background:var(--card);border:1px solid var(--border);border-radius:16px;padding:32px}
.login-title{font-size:1.3rem;font-weight:800;margin-bottom:6px}
.login-sub{font-size:.82rem;color:var(--muted);margin-bottom:24px}
.login-error{background:rgba(255,59,59,.12);border:1px solid rgba(255,59,59,.25);color:#ff6b6b;font-size:.82rem;padding:10px 14px;border-radius:8px;margin-bottom:16px}
.login-form{display:flex;flex-direction:column}
.field-label{font-size:.78rem;font-weight:600;color:var(--soft);margin-bottom:6px}
.field-input{background:#1a1a1a;border:1px solid var(--border);border-radius:8px;padding:11px 14px;color:var(--text);font-size:.9rem;outline:none;transition:border-color .2s}
.field-input:focus{border-color:var(--red)}
.login-btn{margin-top:24px;padding:13px;font-size:.9rem;border-radius:10px;justify-content:center;width:100%}
`;
