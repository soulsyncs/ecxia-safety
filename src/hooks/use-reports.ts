import { useQuery } from '@tanstack/react-query';
import { reportsService } from '@/services';

export function usePreWorkReports(organizationId: string, date?: string) {
  return useQuery({
    queryKey: ['reports', 'pre-work', organizationId, date],
    queryFn: () => reportsService.getPreWorkReports(organizationId, date),
    enabled: !!organizationId,
  });
}

export function usePostWorkReports(organizationId: string, date?: string) {
  return useQuery({
    queryKey: ['reports', 'post-work', organizationId, date],
    queryFn: () => reportsService.getPostWorkReports(organizationId, date),
    enabled: !!organizationId,
  });
}

export function useDailyInspections(organizationId: string, date?: string) {
  return useQuery({
    queryKey: ['reports', 'inspections', organizationId, date],
    queryFn: () => reportsService.getDailyInspections(organizationId, date),
    enabled: !!organizationId,
  });
}

export function useAccidentReports(organizationId: string) {
  return useQuery({
    queryKey: ['reports', 'accidents', organizationId],
    queryFn: () => reportsService.getAccidentReports(organizationId),
    enabled: !!organizationId,
  });
}
