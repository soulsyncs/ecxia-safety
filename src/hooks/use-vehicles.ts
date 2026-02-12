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

export function useVehicle(id: string) {
  return useQuery({
    queryKey: ['vehicles', 'detail', id],
    queryFn: () => vehiclesService.getById(id),
    enabled: !!id,
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
    mutationFn: ({ id, input }: { id: string; input: UpdateVehicleInput }) =>
      vehiclesService.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
  });
}
