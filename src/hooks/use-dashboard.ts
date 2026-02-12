import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services';

export function useDailySummary(date: string, organizationId: string) {
  return useQuery({
    queryKey: ['dashboard', 'summary', organizationId, date],
    queryFn: () => dashboardService.getDailySummary(date, organizationId),
    enabled: !!date && !!organizationId,
  });
}
