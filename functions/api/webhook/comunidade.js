import { backupToSheets } from '../../_sheets.js';

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'invalid json' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const payload = { ...body, source: 'comunidade' };

  if (env.SELLFLUX_WEBHOOK_COMUNIDADE) {
    try {
      await fetch(env.SELLFLUX_WEBHOOK_COMUNIDADE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (_) {}
  }

  await backupToSheets(env, payload);

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
