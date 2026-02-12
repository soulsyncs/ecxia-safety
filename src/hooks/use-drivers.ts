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

export function useDriver(id: string) {
  return useQuery({
    queryKey: ['drivers', 'detail', id],
    queryFn: () => driversService.getById(id),
    enabled: !!id,
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
    mutationFn: ({ id, input }: { id: string; input: UpdateDriverInput }) =>
      driversService.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
    },
  });
}
