import type { Vehicle } from '@/types/database';
import type { CreateVehicleInput, UpdateVehicleInput } from '@/lib/validations';
import { supabase, isDemoMode, fromDb, fromDbArray, toDb, handleSupabaseError } from '@/lib/supabase';
import { vehicleService as demoVehicleService } from '@/lib/demo-store';

async function list(organizationId: string): Promise<Vehicle[]> {
  if (isDemoMode) return demoVehicleService.list();

  const { data, error } = await supabase.from('vehicles').select('*')
    .eq('organization_id', organizationId)
    .neq('status', 'retired')
    .order('plate_number');
  if (error) handleSupabaseError(error);
  return fromDbArray<Vehicle>(data ?? []);
}

async function getById(id: string): Promise<Vehicle | undefined> {
  if (isDemoMode) return demoVehicleService.getById(id);

  const { data, error } = await supabase.from('vehicles').select('*').eq('id', id).single();
  if (error) {
    if (error.code === 'PGRST116') return undefined;
    handleSupabaseError(error);
  }
  return fromDb<Vehicle>(data);
}

async function create(input: CreateVehicleInput, organizationId: string): Promise<Vehicle> {
  if (isDemoMode) return demoVehicleService.create(input as Omit<Vehicle, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>);

  const dbRow = toDb({ ...input, organizationId });
  const { data, error } = await supabase.from('vehicles').insert(dbRow).select().single();
  if (error) handleSupabaseError(error);
  return fromDb<Vehicle>(data);
}

async function update(id: string, input: UpdateVehicleInput): Promise<Vehicle> {
  if (isDemoMode) return demoVehicleService.update(id, input as Partial<Vehicle>);

  const dbRow = toDb(input as Record<string, unknown>);
  const { data, error } = await supabase.from('vehicles').update(dbRow).eq('id', id).select().single();
  if (error) handleSupabaseError(error);
  return fromDb<Vehicle>(data);
}

export const vehiclesService = { list, getById, create, update };
