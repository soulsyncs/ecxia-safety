import type { Driver } from '@/types/database';
import type { CreateDriverInput, UpdateDriverInput } from '@/lib/validations';
import { supabase, isDemoMode, fromDb, fromDbArray, toDb, handleSupabaseError } from '@/lib/supabase';
import { driverService as demoDriverService } from '@/lib/demo-store';

async function list(organizationId: string): Promise<Driver[]> {
  if (isDemoMode) return demoDriverService.list();

  const { data, error } = await supabase.from('drivers').select('*')
    .eq('organization_id', organizationId)
    .neq('status', 'inactive')
    .order('name');
  if (error) handleSupabaseError(error);
  return fromDbArray<Driver>(data ?? []);
}

async function getById(id: string): Promise<Driver | undefined> {
  if (isDemoMode) return demoDriverService.getById(id);

  const { data, error } = await supabase.from('drivers').select('*').eq('id', id).single();
  if (error) {
    if (error.code === 'PGRST116') return undefined;
    handleSupabaseError(error);
  }
  return fromDb<Driver>(data);
}

async function create(input: CreateDriverInput, organizationId: string): Promise<Driver> {
  if (isDemoMode) return demoDriverService.create(input as Omit<Driver, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>);

  const dbRow = toDb({ ...input, organizationId });
  const { data, error } = await supabase.from('drivers').insert(dbRow).select().single();
  if (error) handleSupabaseError(error);
  return fromDb<Driver>(data);
}

async function update(id: string, input: UpdateDriverInput): Promise<Driver> {
  if (isDemoMode) return demoDriverService.update(id, input as Partial<Driver>);

  const dbRow = toDb(input as Record<string, unknown>);
  const { data, error } = await supabase.from('drivers').update(dbRow).eq('id', id).select().single();
  if (error) handleSupabaseError(error);
  return fromDb<Driver>(data);
}

export const driversService = { list, getById, create, update };
