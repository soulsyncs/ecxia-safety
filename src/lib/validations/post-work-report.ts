import { z } from 'zod';

const restPeriodSchema = z.object({
  start: z.string().regex(/^\d{2}:\d{2}$/, 'HH:mm形式で入力'),
  end: z.string().regex(/^\d{2}:\d{2}$/, 'HH:mm形式で入力'),
  location: z.string(),
});

export const postWorkReportSchema = z.object({
  vehicleId: z.string().uuid('車両を選択してください'),
  endLocation: z.string().min(1, '業務終了地点は必須です'),
  actualDestinations: z.string().min(1, '実際の配送先は必須です'),
  distanceKm: z.number().min(0, '走行距離は0以上'),
  restPeriods: z.array(restPeriodSchema).nullable().optional(),
  alcoholCheckResult: z.enum(['negative', 'positive']),
  alcoholCheckValue: z.number().min(0).nullable().optional(),
  alcoholCheckerName: z.string().min(1, '確認者氏名は必須です'),
  roadConditionNote: z.string().nullable().optional(),
  cargoDeliveredCount: z.number().int().min(0).nullable().optional(),
});

export type PostWorkReportInput = z.infer<typeof postWorkReportSchema>;
