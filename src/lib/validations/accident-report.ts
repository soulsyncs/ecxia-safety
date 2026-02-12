import { z } from 'zod';

export const accidentReportSchema = z.object({
  vehicleId: z.string().uuid().nullable().optional(),
  occurredAt: z.string().min(1, '発生日時は必須です'),
  location: z.string().min(1, '発生場所は必須です'),
  summary: z.string().min(1, '事故の概要は必須です'),
  cause: z.string().min(1, '事故の原因は必須です'),
  preventionMeasures: z.string().min(1, '再発防止策は必須です'),
  hasInjuries: z.boolean(),
  injuryDetails: z.string().nullable().optional(),
  isSerious: z.boolean(),
}).refine(
  (data) => !data.hasInjuries || (data.injuryDetails && data.injuryDetails.length > 0),
  { message: '負傷者ありの場合は詳細を記入してください', path: ['injuryDetails'] },
);

export type AccidentReportInput = z.infer<typeof accidentReportSchema>;
