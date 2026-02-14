import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { driversService } from '@/services';
import type { CreateDriverInput, UpdateDriverInput } from '@/lib/validations';

export function useDrivers(organizationId: string) {
  return useQuery({
    queryKey: ['drivers', organizationId],
    queryFn: () => driversService.list(organizationId),
    enabled: !!organizationId,
  });
}

export function useDriver(id: string, organizationId: string) {
  return useQuery({
    queryKey: ['drivers', 'detail', id, organizationId],
    queryFn: () => driversService.getById(id, organizationId),
    enabled: !!id && !!organizationId,
  });
}

export function useCreateDriver() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ input, organizationId }: { input: CreateDriverInput; organizationId: string }) =>
      driversService.create(input, organizationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
    },
  });
}

export function useUpdateDriver() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input, organizationId }: { id: string; input: UpdateDriverInput; organizationId: string }) =>
      driversService.update(id, input, organizationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
    },
  });
}
