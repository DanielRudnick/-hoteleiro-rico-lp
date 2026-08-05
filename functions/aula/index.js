const WEBHOOK_URL = 'https://webhook.sellflux.app/v2/webhook/sellflux/90346acb4e6366175e42ee24795726f8';

function getMidnightBRT() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setUTCHours(3, 0, 0, 0); // meia-noite BRT = 03:00 UTC
  if (now >= midnight) midnight.setUTCDate(midnight.getUTCDate() + 1);
  return midnight;
}

function getCookie(request, name) {
  const cookies = request.headers.get('Cookie') || '';
  const match = cookies.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function renderPage(error = '') {
  return new Response(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aula ao Vivo — Hoteleiro Rico</title>
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow:wght@300;400;600;700&display=swap" rel="stylesheet">
  <style>
    :root{--red:#C41A1A;--gold:#C9A84C;--black:#080808;--cream:#F5EFE6;--gray:#777}
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    body{background:var(--black);color:var(--cream);font-family:'Barlow',sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:40px 20px}
    body::before{content:'';position:fixed;inset:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)' opacity='0.05'/%3E%3C/svg%3E");opacity:.45;pointer-events:none}
    .card{position:relative;max-width:440px;width:100%;background:#0F0F0F;border:1px solid #1E1E1E;border-top:3px solid var(--gold);padding:48px 40px}
    .logo{font-family:'Bebas Neue',sans-serif;font-size:12px;letter-spacing:7px;color:#444;margin-bottom:36px;text-align:center}
    .logo span{color:var(--red)}
    .live-badge{display:inline-flex;align-items:center;gap:7px;background:rgba(196,26,26,0.08);border:1px solid rgba(196,26,26,0.2);padding:5px 14px;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:var(--red);margin-bottom:20px}
    .live-dot{width:6px;height:6px;border-radius:50%;background:var(--red);animation:pulse 1.5s ease-in-out infinite}
    h1{font-family:'Bebas Neue',sans-serif;font-size:2.2rem;letter-spacing:2px;color:#fff;margin-bottom:8px}
    .sub{font-size:.88rem;color:var(--gray);margin-bottom:32px;line-height:1.65;font-weight:300}
    .field{display:flex;flex-direction:column;gap:6px;margin-bottom:14px}
    label{font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#444;font-weight:600}
    input{background:#141414;border:1px solid #252525;color:var(--cream);font-family:'Barlow',sans-serif;font-size:14px;padding:13px 14px;outline:none;transition:border-color .2s;width:100%;border-radius:0}
    input:focus{border-color:rgba(201,168,76,0.4)}
    input::placeholder{color:#333}
    .btn{display:block;width:100%;background:var(--gold);color:#080808;font-family:'Barlow',sans-serif;font-size:.88rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:16px;border:none;cursor:pointer;margin-top:10px;transition:opacity .18s}
    .btn:hover{opacity:.86}
    .error{background:rgba(196,26,26,0.08);border:1px solid rgba(196,26,26,0.25);color:#d96060;font-size:13px;padding:12px 14px;margin-bottom:20px;line-height:1.5}
    .note{margin-top:24px;font-size:11px;color:#333;text-align:center;line-height:1.6}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
  </style>
</head>
<body>
<div class="card">
  <div class="logo">HOTELEIRO <span>RICO</span></div>
  <div class="live-badge"><span class="live-dot"></span>Ao vivo</div>
  <h1>Acesse a Aula</h1>
  <p class="sub">Informe seus dados para entrar na sala. Você só precisará fazer isso uma vez por dia.</p>
  ${error ? `<div class="error">${error}</div>` : ''}
  <form method="POST">
    <div class="field">
      <label>Nome completo</label>
      <input type="text" name="nome" placeholder="Seu nome" required autocomplete="name">
    </div>
    <div class="field">
      <label>WhatsApp</label>
      <input type="tel" name="telefone" placeholder="(00) 00000-0000" required autocomplete="tel">
    </div>
    <div class="field">
      <label>Nome da propriedade</label>
      <input type="text" name="nome_propriedade" placeholder="Ex: Pousada Bella Vista" required>
    </div>
    <div class="field">
      <label>Quantidade de quartos</label>
      <input type="number" name="quartos" placeholder="Ex: 18" min="1" max="9999" required>
    </div>
    <button type="submit" class="btn">Entrar na aula →</button>
  </form>
  <p class="note">Seus dados estão seguros e não serão compartilhados.</p>
</div>
</body>
</html>`, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
}

export async function onRequestGet({ request, env }) {
  const token = getCookie(request, 'sessao');
  if (token) {
    const sessao = await env.DB.prepare(
      `SELECT expira_em FROM sessoes WHERE token = ? AND expira_em > datetime('now')`
    ).bind(token).first();

    if (sessao) {
      const config = await env.DB.prepare(
        `SELECT valor FROM config WHERE chave = 'meet_link'`
      ).first();
      return Response.redirect(config?.valor || 'https://meet.google.com/', 302);
    }
  }
  return renderPage();
}

export async function onRequestPost({ request, env }) {
  const form = await request.formData();
  const nome            = (form.get('nome') || '').trim();
  const telefone        = (form.get('telefone') || '').trim();
  const nome_propriedade = (form.get('nome_propriedade') || '').trim();
  const quartos         = parseInt(form.get('quartos') || '0', 10);

  if (!nome || !telefone || !nome_propriedade || !quartos) {
    return renderPage('Preencha todos os campos para continuar.');
  }

  // Upsert usuário pelo telefone
  await env.DB.prepare(
    `INSERT INTO usuarios (nome, telefone, nome_propriedade, quartos, ultimo_login)
     VALUES (?, ?, ?, ?, datetime('now'))
     ON CONFLICT(telefone) DO UPDATE SET
       nome = excluded.nome,
       nome_propriedade = excluded.nome_propriedade,
       quartos = excluded.quartos,
       ultimo_login = datetime('now')`
  ).bind(nome, telefone, nome_propriedade, quartos).run();

  const usuario = await env.DB.prepare(
    `SELECT id FROM usuarios WHERE telefone = ?`
  ).bind(telefone).first();

  // Criar sessão expirando à meia-noite BRT
  const token   = crypto.randomUUID();
  const expira  = getMidnightBRT().toISOString().replace('T', ' ').slice(0, 19);
  await env.DB.prepare(
    `INSERT INTO sessoes (token, usuario_id, expira_em) VALUES (?, ?, ?)`
  ).bind(token, usuario.id, expira).run();

  // Webhook SellFlux
  try {
    await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: nome, phone: telefone, nome_propriedade, quartos, source: 'aula-ao-vivo' })
    });
  } catch (_) {}

  // Buscar link do Meet
  const config  = await env.DB.prepare(
    `SELECT valor FROM config WHERE chave = 'meet_link'`
  ).first();
  const meetLink = config?.valor || 'https://meet.google.com/';

  const maxAge = Math.floor((getMidnightBRT() - Date.now()) / 1000);

  return new Response(null, {
    status: 302,
    headers: {
      'Location': meetLink,
      'Set-Cookie': `sessao=${token}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax`
    }
  });
}
