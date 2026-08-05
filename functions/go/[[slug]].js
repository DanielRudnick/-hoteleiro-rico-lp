export async function onRequestGet({ env, params }) {
  // params.slug is an array when using [[slug]] catch-all
  const slug = Array.isArray(params.slug) ? params.slug[0] : (params.slug || '');

  if (!slug) {
    return Response.redirect('https://ohoteleirorico.com.br', 302);
  }

  const link = await env.DB.prepare(
    `SELECT * FROM links WHERE slug = ? AND status = 'active'`
  ).bind(slug).first();

  if (!link) {
    return new Response('Link não encontrado.', {
      status: 404,
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
    });
  }

  let dest;
  try {
    dest = new URL(link.destination);
  } catch {
    return new Response('Destino inválido.', { status: 500 });
  }

  // Append UTM params
  if (link.utm_source)   dest.searchParams.set('utm_source',   link.utm_source);
  if (link.utm_medium)   dest.searchParams.set('utm_medium',   link.utm_medium);
  if (link.utm_campaign) dest.searchParams.set('utm_campaign', link.utm_campaign);
  if (link.utm_content)  dest.searchParams.set('utm_content',  link.utm_content);
  if (link.utm_term)     dest.searchParams.set('utm_term',     link.utm_term);

  // Fire-and-forget click count increment
  env.DB.prepare(
    `UPDATE links SET click_count = click_count + 1, updated_at = datetime('now') WHERE id = ?`
  ).bind(link.id).run().catch(() => {});

  return Response.redirect(dest.toString(), 302);
}
