import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { vehiclesService } from '@/services';
import type { CreateVehicleInput, UpdateVehicleInput } from '@/lib/validations';

export function useVehicles(organizationId: string) {
  return useQuery({
    queryKey: ['vehicles', organizationId],
    queryFn: () => vehiclesService.list(organizationId),
    enabled: !!organizationId,
  });
}

export function useVehicle(id: string, organizationId: string) {
  return useQuery({
    queryKey: ['vehicles', 'detail', id, organizationId],
    queryFn: () => vehiclesService.getById(id, organizationId),
    enabled: !!id && !!organizationId,
  });
}

export function useCreateVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ input, organizationId }: { input: CreateVehicleInput; organizationId: string }) =>
      vehiclesService.create(input, organizationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
  });
}

export function useUpdateVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input, organizationId }: { id: string; input: UpdateVehicleInput; organizationId: string }) =>
      vehiclesService.update(id, input, organizationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
  });
}
