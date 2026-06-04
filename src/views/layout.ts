import type { UserInfo } from "../types";

export function sharedHead(title: string, extraCSS = ""): string {
  return `<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title} — YT Trend</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  :root{
    --bg:#080808;--surface:#111;--card:#161616;--border:#242424;
    --text:#f0f0f0;--muted:#777;--soft:#aaa;
    --red:#ff3b3b;--orange:#ff8c00;
    --grad:linear-gradient(135deg,#ff3b3b,#ff8c00);
  }
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:var(--bg);color:var(--text);min-height:100vh}
  a{color:inherit;text-decoration:none}
  img{display:block;width:100%;height:100%;object-fit:cover}
  nav{
    position:sticky;top:0;z-index:200;
    background:rgba(8,8,8,.9);backdrop-filter:blur(16px);
    border-bottom:1px solid var(--border);
    height:56px;display:flex;align-items:center;justify-content:space-between;
    padding:0 28px;gap:16px;
  }
  .logo{font-weight:800;font-size:1rem;background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent;white-space:nowrap}
  .nav-links{display:flex;gap:24px;font-size:.85rem;color:var(--muted)}
  .nav-links a:hover{color:var(--text)}
  .nav-right{display:flex;gap:8px;align-items:center;flex-shrink:0}
  .btn{display:inline-flex;align-items:center;gap:6px;padding:7px 14px;border-radius:8px;font-size:.82rem;font-weight:600;cursor:pointer;border:none;transition:opacity .2s,transform .15s;white-space:nowrap}
  .btn:active{transform:scale(.97)}
  .btn-ghost{background:transparent;border:1px solid var(--border);color:var(--soft)}
  .btn-ghost:hover{border-color:var(--red);color:var(--red)}
  .btn-primary{background:var(--grad);color:#fff}
  .btn-primary:hover{opacity:.85}
  .btn-primary:disabled{opacity:.4;cursor:not-allowed}
  .btn-google{background:#fff;color:#3c4043;border:1px solid #dadce0;border-radius:8px;padding:7px 14px;font-size:.82rem;font-weight:600;display:inline-flex;align-items:center;gap:8px;cursor:pointer;transition:box-shadow .2s}
  .btn-google:hover{box-shadow:0 2px 8px rgba(0,0,0,.3)}
  .user-chip{display:flex;align-items:center;gap:8px;padding:4px 10px;border-radius:20px;background:var(--card);border:1px solid var(--border)}
  .user-avatar{width:24px;height:24px;border-radius:50%;object-fit:cover;flex-shrink:0}
  .user-name{font-size:.78rem;color:var(--soft);max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .admin-badge{background:rgba(255,59,59,.1);border-color:rgba(255,59,59,.3);color:var(--red)}
  .container{max-width:1200px;margin:0 auto;padding:0 28px}
  .section-label{font-size:.72rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:12px}
  .tag{display:inline-block;padding:3px 10px;border-radius:20px;font-size:.72rem;font-weight:700}
  .tag-red{background:rgba(255,59,59,.12);color:var(--red);border:1px solid rgba(255,59,59,.25)}
  .tag-orange{background:rgba(255,140,0,.12);color:var(--orange);border:1px solid rgba(255,140,0,.25)}
  .tag-gray{background:rgba(255,255,255,.07);color:var(--soft);border:1px solid var(--border)}
  ${extraCSS}
</style>`;
}

const googleIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>`;

export function navbar(user: UserInfo | null): string {
  return `<nav>
  <a href="/" class="logo">▶ YT Trend Research</a>
  <div class="nav-links"><a href="/">리포트</a></div>
  <div class="nav-right">
    ${user ? loggedInNav(user) : guestNav()}
  </div>
</nav>`;
}

function guestNav(): string {
  return `<a href="/auth/google" class="btn-google">${googleIcon}Google로 로그인</a>`;
}

function loggedInNav(user: UserInfo): string {
  return `
    ${user.isAdmin ? `<a href="/admin" class="btn admin-badge">⚙ 관리자</a>` : ""}
    <div class="user-chip">
      ${user.picture ? `<img src="${user.picture}" class="user-avatar" alt="${user.name}" />` : ""}
      <span class="user-name">${user.name}</span>
    </div>
    <form method="POST" action="/auth/logout" style="margin:0">
      <button class="btn btn-ghost" type="submit">로그아웃</button>
    </form>`;
}
