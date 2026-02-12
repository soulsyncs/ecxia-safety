import { z } from 'zod';

export const createDriverSchema = z.object({
  name: z.string().min(1, '氏名は必須です'),
  nameKana: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  dateOfBirth: z.string().nullable().optional(),
  hireDate: z.string().nullable().optional(),
  licenseNumber: z.string().nullable().optional(),
  licenseExpiry: z.string().nullable().optional(),
  healthCheckDate: z.string().nullable().optional(),
  isSenior: z.boolean().default(false),
  isNewHire: z.boolean().default(false),
  status: z.enum(['active', 'inactive', 'suspended']).default('active'),
  defaultVehicleId: z.string().uuid().nullable().optional(),
});

export const updateDriverSchema = createDriverSchema.partial();

export type CreateDriverInput = z.infer<typeof createDriverSchema>;
export type UpdateDriverInput = z.infer<typeof updateDriverSchema>;
