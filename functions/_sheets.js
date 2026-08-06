// Fire-and-forget backup to Google Sheets via Apps Script webhook
export function backupToSheets(env, data) {
  if (!env.GOOGLE_SHEETS_BACKUP_URL) return;
  fetch(env.GOOGLE_SHEETS_BACKUP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).catch(() => {});
}
