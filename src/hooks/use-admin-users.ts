import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminUsersService } from '@/services';
import type { CreateAdminInput } from '@/lib/validations';

export function useAdminUsers(organizationId: string) {
  return useQuery({
    queryKey: ['admin-users', organizationId],
    queryFn: () => adminUsersService.list(organizationId),
    enabled: !!organizationId,
  });
}

export function useCreateAdminUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ input, organizationId }: { input: CreateAdminInput; organizationId: string }) =>
      adminUsersService.create(input, organizationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });
}

export function useRemoveAdminUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, organizationId }: { id: string; organizationId: string }) =>
      adminUsersService.remove(id, organizationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });
}

export function useGenerateLineToken() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, organizationId }: { id: string; organizationId: string }) =>
      adminUsersService.generateLineToken(id, organizationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });
}

export function useUnlinkAdminLine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, organizationId }: { id: string; organizationId: string }) =>
      adminUsersService.unlinkLine(id, organizationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });
}
