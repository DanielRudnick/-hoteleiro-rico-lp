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
  <link href="https://fonts.googleapis.com/css2?family=Anton&family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    body{background:#080808;color:#F5EFE6;font-family:'Poppins',sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:40px 20px}
    .card{max-width:380px;width:100%;background:#0F0F0F;border:1px solid #1E1E1E;border-top:3px solid #C9A84C;padding:44px 36px}
    .logo{font-family:'Anton',sans-serif;font-size:11px;letter-spacing:7px;color:#666;margin-bottom:32px;text-align:center}
    .logo span{color:#4a1a1a}
    h1{font-family:'Anton',sans-serif;font-size:1.8rem;letter-spacing:2px;color:#fff;margin-bottom:6px}
    .sub{font-size:.85rem;color:#888;margin-bottom:28px;font-weight:300}
    .field{display:flex;flex-direction:column;gap:6px;margin-bottom:16px}
    label{font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#777;font-weight:600}
    input{background:#141414;border:1px solid #252525;color:#F5EFE6;font-family:'Poppins',sans-serif;font-size:14px;padding:12px 14px;outline:none;transition:border-color .2s;width:100%}
    input:focus{border-color:rgba(201,168,76,0.4)}
    .btn{width:100%;background:#C9A84C;color:#080808;font-family:'Poppins',sans-serif;font-size:.85rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:14px;border:none;cursor:pointer;margin-top:8px;transition:opacity .18s}
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

function fmtDate(iso) {
  if (!iso) return '—';
  const d = iso.slice(0, 16).replace('T', ' ');
  // BRT = UTC-3
  return d;
}

function fmtDuration(start, end) {
  if (!start || !end) return '—';
  try {
    const ms = new Date(end.replace(' ', 'T') + 'Z') - new Date(start.replace(' ', 'T') + 'Z');
    const min = Math.round(ms / 60000);
    if (min < 60) return `${min}min`;
    return `${Math.floor(min / 60)}h${min % 60 ? String(min % 60).padStart(2, '0') + 'min' : ''}`;
  } catch { return '—'; }
}

function renderDashboard({ ativa, meetLink, usuarios, sessoesAtivas, aulas, ranking }) {
  const rows = usuarios.map(u => `
    <tr>
      <td>${esc(u.nome)}</td>
      <td>${esc(u.nome_propriedade || '—')}</td>
      <td style="text-align:center">${u.quartos || '—'}</td>
      <td>${esc(u.telefone || '—')}</td>
      <td style="color:#888;font-size:12px">${fmtDate(u.ultimo_login)}</td>
    </tr>`).join('');

  const aulasRows = aulas.length ? aulas.map((a, i) => `
    <tr>
      <td style="font-family:'Anton',sans-serif;letter-spacing:1px;color:#555">#${a.id}</td>
      <td style="color:#F5EFE6">${esc(a.titulo || `Aula ${a.id}`)}</td>
      <td style="font-size:12px">${fmtDate(a.started_at)}</td>
      <td style="font-size:12px">${a.status === 'live' ? '<span style="color:#2ECC71;font-size:11px;letter-spacing:2px">● LIVE</span>' : fmtDate(a.ended_at)}</td>
      <td>${a.status === 'live' ? '—' : fmtDuration(a.started_at, a.ended_at)}</td>
      <td style="text-align:center;font-family:'Anton',sans-serif;font-size:1.1rem;letter-spacing:1px;color:#F5EFE6">${a.alunos ?? 0}</td>
    </tr>`).join('')
    : `<tr><td colspan="6" class="empty">Nenhuma aula registrada ainda.</td></tr>`;

  const rankingRows = ranking.length ? ranking.map((u, i) => `
    <tr>
      <td style="font-family:'Anton',sans-serif;letter-spacing:1px;color:${i < 3 ? '#C9A84C' : '#555'}">#${i + 1}</td>
      <td style="color:#F5EFE6">${esc(u.nome)}</td>
      <td>${esc(u.nome_propriedade || '—')}</td>
      <td>${esc(u.telefone || '—')}</td>
      <td style="text-align:center;font-family:'Anton',sans-serif;font-size:1.2rem;letter-spacing:1px;color:${i < 3 ? '#C9A84C' : '#F5EFE6'}">${u.aulas_assistidas}</td>
    </tr>`).join('')
    : `<tr><td colspan="5" class="empty">Nenhum dado de frequência ainda.</td></tr>`;

  return new Response(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin — Hoteleiro Rico</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Anton&family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    body{background:#0A0A0A;color:#F5EFE6;font-family:'Poppins',sans-serif;min-height:100vh}
    a{color:inherit;text-decoration:none}
    .topbar{background:#0A0A0A;border-bottom:1px solid #1A1A1A;padding:0 32px;height:56px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100}
    .topbar-logo{font-family:'Anton',sans-serif;font-size:14px;letter-spacing:6px;color:#F5EFE6}
    .topbar-logo span{color:#C41A1A}
    .topbar-right{display:flex;align-items:center;gap:24px}
    .topbar-tag{font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#C9A84C;font-weight:600}
    .topbar-link{font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#F5EFE6;font-weight:500;transition:color .2s}
    .topbar-link:hover{color:#C9A84C}
    .btn-logout{background:none;border:1px solid rgba(245,239,230,0.2);color:#F5EFE6;font-family:'Poppins',sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;padding:7px 16px;cursor:pointer;font-weight:600;transition:all .2s}
    .btn-logout:hover{border-color:#C9A84C;color:#C9A84C}
    .main{max-width:1100px;margin:0 auto;padding:40px 32px}
    .section-title{font-family:'Anton',sans-serif;font-size:1.2rem;letter-spacing:4px;color:#C9A84C;margin-bottom:20px;text-transform:uppercase}
    .cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;margin-bottom:40px}
    .stat-card{background:#111;border:1px solid #1E1E1E;border-top:2px solid #C9A84C;padding:22px 24px}
    .stat-label{font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#C9A84C;margin-bottom:10px;font-weight:600}
    .stat-value{font-family:'Anton',sans-serif;font-size:2.4rem;letter-spacing:2px;color:#F5EFE6}
    .stat-value.online{color:#2ECC71}
    .stat-value.offline{color:#F5EFE6}
    .controls{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:40px}
    @media(max-width:640px){.controls{grid-template-columns:1fr}.topbar{padding:0 16px}.main{padding:24px 16px}}
    .control-card{background:#111;border:1px solid #1E1E1E;padding:24px}
    .control-card h3{font-family:'Anton',sans-serif;font-size:11px;letter-spacing:4px;text-transform:uppercase;color:#C9A84C;margin-bottom:16px}
    .toggle-btn{width:100%;padding:16px;font-family:'Poppins',sans-serif;font-size:.85rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;border:none;cursor:pointer;transition:all .2s}
    .toggle-on{background:#2ECC71;color:#080808}
    .toggle-on:hover{background:#27ae60}
    .toggle-off{background:#C41A1A;color:#fff}
    .toggle-off:hover{background:#E02020}
    .toggle-status{font-size:12px;color:#F5EFE6;margin-top:10px;text-align:center;font-weight:300}
    .meet-form{display:flex;gap:10px}
    .meet-input{flex:1;background:#0A0A0A;border:1px solid #2A2A2A;color:#F5EFE6;font-family:'Poppins',sans-serif;font-size:13px;padding:12px 14px;outline:none;transition:border-color .2s;min-width:0}
    .meet-input:focus{border-color:#C9A84C}
    .meet-input::placeholder{color:#555}
    .btn-save{background:#C9A84C;color:#080808;font-family:'Poppins',sans-serif;font-size:.82rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:12px 20px;border:none;cursor:pointer;white-space:nowrap;transition:opacity .18s}
    .btn-save:hover{opacity:.85}
    .current-link{font-size:12px;color:#F5EFE6;margin-top:10px;word-break:break-all;font-weight:300}
    .current-link span{color:#C9A84C;font-weight:500}
    .table-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}
    .btn-export{background:none;border:1px solid rgba(245,239,230,0.2);color:#F5EFE6;font-family:'Poppins',sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;padding:8px 16px;cursor:pointer;font-weight:600;text-decoration:none;transition:all .2s}
    .btn-export:hover{border-color:#C9A84C;color:#C9A84C}
    .table-wrap{overflow-x:auto;margin-bottom:48px;border:1px solid #1E1E1E}
    table{width:100%;border-collapse:collapse;font-size:13px}
    thead tr{background:#111;border-bottom:1px solid #1E1E1E}
    thead th{text-align:left;font-family:'Anton',sans-serif;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#C9A84C;padding:13px 16px;font-weight:400;white-space:nowrap}
    tbody tr{border-bottom:1px solid #161616;transition:background .15s}
    tbody tr:hover{background:#111}
    tbody td{padding:14px 16px;color:#F5EFE6;font-weight:400}
    tbody td:first-child{font-weight:600}
    .empty{padding:48px;text-align:center;color:#F5EFE6;font-size:13px;font-weight:300;opacity:.4}
    .section-sep{border:none;border-top:1px solid #1A1A1A;margin:0 0 40px}
    .nav-links{display:flex;gap:8px}
  </style>
</head>
<body>
<div class="topbar">
  <div class="topbar-logo">HOTELEIRO <span>RICO</span></div>
  <div class="topbar-right">
    <div class="nav-links">
      <a href="/admin/links" class="topbar-link">Links UTM</a>
    </div>
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
    <div class="stat-card">
      <div class="stat-label">Total de aulas</div>
      <div class="stat-value">${aulas.length}</div>
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

  <hr class="section-sep">

  <!-- Histórico de Aulas -->
  <div class="section-title">Histórico de Aulas</div>
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Título</th>
          <th>Início</th>
          <th>Encerramento</th>
          <th>Duração</th>
          <th style="text-align:center">Alunos</th>
        </tr>
      </thead>
      <tbody>${aulasRows}</tbody>
    </table>
  </div>

  <!-- Ranking de Alunos -->
  <div class="section-title">Ranking de Frequência</div>
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Nome</th>
          <th>Propriedade</th>
          <th>WhatsApp</th>
          <th style="text-align:center">Aulas assistidas</th>
        </tr>
      </thead>
      <tbody>${rankingRows}</tbody>
    </table>
  </div>

  <hr class="section-sep">

  <!-- Alunos cadastrados -->
  <div class="table-header">
    <div class="section-title" style="margin-bottom:0">Alunos cadastrados</div>
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

  // Fetch aula history and student ranking — graceful fallback if table not yet migrated
  let aulas = [], ranking = [];
  try {
    const r = await env.DB.prepare(
      `SELECT a.id, a.titulo, a.started_at, a.ended_at, a.status,
              COUNT(s.id) as alunos
       FROM aulas a
       LEFT JOIN sessoes s ON s.aula_id = a.id
       GROUP BY a.id
       ORDER BY a.started_at DESC
       LIMIT 30`
    ).all();
    aulas = r.results;
  } catch (_) {}

  try {
    const r = await env.DB.prepare(
      `SELECT u.nome, u.telefone, u.nome_propriedade, u.quartos,
              COUNT(DISTINCT s.aula_id) as aulas_assistidas
       FROM usuarios u
       JOIN sessoes s ON s.usuario_id = u.id
       WHERE s.aula_id IS NOT NULL
       GROUP BY u.id
       ORDER BY aulas_assistidas DESC
       LIMIT 50`
    ).all();
    ranking = r.results;
  } catch (_) {}

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
    aulas,
    ranking,
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
        'Set-Cookie': `admin_sessao=${token}; Path=/; HttpOnly; SameSite=Lax`
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

    if (novo === '1') {
      // Opening class — create aula record and store its id
      try {
        const res = await env.DB.prepare(`INSERT INTO aulas (status) VALUES ('live')`).run();
        const aulaId = res.meta.last_row_id;
        await env.DB.prepare(
          `INSERT INTO config (chave, valor) VALUES ('aula_id_atual', ?)
           ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor`
        ).bind(String(aulaId)).run();
      } catch (_) {}
    } else {
      // Closing class — mark current aula as ended
      try {
        const cfg = await env.DB.prepare(`SELECT valor FROM config WHERE chave = 'aula_id_atual'`).first();
        if (cfg?.valor) {
          await env.DB.prepare(
            `UPDATE aulas SET status = 'ended', ended_at = datetime('now') WHERE id = ?`
          ).bind(parseInt(cfg.valor, 10)).run();
        }
      } catch (_) {}
    }
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
        'Set-Cookie': 'admin_sessao=; Path=/; Max-Age=0'
      }
    });
  }

  return new Response(null, { status: 302, headers: { 'Location': '/admin' } });
}
