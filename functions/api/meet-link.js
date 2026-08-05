// GET  → retorna o link atual do Meet
// POST → atualiza o link (requer header Authorization: Bearer <ADMIN_SECRET>)

export async function onRequestGet({ env }) {
  const config = await env.DB.prepare(
    `SELECT valor FROM config WHERE chave = 'meet_link'`
  ).first();
  return Response.json({ meet_link: config?.valor || null });
}

export async function onRequestPost({ request, env }) {
  const secret = (request.headers.get('Authorization') || '').replace('Bearer ', '').trim();
  if (!secret || secret !== env.ADMIN_SECRET) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const link = (body.meet_link || '').trim();

  if (!link.startsWith('https://meet.google.com/')) {
    return Response.json({ error: 'Link inválido. Use um link do Google Meet.' }, { status: 400 });
  }

  await env.DB.prepare(
    `INSERT INTO config (chave, valor) VALUES ('meet_link', ?)
     ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor`
  ).bind(link).run();

  return Response.json({ ok: true, meet_link: link });
}
