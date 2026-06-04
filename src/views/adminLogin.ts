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
    <p class="login-sub">
      <strong>${process.env.ADMIN_EMAIL ?? "지정된 관리자 계정"}</strong>으로<br/>
      Google 로그인하면 관리자 권한이 부여됩니다.
    </p>
    ${error ? `<div class="login-error">${error}</div>` : ""}
    <a href="/auth/google" class="google-btn">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
      Google로 계속하기
    </a>
    <p class="login-note">관리자 계정이 아닌 경우 일반 사용자로 로그인됩니다.</p>
  </div>
</div>
</body>
</html>`;
}

const loginCSS = `
body{display:flex;align-items:center;justify-content:center;min-height:100vh}
.login-wrap{width:100%;max-width:400px;padding:24px;display:flex;flex-direction:column;align-items:center;gap:28px}
.login-logo{font-weight:800;font-size:1rem;background:linear-gradient(135deg,#ff3b3b,#ff8c00);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.login-card{width:100%;background:var(--card);border:1px solid var(--border);border-radius:16px;padding:32px;display:flex;flex-direction:column;align-items:center;gap:20px;text-align:center}
.login-title{font-size:1.3rem;font-weight:800}
.login-sub{font-size:.85rem;color:var(--muted);line-height:1.6}
.login-sub strong{color:var(--soft)}
.login-error{background:rgba(255,59,59,.12);border:1px solid rgba(255,59,59,.25);color:#ff6b6b;font-size:.82rem;padding:10px 14px;border-radius:8px;width:100%}
.google-btn{display:flex;align-items:center;gap:10px;background:#fff;color:#3c4043;border:none;border-radius:10px;padding:13px 24px;font-size:.9rem;font-weight:600;cursor:pointer;transition:box-shadow .2s;width:100%;justify-content:center}
.google-btn:hover{box-shadow:0 2px 12px rgba(0,0,0,.35)}
.login-note{font-size:.75rem;color:var(--muted)}
`;
