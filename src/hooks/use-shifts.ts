import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ShiftStatus } from '@/types/database';
import { shiftsService } from '@/services';

export function useShiftsByMonth(orgId: string, year: number, month: number) {
  return useQuery({
    queryKey: ['shifts', orgId, year, month],
    queryFn: () => shiftsService.listByMonth(orgId, year, month),
    enabled: !!orgId,
  });
}

export function useShiftsByDate(orgId: string, date: string) {
  return useQuery({
    queryKey: ['shifts', orgId, 'date', date],
    queryFn: () => shiftsService.listByDate(orgId, date),
    enabled: !!orgId && !!date,
  });
}

export function useUpsertShift(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { driverId: string; date: string; status: ShiftStatus; note?: string }) =>
      shiftsService.upsert(orgId, args.driverId, args.date, args.status, 'admin', args.note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shifts', orgId] });
    },
  });
}

export function useBulkUpsertShifts(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (entries: { driverId: string; date: string; status: ShiftStatus }[]) =>
      shiftsService.bulkUpsert(orgId, entries),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shifts', orgId] });
    },
  });
}
