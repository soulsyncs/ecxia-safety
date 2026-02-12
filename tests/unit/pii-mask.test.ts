import { describe, it, expect } from 'vitest';
import { maskName, maskPhone, maskEmail, maskLicenseNumber, maskUuid, maskPiiFields } from '@/lib/pii-mask';

describe('maskName', () => {
  it('氏名をマスキング', () => {
    expect(maskName('山田太郎')).toBe('山***');
    expect(maskName('佐藤 花子')).toBe('佐***');
  });

  it('null/undefinedは***', () => {
    expect(maskName(null)).toBe('***');
    expect(maskName(undefined)).toBe('***');
  });
});

describe('maskPhone', () => {
  it('電話番号をマスキング', () => {
    expect(maskPhone('090-1234-5678')).toBe('090-****-5678');
    expect(maskPhone('09012345678')).toBe('090-****-5678');
  });

  it('null/undefinedは***', () => {
    expect(maskPhone(null)).toBe('***');
  });
});

describe('maskEmail', () => {
  it('メールアドレスをマスキング', () => {
    expect(maskEmail('admin@ecxia.co.jp')).toBe('a***@ecxia.co.jp');
    expect(maskEmail('test.user@example.com')).toBe('t***@example.com');
  });

  it('null/undefinedは***', () => {
    expect(maskEmail(null)).toBe('***');
  });
});

describe('maskLicenseNumber', () => {
  it('免許証番号をマスキング', () => {
    expect(maskLicenseNumber('123456789012')).toBe('****89012');
  });

  it('短い番号は***', () => {
    expect(maskLicenseNumber('1234')).toBe('***');
  });
});

describe('maskUuid', () => {
  it('UUIDをマスキング', () => {
    expect(maskUuid('550e8400-e29b-41d4-a716-446655440000')).toBe('550e...0000');
  });
});

describe('maskPiiFields', () => {
  it('オブジェクト内のPIIフィールドを自動マスキング', () => {
    const input = {
      name: '山田太郎',
      phone: '090-1234-5678',
      email: 'admin@ecxia.co.jp',
      licenseNumber: '123456789012',
      status: 'active',
      alcoholCheckerName: '田中一郎',
    };

    const result = maskPiiFields(input);
    expect(result.name).toBe('山***');
    expect(result.phone).toBe('090-****-5678');
    expect(result.email).toBe('a***@ecxia.co.jp');
    expect(result.licenseNumber).toBe('****89012');
    expect(result.status).toBe('active');
    expect(result.alcoholCheckerName).toBe('田***');
  });
});
