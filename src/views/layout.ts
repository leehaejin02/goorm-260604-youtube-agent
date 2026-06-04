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
    padding:0 28px;
  }
  .logo{font-weight:800;font-size:1rem;background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
  .nav-links{display:flex;gap:24px;font-size:.85rem;color:var(--muted)}
  .nav-links a:hover{color:var(--text)}
  .nav-right{display:flex;gap:10px;align-items:center}
  .btn{display:inline-flex;align-items:center;gap:6px;padding:7px 16px;border-radius:8px;font-size:.82rem;font-weight:600;cursor:pointer;border:none;transition:opacity .2s,transform .15s}
  .btn:active{transform:scale(.97)}
  .btn-ghost{background:transparent;border:1px solid var(--border);color:var(--soft)}
  .btn-ghost:hover{border-color:var(--red);color:var(--red)}
  .btn-primary{background:var(--grad);color:#fff}
  .btn-primary:hover{opacity:.85}
  .btn-primary:disabled{opacity:.4;cursor:not-allowed}
  .container{max-width:1200px;margin:0 auto;padding:0 28px}
  .section-label{font-size:.72rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:12px}
  .tag{display:inline-block;padding:3px 10px;border-radius:20px;font-size:.72rem;font-weight:700}
  .tag-red{background:rgba(255,59,59,.12);color:var(--red);border:1px solid rgba(255,59,59,.25)}
  .tag-orange{background:rgba(255,140,0,.12);color:var(--orange);border:1px solid rgba(255,140,0,.25)}
  .tag-gray{background:rgba(255,255,255,.07);color:var(--soft);border:1px solid var(--border)}
  ${extraCSS}
</style>`;
}

export function navbar(isAdmin = false): string {
  return `<nav>
  <a href="/" class="logo">▶ YT Trend Research</a>
  <div class="nav-links"><a href="/">리포트</a></div>
  <div class="nav-right">
    ${isAdmin
      ? `<span style="font-size:.78rem;color:var(--muted)">관리자</span>
         <form method="POST" action="/admin/logout" style="margin:0">
           <button class="btn btn-ghost" type="submit">로그아웃</button>
         </form>`
      : `<a href="/admin/login" class="btn btn-ghost">관리자 로그인</a>`}
  </div>
</nav>`;
}
