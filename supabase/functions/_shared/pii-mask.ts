// PII masking for Edge Functions
// CLAUDE.md §2.5.2: console.log、エラーメッセージにドライバーの個人情報を含めない

/** ドライバー名をマスク: "山田太郎" → "山***" */
export function maskName(name: string | null | undefined): string {
  if (!name || name.length === 0) return '***';
  return `${name.charAt(0)}***`;
}

/** ドライバーIDのみ安全にログ出力 */
export function safeLog(label: string, data: Record<string, unknown>): void {
  const masked = { ...data };
  const piiKeys = ['name', 'driverName', 'phone', 'email', 'licenseNumber', 'lineUserId'];
  for (const key of piiKeys) {
    if (key in masked && typeof masked[key] === 'string') {
      masked[key] = key === 'name' || key === 'driverName'
        ? maskName(masked[key] as string)
        : '***';
    }
  }
  console.log(`[${label}]`, JSON.stringify(masked));
}
