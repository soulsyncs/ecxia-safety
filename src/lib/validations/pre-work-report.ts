import { z } from 'zod';

export const preWorkReportSchema = z.object({
  vehicleId: z.string().uuid('車両を選択してください'),
  startLocation: z.string().min(1, '業務開始地点は必須です'),
  plannedDestinations: z.string().min(1, '配送先は必須です'),
  alcoholCheckResult: z.enum(['negative', 'positive']),
  alcoholCheckValue: z.number().min(0).nullable().optional(),
  alcoholCheckerName: z.string().min(1, '確認者氏名は必須です'),
  healthCondition: z.enum(['good', 'fair', 'poor']),
  healthConditionNote: z.string().nullable().optional(),
  fatigueLevel: z.enum(['none', 'mild', 'severe']),
  sleepHours: z.number().min(0).max(24).nullable().optional(),
  cargoCount: z.number().int().min(0).nullable().optional(),
}).refine(
  (data) => data.healthCondition !== 'poor' || (data.healthConditionNote && data.healthConditionNote.length > 0),
  { message: '体調不良の場合は詳細を記入してください', path: ['healthConditionNote'] },
);

export type PreWorkReportInput = z.infer<typeof preWorkReportSchema>;
