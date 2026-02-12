import { z } from 'zod';

export const dailyInspectionSchema = z.object({
  vehicleId: z.string().uuid('車両を選択してください'),
  // エンジンルーム（3項目）
  engineOil: z.boolean(),
  coolantLevel: z.boolean(),
  battery: z.boolean(),
  // ライト類（3項目）
  headlights: z.boolean(),
  turnSignals: z.boolean(),
  brakeLights: z.boolean(),
  // タイヤ（3項目）
  tirePressure: z.boolean(),
  tireTread: z.boolean(),
  tireDamage: z.boolean(),
  // 運転席周り（4項目）
  mirrors: z.boolean(),
  seatbelt: z.boolean(),
  brakes: z.boolean(),
  steering: z.boolean(),
  // 異常
  abnormalityNote: z.string().nullable().optional(),
});

export type DailyInspectionInput = z.infer<typeof dailyInspectionSchema>;
