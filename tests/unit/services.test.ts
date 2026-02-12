import { describe, it, expect, vi } from 'vitest';
import { snakeToCamel, camelToSnake, fromDb, toDb, fromDbArray } from '@/lib/supabase';

describe('snakeToCamel', () => {
  it('snake_case → camelCase', () => {
    expect(snakeToCamel('organization_id')).toBe('organizationId');
    expect(snakeToCamel('created_at')).toBe('createdAt');
    expect(snakeToCamel('line_user_id')).toBe('lineUserId');
    expect(snakeToCamel('id')).toBe('id');
  });
});

describe('camelToSnake', () => {
  it('camelCase → snake_case', () => {
    expect(camelToSnake('organizationId')).toBe('organization_id');
    expect(camelToSnake('createdAt')).toBe('created_at');
    expect(camelToSnake('lineUserId')).toBe('line_user_id');
    expect(camelToSnake('id')).toBe('id');
  });
});

describe('fromDb', () => {
  it('DB行をTypeScript型に変換', () => {
    const dbRow = {
      id: '123',
      organization_id: 'org-001',
      plate_number: '市川 480 あ 1234',
      created_at: '2026-01-01T00:00:00Z',
    };
    const result = fromDb<Record<string, unknown>>(dbRow);
    expect(result.id).toBe('123');
    expect(result.organizationId).toBe('org-001');
    expect(result.plateNumber).toBe('市川 480 あ 1234');
    expect(result.createdAt).toBe('2026-01-01T00:00:00Z');
  });
});

describe('toDb', () => {
  it('TypeScript型をDB行に変換', () => {
    const obj = {
      id: '123',
      organizationId: 'org-001',
      plateNumber: '市川 480 あ 1234',
      createdAt: '2026-01-01T00:00:00Z',
    };
    const result = toDb(obj);
    expect(result.id).toBe('123');
    expect(result.organization_id).toBe('org-001');
    expect(result.plate_number).toBe('市川 480 あ 1234');
    expect(result.created_at).toBe('2026-01-01T00:00:00Z');
  });
});

describe('fromDbArray', () => {
  it('配列を一括変換', () => {
    const rows = [
      { id: '1', organization_id: 'org-001' },
      { id: '2', organization_id: 'org-002' },
    ];
    const result = fromDbArray<Record<string, unknown>>(rows);
    expect(result).toHaveLength(2);
    expect(result[0]!.organizationId).toBe('org-001');
    expect(result[1]!.organizationId).toBe('org-002');
  });
});
