import { useQuery } from '@tanstack/react-query';
import { reportsService } from '@/services';

export function usePreWorkReports(organizationId: string, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['reports', 'pre-work', organizationId, startDate, endDate],
    queryFn: () => reportsService.getPreWorkReports(organizationId, startDate, endDate),
    enabled: !!organizationId,
  });
}

export function usePostWorkReports(organizationId: string, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['reports', 'post-work', organizationId, startDate, endDate],
    queryFn: () => reportsService.getPostWorkReports(organizationId, startDate, endDate),
    enabled: !!organizationId,
  });
}

export function useDailyInspections(organizationId: string, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['reports', 'inspections', organizationId, startDate, endDate],
    queryFn: () => reportsService.getDailyInspections(organizationId, startDate, endDate),
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
