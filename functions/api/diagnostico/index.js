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

  const { prompt, contact, answers_summary } = body;

  let iaResult = null;

  if (env.ANTHROPIC_API_KEY && prompt) {
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      const data = await res.json();
      const text = data.content?.[0]?.text || '{}';
      iaResult = JSON.parse(text.replace(/```json|```/g, '').trim());
    } catch (_) {}
  }

  const sheetData = {
    source:        'diagnostico',
    nome:          contact?.nome        || '',
    phone:         contact?.whatsapp    || '',
    email:         contact?.email       || '',
    hotel:         contact?.hotel       || '',
    ...(answers_summary || {}),
    ...(iaResult ? {
      veredicto:     iaResult.veredicto     || '',
      oportunidades: iaResult.oportunidades || '',
      proximo_passo: iaResult.proximo_passo || '',
    } : {}),
  };

  if (env.SELLFLUX_WEBHOOK_DIAGNOSTICO && contact) {
    try {
      await fetch(env.SELLFLUX_WEBHOOK_DIAGNOSTICO, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: contact.nome || '', ...sheetData }),
      });
    } catch (_) {}
  }

  await backupToSheets(env, sheetData);

  return new Response(JSON.stringify({ ok: true, result: iaResult }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
