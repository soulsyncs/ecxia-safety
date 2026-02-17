import { useEffect, useState } from 'react';
import { useRouter } from '@tanstack/react-router';
import { Bell, Clock, Save, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/auth-context';
import { useNotificationSettings, useUpdateNotificationSettings } from '@/hooks/use-notification-settings';
import type { NotificationSettings } from '@/types/database';
import { DEFAULT_NOTIFICATION_SETTINGS } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

interface NotificationItemConfig {
  key: keyof NotificationSettings;
  label: string;
  description: string;
  icon: string;
}

const NOTIFICATION_ITEMS: NotificationItemConfig[] = [
  {
    key: 'morningReminder',
    label: '朝のリマインド',
    description: '毎朝、全ドライバーに業務前報告の提出を促すメッセージを送ります',
    icon: '🌅',
  },
  {
    key: 'preWorkAlert',
    label: '業務前 未提出アラート',
    description: '業務前報告が未提出のドライバーだけに催促メッセージを送ります',
    icon: '📋',
  },
  {
    key: 'postWorkAlert',
    label: '業務後 未提出アラート',
    description: '業務後報告が未提出のドライバーだけに催促メッセージを送ります',
    icon: '🏁',
  },
  {
    key: 'adminSummary',
    label: '管理者サマリー',
    description: '管理者に本日の提出状況まとめを通知します',
    icon: '📊',
  },
];

const TIME_OPTIONS = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
];

export function NotificationSettingsPage() {
  const { user, organization, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const orgId = organization?.id ?? '';
  const { data: savedSettings, isLoading } = useNotificationSettings(orgId);
  const updateSettings = useUpdateNotificationSettings();
  const { toast } = useToast();

  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [hasChanges, setHasChanges] = useState(false);

  // org_admin以外はダッシュボードにリダイレクト
  if (!authLoading && user && user.role !== 'org_admin') {
    router.navigate({ to: '/' });
    return null;
  }

  useEffect(() => {
    if (savedSettings) {
      setSettings(savedSettings);
      setHasChanges(false);
    }
  }, [savedSettings]);

  const handleToggle = (key: keyof NotificationSettings) => {
    setSettings(prev => ({
      ...prev,
      [key]: { ...prev[key], enabled: !prev[key].enabled },
    }));
    setHasChanges(true);
  };

  const handleTimeChange = (key: keyof NotificationSettings, time: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: { ...prev[key], time },
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!organization) return;
    try {
      await updateSettings.mutateAsync({ organizationId: organization.id, settings });
      setHasChanges(false);
      toast({
        title: '保存しました',
        description: '自動配信の設定を更新しました',
      });
    } catch {
      toast({
        title: 'エラー',
        description: '設定の保存に失敗しました。もう一度お試しください。',
        variant: 'destructive',
      });
    }
  };

  const enabledCount = Object.values(settings).filter(s => s.enabled).length;

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">読み込み中...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">LINE自動配信設定</h1>
          <p className="text-muted-foreground">ドライバーへの自動メッセージ配信を設定します</p>
        </div>
        <Button onClick={handleSave} disabled={!hasChanges || updateSettings.isPending}>
          <Save className="h-4 w-4 mr-2" />
          {updateSettings.isPending ? '保存中...' : '設定を保存'}
        </Button>
      </div>

      {/* ステータスカード */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <Bell className={`h-5 w-5 ${enabledCount > 0 ? 'text-ecxia-green' : 'text-muted-foreground'}`} />
            <div>
              <p className="font-medium">
                {enabledCount > 0
                  ? `${enabledCount}件の自動配信がONです`
                  : '全ての自動配信がOFFです'}
              </p>
              <p className="text-sm text-muted-foreground">
                {enabledCount > 0
                  ? '設定した時刻にドライバーへLINEメッセージが自動送信されます'
                  : 'ONにすると、設定した時刻にドライバーへLINEメッセージが自動送信されます'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 通知設定カード */}
      <div className="space-y-4">
        {NOTIFICATION_ITEMS.map((item) => {
          const setting = settings[item.key];
          return (
            <Card key={item.key} className={setting.enabled ? 'border-ecxia-green/30' : ''}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <span className="text-2xl">{item.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Label className="text-base font-medium cursor-pointer" onClick={() => handleToggle(item.key)}>
                          {item.label}
                        </Label>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
                      {setting.enabled && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">配信時刻:</span>
                          <select
                            value={setting.time}
                            onChange={(e) => handleTimeChange(item.key, e.target.value)}
                            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                          >
                            {TIME_OPTIONS.map(t => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                  <Switch
                    checked={setting.enabled}
                    onCheckedChange={() => handleToggle(item.key)}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 注意事項 */}
      <Card className="mt-6 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="h-4 w-4 text-blue-600" />
            ご注意
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-blue-800">
          <p>自動配信を利用するには、LINE公式アカウントの連携設定が必要です。</p>
          <p>配信はLINE連携済みのドライバーにのみ送信されます。</p>
          <p>設定を変更した後、「設定を保存」ボタンを押してください。</p>
        </CardContent>
      </Card>
    </div>
  );
}
