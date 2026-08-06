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

export async function onRequestPut({ request, env, params }) {
  if (!await isAuthenticated(request, env)) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { name, icon, source, medium, campaign, content, term } = body;

  if (!name?.trim() || !source?.trim() || !medium?.trim()) {
    return Response.json({ error: 'Nome, source e medium são obrigatórios.' }, { status: 400 });
  }

  await env.DB.prepare(
    `UPDATE utm_presets SET name=?, icon=?, source=?, medium=?, campaign=?, content=?, term=? WHERE id=?`
  ).bind(
    name.trim(), icon?.trim() || null,
    source.trim(), medium.trim(),
    campaign?.trim() || null, content?.trim() || null, term?.trim() || null,
    params.id,
  ).run();

  const preset = await env.DB.prepare(`SELECT * FROM utm_presets WHERE id = ?`)
    .bind(params.id).first();
  return Response.json({ ok: true, preset });
}

export async function onRequestDelete({ request, env, params }) {
  if (!await isAuthenticated(request, env)) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 });
  }
  await env.DB.prepare(`DELETE FROM utm_presets WHERE id = ?`).bind(params.id).run();
  return Response.json({ ok: true });
}
