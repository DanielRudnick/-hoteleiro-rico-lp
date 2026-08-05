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

export async function onRequestOptions() {
  return new Response(null, { status: 204 });
}

export async function onRequestGet({ request, env }) {
  if (!await isAuthenticated(request, env)) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 });
  }
  const { results } = await env.DB.prepare(
    `SELECT * FROM utm_presets ORDER BY id ASC`
  ).all();
  return Response.json({ presets: results });
}

export async function onRequestPost({ request, env }) {
  if (!await isAuthenticated(request, env)) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { name, icon, source, medium, campaign, content, term } = body;

  if (!name?.trim() || !source?.trim() || !medium?.trim()) {
    return Response.json({ error: 'Nome, source e medium são obrigatórios.' }, { status: 400 });
  }

  const result = await env.DB.prepare(
    `INSERT INTO utm_presets (name, icon, source, medium, campaign, content, term)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    name.trim(), icon?.trim() || null,
    source.trim(), medium.trim(),
    campaign?.trim() || null, content?.trim() || null, term?.trim() || null,
  ).run();

  const preset = await env.DB.prepare(`SELECT * FROM utm_presets WHERE id = ?`)
    .bind(result.meta.last_row_id).first();

  return Response.json({ ok: true, preset }, { status: 201 });
}
