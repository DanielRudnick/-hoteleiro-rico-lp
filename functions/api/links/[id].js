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

export async function onRequestGet({ request, env, params }) {
  if (!await isAuthenticated(request, env)) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 });
  }
  const link = await env.DB.prepare(`SELECT * FROM links WHERE id = ?`)
    .bind(params.id).first();
  if (!link) return Response.json({ error: 'Não encontrado' }, { status: 404 });
  return Response.json(link);
}

export async function onRequestPut({ request, env, params }) {
  if (!await isAuthenticated(request, env)) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const {
    title, slug, destination,
    utm_source, utm_medium, utm_campaign, utm_content, utm_term,
    status,
  } = body;

  if (!title?.trim() || !destination?.trim()) {
    return Response.json({ error: 'Título e destino são obrigatórios.' }, { status: 400 });
  }

  try { new URL(destination.trim()); } catch {
    return Response.json({ error: 'URL de destino inválida.' }, { status: 400 });
  }

  const cleanSlug = slug?.trim()
    ? slug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/^-|-$/g, '')
    : null;

  try {
    await env.DB.prepare(
      `UPDATE links
       SET title=?, slug=?, destination=?,
           utm_source=?, utm_medium=?, utm_campaign=?, utm_content=?, utm_term=?,
           status=?, updated_at=datetime('now')
       WHERE id=?`
    ).bind(
      title.trim(),
      cleanSlug,
      destination.trim(),
      utm_source?.trim() || null,
      utm_medium?.trim() || null,
      utm_campaign?.trim() || null,
      utm_content?.trim() || null,
      utm_term?.trim() || null,
      ['active', 'inactive'].includes(status) ? status : 'active',
      params.id,
    ).run();

    const link = await env.DB.prepare(`SELECT * FROM links WHERE id = ?`)
      .bind(params.id).first();
    return Response.json({ ok: true, link });
  } catch (e) {
    if (String(e.message).includes('UNIQUE')) {
      return Response.json({ error: 'Este slug já está em uso.' }, { status: 409 });
    }
    throw e;
  }
}

export async function onRequestDelete({ request, env, params }) {
  if (!await isAuthenticated(request, env)) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 });
  }
  await env.DB.prepare(`DELETE FROM links WHERE id = ?`).bind(params.id).run();
  return Response.json({ ok: true });
}
