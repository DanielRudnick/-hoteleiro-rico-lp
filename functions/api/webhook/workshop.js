export async function onRequestPost({ request, env }) {
  if (!env.SELLFLUX_WEBHOOK_WORKSHOP) {
    return new Response(JSON.stringify({ ok: false, error: 'webhook not configured' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'invalid json' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    await fetch(env.SELLFLUX_WEBHOOK_WORKSHOP, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, source: 'workshop-gratuito' }),
    });
  } catch (_) {}

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
