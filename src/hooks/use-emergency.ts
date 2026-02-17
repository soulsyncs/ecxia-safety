import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { EmergencyReportType } from '@/types/database';
import { emergencyService } from '@/services';

export function useEmergencyReports(orgId: string, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['emergency', orgId, startDate, endDate],
    queryFn: () => emergencyService.list(orgId, startDate, endDate),
    enabled: !!orgId,
  });
}

export function useCreateEmergencyReport(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { driverId: string; reportType: EmergencyReportType; reason?: string; vehicleId?: string }) =>
      emergencyService.create(orgId, args.driverId, args.reportType, args.reason, args.vehicleId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['emergency', orgId] });
      qc.invalidateQueries({ queryKey: ['shifts', orgId] });
    },
  });
}

export function useResolveEmergency(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; resolvedBy: string }) =>
      emergencyService.resolve(orgId, args.id, args.resolvedBy),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['emergency', orgId] });
    },
  });
}
