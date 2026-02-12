import { z } from 'zod';

export const createVehicleSchema = z.object({
  plateNumber: z.string().min(1, 'ナンバープレートは必須です'),
  maker: z.string().nullable().optional(),
  model: z.string().nullable().optional(),
  year: z.number().int().min(1990).max(2030).nullable().optional(),
  vehicleInspectionDate: z.string().nullable().optional(),
  status: z.enum(['active', 'maintenance', 'retired']).default('active'),
});

export const updateVehicleSchema = createVehicleSchema.partial();

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
