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

function slugify(str) {
  return str.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function onRequestGet({ request, env }) {
  if (!await isAuthenticated(request, env)) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const url = new URL(request.url);
  const page   = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const limit  = 100;
  const offset = (page - 1) * limit;

  const [{ results }, countRow] = await Promise.all([
    env.DB.prepare(
      `SELECT * FROM links ORDER BY created_at DESC LIMIT ? OFFSET ?`
    ).bind(limit, offset).all(),
    env.DB.prepare(`SELECT COUNT(*) as total, COALESCE(SUM(click_count),0) as clicks FROM links`).first(),
  ]);

  return Response.json({
    links:  results,
    total:  countRow?.total  || 0,
    clicks: countRow?.clicks || 0,
  });
}

export async function onRequestPost({ request, env }) {
  if (!await isAuthenticated(request, env)) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const {
    title, slug: rawSlug, destination,
    utm_source, utm_medium, utm_campaign, utm_content, utm_term,
  } = body;

  if (!title?.trim() || !destination?.trim()) {
    return Response.json({ error: 'Título e destino são obrigatórios.' }, { status: 400 });
  }

  try { new URL(destination.trim()); } catch {
    return Response.json({ error: 'URL de destino inválida.' }, { status: 400 });
  }

  const slug = rawSlug?.trim()
    ? rawSlug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/^-|-$/g, '')
    : slugify(title.trim());

  if (!slug) {
    return Response.json({ error: 'Slug inválido.' }, { status: 400 });
  }

  try {
    const result = await env.DB.prepare(
      `INSERT INTO links (title, slug, destination, utm_source, utm_medium, utm_campaign, utm_content, utm_term)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      title.trim(), slug, destination.trim(),
      utm_source?.trim() || null,
      utm_medium?.trim() || null,
      utm_campaign?.trim() || null,
      utm_content?.trim() || null,
      utm_term?.trim() || null,
    ).run();

    const link = await env.DB.prepare(`SELECT * FROM links WHERE id = ?`)
      .bind(result.meta.last_row_id).first();

    return Response.json({ ok: true, link }, { status: 201 });
  } catch (e) {
    if (String(e.message).includes('UNIQUE')) {
      return Response.json({ error: 'Este slug já está em uso.' }, { status: 409 });
    }
    throw e;
  }
}
