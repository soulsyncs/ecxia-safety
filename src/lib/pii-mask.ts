/**
 * PII（個人識別情報）マスキングユーティリティ
 * CLAUDE.md §2.5.2: event_logs.detailsやログ出力にPIIを含めない
 */

/** 氏名マスキング: "山田太郎" → "山***" */
export function maskName(name: string | null | undefined): string {
  if (!name) return '***';
  const first = name.charAt(0);
  return `${first}***`;
}

/** 電話番号マスキング: "090-1234-5678" → "090-****-5678" */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return '***';
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '***';
  return `${digits.slice(0, 3)}-****-${digits.slice(-4)}`;
}

/** メールアドレスマスキング: "admin@ecxia.co.jp" → "a***@ecxia.co.jp" */
export function maskEmail(email: string | null | undefined): string {
  if (!email) return '***';
  const [local, domain] = email.split('@');
  if (!local || !domain) return '***';
  return `${local.charAt(0)}***@${domain}`;
}

/** 免許証番号マスキング: "123456789012" → "****89012" */
export function maskLicenseNumber(num: string | null | undefined): string {
  if (!num) return '***';
  if (num.length < 5) return '***';
  return `****${num.slice(-5)}`;
}

/** UUIDマスキング: "550e8400-e29b-41d4-a716-446655440000" → "550e...0000" */
export function maskUuid(uuid: string | null | undefined): string {
  if (!uuid) return '***';
  if (uuid.length < 8) return '***';
  return `${uuid.slice(0, 4)}...${uuid.slice(-4)}`;
}

/** オブジェクト内のPIIフィールドを自動マスキング */
export function maskPiiFields(obj: Record<string, unknown>): Record<string, unknown> {
  const masked = { ...obj };
  const nameFields = ['name', 'nameKana', 'driverName', 'alcoholCheckerName', 'safetyManagerName'];
  const phoneFields = ['phone'];
  const emailFields = ['email'];
  const licenseFields = ['licenseNumber'];

  for (const key of Object.keys(masked)) {
    const value = masked[key];
    if (typeof value !== 'string') continue;

    if (nameFields.includes(key)) {
      masked[key] = maskName(value);
    } else if (phoneFields.includes(key)) {
      masked[key] = maskPhone(value);
    } else if (emailFields.includes(key)) {
      masked[key] = maskEmail(value);
    } else if (licenseFields.includes(key)) {
      masked[key] = maskLicenseNumber(value);
    }
  }

  return masked;
}

/** ログ出力用: PIIをマスキングしてからJSON化 */
export function safeLog(label: string, data: Record<string, unknown>): void {
  const masked = maskPiiFields(data);
  console.log(`[${label}]`, JSON.stringify(masked));
}
