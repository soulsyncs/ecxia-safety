import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationSettingsService } from '@/services/notification-settings.service';
import type { NotificationSettings } from '@/types/database';

export function useNotificationSettings(organizationId: string) {
  return useQuery({
    queryKey: ['notification-settings', organizationId],
    queryFn: () => notificationSettingsService.get(organizationId),
    enabled: !!organizationId,
  });
}

export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ organizationId, settings }: { organizationId: string; settings: NotificationSettings }) =>
      notificationSettingsService.update(organizationId, settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-settings'] });
    },
  });
}
