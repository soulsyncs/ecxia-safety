import { describe, it, expect } from 'vitest';
import {
  loginSchema,
  createDriverSchema,
  createVehicleSchema,
  preWorkReportSchema,
  postWorkReportSchema,
  dailyInspectionSchema,
  accidentReportSchema,
} from '@/lib/validations';

describe('loginSchema', () => {
  it('有効なメールとパスワードで成功', () => {
    const result = loginSchema.safeParse({ email: 'admin@ecxia.co.jp', password: 'password123' });
    expect(result.success).toBe(true);
  });

  it('無効なメールで失敗', () => {
    const result = loginSchema.safeParse({ email: 'not-email', password: 'password123' });
    expect(result.success).toBe(false);
  });

  it('空のパスワードで失敗', () => {
    const result = loginSchema.safeParse({ email: 'admin@ecxia.co.jp', password: '' });
    expect(result.success).toBe(false);
  });
});

describe('createDriverSchema', () => {
  it('氏名のみで成功', () => {
    const result = createDriverSchema.safeParse({ name: '佐藤 太郎' });
    expect(result.success).toBe(true);
  });

  it('空の氏名で失敗', () => {
    const result = createDriverSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });

  it('全フィールド入力で成功', () => {
    const result = createDriverSchema.safeParse({
      name: '佐藤 太郎',
      nameKana: 'サトウ タロウ',
      phone: '090-1234-5678',
      dateOfBirth: '1985-06-15',
      licenseNumber: '123456789012',
      isSenior: false,
      isNewHire: true,
      status: 'active',
    });
    expect(result.success).toBe(true);
  });

  it('無効なステータスで失敗', () => {
    const result = createDriverSchema.safeParse({ name: '佐藤', status: 'invalid' });
    expect(result.success).toBe(false);
  });
});

describe('createVehicleSchema', () => {
  it('ナンバープレートのみで成功', () => {
    const result = createVehicleSchema.safeParse({ plateNumber: '市川 480 あ 1234' });
    expect(result.success).toBe(true);
  });

  it('空のナンバープレートで失敗', () => {
    const result = createVehicleSchema.safeParse({ plateNumber: '' });
    expect(result.success).toBe(false);
  });

  it('年式の範囲チェック', () => {
    expect(createVehicleSchema.safeParse({ plateNumber: '市川 480', year: 2024 }).success).toBe(true);
    expect(createVehicleSchema.safeParse({ plateNumber: '市川 480', year: 1980 }).success).toBe(false);
    expect(createVehicleSchema.safeParse({ plateNumber: '市川 480', year: 2035 }).success).toBe(false);
  });
});

describe('preWorkReportSchema', () => {
  const validReport = {
    vehicleId: '550e8400-e29b-41d4-a716-446655440000',
    startLocation: '市川市南八幡',
    plannedDestinations: '江東区エリア',
    alcoholCheckResult: 'negative' as const,
    alcoholCheckerName: '田中',
    healthCondition: 'good' as const,
    fatigueLevel: 'none' as const,
  };

  it('有効なデータで成功', () => {
    const result = preWorkReportSchema.safeParse(validReport);
    expect(result.success).toBe(true);
  });

  it('体調不良時のメモ必須チェック', () => {
    const poorHealth = { ...validReport, healthCondition: 'poor' as const, healthConditionNote: '' };
    const result = preWorkReportSchema.safeParse(poorHealth);
    expect(result.success).toBe(false);
  });

  it('体調不良 + メモありで成功', () => {
    const poorWithNote = { ...validReport, healthCondition: 'poor' as const, healthConditionNote: '頭痛あり' };
    const result = preWorkReportSchema.safeParse(poorWithNote);
    expect(result.success).toBe(true);
  });
});

describe('postWorkReportSchema', () => {
  const UUID = '550e8400-e29b-41d4-a716-446655440000';

  it('有効なデータで成功', () => {
    const result = postWorkReportSchema.safeParse({
      vehicleId: UUID,
      endLocation: '市川市南八幡',
      actualDestinations: '江東区亀戸エリア',
      distanceKm: 85.5,
      alcoholCheckResult: 'negative',
      alcoholCheckerName: '田中',
    });
    expect(result.success).toBe(true);
  });

  it('走行距離が負の値で失敗', () => {
    const result = postWorkReportSchema.safeParse({
      vehicleId: UUID,
      endLocation: '市川市',
      actualDestinations: '江東区',
      distanceKm: -10,
      alcoholCheckResult: 'negative',
      alcoholCheckerName: '田中',
    });
    expect(result.success).toBe(false);
  });
});

describe('dailyInspectionSchema', () => {
  it('全項目trueで成功', () => {
    const result = dailyInspectionSchema.safeParse({
      vehicleId: '550e8400-e29b-41d4-a716-446655440000',
      engineOil: true,
      coolantLevel: true,
      battery: true,
      headlights: true,
      turnSignals: true,
      brakeLights: true,
      tirePressure: true,
      tireTread: true,
      tireDamage: true,
      mirrors: true,
      seatbelt: true,
      brakes: true,
      steering: true,
    });
    expect(result.success).toBe(true);
  });
});

describe('accidentReportSchema', () => {
  const validAccident = {
    occurredAt: '2026-02-12T14:30:00+09:00',
    location: '江東区亀戸',
    summary: '左折時に電柱接触',
    cause: '内輪差確認不足',
    preventionMeasures: 'ミラー確認徹底',
    hasInjuries: false,
    isSerious: false,
  };

  it('有効なデータで成功', () => {
    const result = accidentReportSchema.safeParse(validAccident);
    expect(result.success).toBe(true);
  });

  it('負傷者ありで詳細必須チェック', () => {
    const withInjuries = { ...validAccident, hasInjuries: true };
    const result = accidentReportSchema.safeParse(withInjuries);
    expect(result.success).toBe(false);
  });

  it('負傷者あり + 詳細ありで成功', () => {
    const withDetails = { ...validAccident, hasInjuries: true, injuryDetails: '軽傷1名' };
    const result = accidentReportSchema.safeParse(withDetails);
    expect(result.success).toBe(true);
  });
});
