// Backup to Google Sheets via Apps Script webhook.
// Apps Script /exec redirects (302) and auto-follow converts POST→GET,
// so doPost never fires. We follow the redirect manually with POST.
export async function backupToSheets(env, data) {
  if (!env.GOOGLE_SHEETS_BACKUP_URL) return;

  const body = JSON.stringify(data);
  const headers = { 'Content-Type': 'application/json' };

  try {
    const res = await fetch(env.GOOGLE_SHEETS_BACKUP_URL, {
      method: 'POST',
      headers,
      body,
      redirect: 'manual',
    });

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('Location');
      if (location) {
        await fetch(location, { method: 'POST', headers, body });
      }
    }
  } catch (_) {}
}
