function getCookie(request, name) {
  const cookies = request.headers.get('Cookie') || '';
  const match = cookies.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

async function isAuthenticated(request, env) {
  const token = getCookie(request, 'admin_sessao');
  if (!token) return false;
  const stored = await env.DB.prepare(
    `SELECT valor FROM config WHERE chave = 'admin_session'`
  ).first();
  return stored?.valor === token;
}

function renderLogin(error = '') {
  return new Response(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin — Hoteleiro Rico</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow:wght@300;400;600;700&display=swap" rel="stylesheet">
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    body{background:#080808;color:#F5EFE6;font-family:'Barlow',sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:40px 20px}
    .card{max-width:380px;width:100%;background:#0F0F0F;border:1px solid #1E1E1E;border-top:3px solid #C9A84C;padding:44px 36px}
    .logo{font-family:'Bebas Neue',sans-serif;font-size:11px;letter-spacing:7px;color:#333;margin-bottom:32px;text-align:center}
    .logo span{color:#4a1a1a}
    h1{font-family:'Bebas Neue',sans-serif;font-size:1.8rem;letter-spacing:2px;color:#fff;margin-bottom:6px}
    .sub{font-size:.85rem;color:#555;margin-bottom:28px;font-weight:300}
    .field{display:flex;flex-direction:column;gap:6px;margin-bottom:16px}
    label{font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#444;font-weight:600}
    input{background:#141414;border:1px solid #252525;color:#F5EFE6;font-family:'Barlow',sans-serif;font-size:14px;padding:12px 14px;outline:none;transition:border-color .2s;width:100%}
    input:focus{border-color:rgba(201,168,76,0.4)}
    .btn{width:100%;background:#C9A84C;color:#080808;font-family:'Barlow',sans-serif;font-size:.85rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:14px;border:none;cursor:pointer;margin-top:8px;transition:opacity .18s}
    .btn:hover{opacity:.86}
    .error{background:rgba(196,26,26,0.08);border:1px solid rgba(196,26,26,0.2);color:#d96060;font-size:13px;padding:11px 14px;margin-bottom:18px}
  </style>
</head>
<body>
<div class="card">
  <div class="logo">HOTELEIRO <span>RICO</span></div>
  <h1>Painel Admin</h1>
  <p class="sub">Acesso restrito.</p>
  ${error ? `<div class="error">${error}</div>` : ''}
  <form method="POST">
    <input type="hidden" name="action" value="login">
    <div class="field">
      <label>Senha</label>
      <input type="password" name="senha" placeholder="••••••••" required autofocus>
    </div>
    <button type="submit" class="btn">Entrar →</button>
  </form>
</div>
</body>
</html>`, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
}

function renderDashboard({ ativa, meetLink, usuarios, sessoesAtivas }) {
  const rows = usuarios.map(u => `
    <tr>
      <td>${esc(u.nome)}</td>
      <td>${esc(u.nome_propriedade || '—')}</td>
      <td style="text-align:center">${u.quartos || '—'}</td>
      <td>${esc(u.telefone || '—')}</td>
      <td style="color:#555;font-size:12px">${u.ultimo_login ? u.ultimo_login.slice(0, 16).replace('T',' ') : '—'}</td>
    </tr>`).join('');

  return new Response(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin — Hoteleiro Rico</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow:wght@300;400;600;700&display=swap" rel="stylesheet">
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    body{background:#080808;color:#F5EFE6;font-family:'Barlow',sans-serif;min-height:100vh;padding:0}
    a{color:inherit;text-decoration:none}
    .topbar{background:#0A0A0A;border-bottom:1px solid #171717;padding:0 32px;height:56px;display:flex;align-items:center;justify-content:space-between}
    .topbar-logo{font-family:'Bebas Neue',sans-serif;font-size:13px;letter-spacing:6px;color:#2a2a2a}
    .topbar-logo span{color:#4a1a1a}
    .topbar-right{display:flex;align-items:center;gap:20px}
    .topbar-tag{font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#333}
    .btn-logout{background:none;border:1px solid #222;color:#444;font-family:'Barlow',sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;padding:7px 14px;cursor:pointer;transition:border-color .2s,color .2s}
    .btn-logout:hover{border-color:#444;color:#888}
    .main{max-width:1100px;margin:0 auto;padding:40px 32px}
    .section-title{font-family:'Bebas Neue',sans-serif;font-size:1.1rem;letter-spacing:3px;color:#C9A84C;margin-bottom:20px}
    .cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;margin-bottom:40px}
    .stat-card{background:#0F0F0F;border:1px solid #1A1A1A;padding:20px 24px}
    .stat-label{font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#333;margin-bottom:8px}
    .stat-value{font-family:'Bebas Neue',sans-serif;font-size:2rem;letter-spacing:2px;color:#F5EFE6}
    .stat-value.online{color:#2ECC71}
    .stat-value.offline{color:#444}
    .controls{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:40px}
    @media(max-width:640px){.controls{grid-template-columns:1fr}}
    .control-card{background:#0F0F0F;border:1px solid #1A1A1A;padding:24px}
    .control-card h3{font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#444;margin-bottom:16px}
    .toggle-btn{width:100%;padding:14px;font-family:'Barlow',sans-serif;font-size:.85rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;border:none;cursor:pointer;transition:all .2s}
    .toggle-on{background:#2ECC71;color:#080808}
    .toggle-on:hover{background:#27ae60}
    .toggle-off{background:#C41A1A;color:#fff}
    .toggle-off:hover{background:#E02020}
    .toggle-status{font-size:11px;color:#444;margin-top:10px;text-align:center}
    .meet-form{display:flex;gap:10px}
    .meet-input{flex:1;background:#141414;border:1px solid #252525;color:#F5EFE6;font-family:'Barlow',sans-serif;font-size:13px;padding:11px 14px;outline:none;transition:border-color .2s;min-width:0}
    .meet-input:focus{border-color:rgba(201,168,76,0.4)}
    .meet-input::placeholder{color:#2a2a2a}
    .btn-save{background:#C9A84C;color:#080808;font-family:'Barlow',sans-serif;font-size:.8rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:11px 20px;border:none;cursor:pointer;white-space:nowrap;transition:opacity .18s}
    .btn-save:hover{opacity:.86}
    .current-link{font-size:11px;color:#333;margin-top:10px;word-break:break-all}
    .current-link span{color:#555}
    .table-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}
    .btn-export{background:none;border:1px solid #222;color:#444;font-family:'Barlow',sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;padding:8px 16px;cursor:pointer;text-decoration:none;transition:border-color .2s,color .2s}
    .btn-export:hover{border-color:#C9A84C;color:#C9A84C}
    .table-wrap{overflow-x:auto}
    table{width:100%;border-collapse:collapse;font-size:13px}
    thead tr{border-bottom:1px solid #1A1A1A}
    thead th{text-align:left;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#333;padding:10px 14px;font-weight:600}
    tbody tr{border-bottom:1px solid #111;transition:background .15s}
    tbody tr:hover{background:#0F0F0F}
    tbody td{padding:12px 14px;color:#888;font-weight:300}
    tbody td:first-child{color:#F5EFE6;font-weight:400}
    .empty{padding:40px;text-align:center;color:#2a2a2a;font-size:14px}
  </style>
</head>
<body>
<div class="topbar">
  <div class="topbar-logo">HOTELEIRO <span>RICO</span></div>
  <div class="topbar-right">
    <span class="topbar-tag">Painel Admin</span>
    <form method="POST" style="margin:0">
      <input type="hidden" name="action" value="logout">
      <button type="submit" class="btn-logout">Sair</button>
    </form>
  </div>
</div>

<div class="main">

  <div class="cards">
    <div class="stat-card">
      <div class="stat-label">Status da aula</div>
      <div class="stat-value ${ativa ? 'online' : 'offline'}">${ativa ? 'ONLINE' : 'OFFLINE'}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Sessões ativas hoje</div>
      <div class="stat-value">${sessoesAtivas}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Total de alunos</div>
      <div class="stat-value">${usuarios.length}</div>
    </div>
  </div>

  <div class="controls">
    <div class="control-card">
      <h3>Status da aula</h3>
      <form method="POST">
        <input type="hidden" name="action" value="toggle">
        <button type="submit" class="toggle-btn ${ativa ? 'toggle-off' : 'toggle-on'}">
          ${ativa ? '⏹ Encerrar aula' : '▶ Abrir aula'}
        </button>
      </form>
      <p class="toggle-status">Aula ${ativa ? 'online — clique para encerrar' : 'offline — clique para abrir'}</p>
    </div>

    <div class="control-card">
      <h3>Link do Google Meet</h3>
      <form method="POST" class="meet-form">
        <input type="hidden" name="action" value="meet_link">
        <input type="url" name="meet_link" class="meet-input" value="${esc(meetLink)}" placeholder="https://meet.google.com/xxx-yyyy-zzz" required>
        <button type="submit" class="btn-save">Salvar</button>
      </form>
      <p class="current-link">Atual: <span>${meetLink || 'nenhum link configurado'}</span></p>
    </div>
  </div>

  <div class="table-header">
    <div class="section-title">Alunos cadastrados</div>
    <a href="/admin?export=csv" class="btn-export">Exportar CSV</a>
  </div>
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Nome</th>
          <th>Propriedade</th>
          <th style="text-align:center">Quartos</th>
          <th>WhatsApp</th>
          <th>Último acesso</th>
        </tr>
      </thead>
      <tbody>
        ${rows || `<tr><td colspan="5" class="empty">Nenhum aluno cadastrado ainda.</td></tr>`}
      </tbody>
    </table>
  </div>

</div>
</body>
</html>`, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
}

function esc(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

export async function onRequestGet({ request, env }) {
  if (!await isAuthenticated(request, env)) return renderLogin();

  const url = new URL(request.url);

  // Exportar CSV
  if (url.searchParams.get('export') === 'csv') {
    const { results } = await env.DB.prepare(
      `SELECT nome, telefone, nome_propriedade, quartos, origem, criado_em, ultimo_login FROM usuarios ORDER BY criado_em DESC`
    ).all();
    const header = 'Nome,WhatsApp,Propriedade,Quartos,Origem,Cadastro,Ultimo Acesso\n';
    const body = results.map(u =>
      [u.nome, u.telefone, u.nome_propriedade, u.quartos, u.origem, u.criado_em, u.ultimo_login]
        .map(v => `"${String(v||'').replace(/"/g,'""')}"`)
        .join(',')
    ).join('\n');
    return new Response(header + body, {
      headers: {
        'Content-Type': 'text/csv;charset=UTF-8',
        'Content-Disposition': 'attachment; filename="alunos.csv"'
      }
    });
  }

  const [ativa, meetLink, usuarios, sessoes] = await Promise.all([
    env.DB.prepare(`SELECT valor FROM config WHERE chave = 'aula_ativa'`).first(),
    env.DB.prepare(`SELECT valor FROM config WHERE chave = 'meet_link'`).first(),
    env.DB.prepare(`SELECT * FROM usuarios ORDER BY ultimo_login DESC NULLS LAST`).all(),
    env.DB.prepare(`SELECT COUNT(*) as total FROM sessoes WHERE expira_em > datetime('now')`).first(),
  ]);

  return renderDashboard({
    ativa: ativa?.valor === '1',
    meetLink: meetLink?.valor || '',
    usuarios: usuarios.results,
    sessoesAtivas: sessoes?.total || 0,
  });
}

export async function onRequestPost({ request, env }) {
  const form = await request.formData();
  const action = form.get('action');

  if (action === 'login') {
    const senha = (form.get('senha') || '').trim();
    if (senha !== env.ADMIN_SECRET) return renderLogin('Senha incorreta.');
    const token = crypto.randomUUID();
    await env.DB.prepare(
      `INSERT INTO config (chave, valor) VALUES ('admin_session', ?)
       ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor`
    ).bind(token).run();
    return new Response(null, {
      status: 302,
      headers: {
        'Location': '/admin',
        'Set-Cookie': `admin_sessao=${token}; Path=/admin; HttpOnly; SameSite=Lax`
      }
    });
  }

  if (!await isAuthenticated(request, env)) {
    return new Response(null, { status: 302, headers: { 'Location': '/admin' } });
  }

  if (action === 'toggle') {
    const atual = await env.DB.prepare(`SELECT valor FROM config WHERE chave = 'aula_ativa'`).first();
    const novo = atual?.valor === '1' ? '0' : '1';
    await env.DB.prepare(`UPDATE config SET valor = ? WHERE chave = 'aula_ativa'`).bind(novo).run();
  }

  if (action === 'meet_link') {
    const link = (form.get('meet_link') || '').trim();
    if (link.startsWith('https://meet.google.com/')) {
      await env.DB.prepare(`UPDATE config SET valor = ? WHERE chave = 'meet_link'`).bind(link).run();
    }
  }

  if (action === 'logout') {
    await env.DB.prepare(`DELETE FROM config WHERE chave = 'admin_session'`).run();
    return new Response(null, {
      status: 302,
      headers: {
        'Location': '/admin',
        'Set-Cookie': 'admin_sessao=; Path=/admin; Max-Age=0'
      }
    });
  }

  return new Response(null, { status: 302, headers: { 'Location': '/admin' } });
}
