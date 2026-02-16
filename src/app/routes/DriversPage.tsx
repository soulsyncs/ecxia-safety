import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Search, Pencil, Trash2, Link2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { useDrivers, useCreateDriver, useUpdateDriver, useGenerateToken } from '@/hooks/use-drivers';
import { QRCodeSVG } from 'qrcode.react';
import { useVehicles } from '@/hooks/use-vehicles';
import { useAuth } from '@/contexts/auth-context';
import { createDriverSchema, type CreateDriverInput, type UpdateDriverInput } from '@/lib/validations';
import type { Driver } from '@/types/database';

const statusLabel: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  active: { label: '稼働中', variant: 'default' },
  inactive: { label: '退職', variant: 'secondary' },
  suspended: { label: '停止', variant: 'destructive' },
};

export function DriversPage() {
  const { organization } = useAuth();
  const orgId = organization?.id ?? '';
  const { data: drivers = [], isLoading } = useDrivers(orgId);
  const { data: vehicles = [] } = useVehicles(orgId);
  const createDriver = useCreateDriver();
  const updateDriver = useUpdateDriver();
  const generateToken = useGenerateToken();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDriver, setEditDriver] = useState<Driver | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [linkDriver, setLinkDriver] = useState<Driver | null>(null);
  const [linkUrl, setLinkUrl] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateDriverInput>({
    resolver: zodResolver(createDriverSchema),
    defaultValues: { isSenior: false, isNewHire: true, status: 'active' },
  });

  const filteredDrivers = drivers.filter(d =>
    d.name.includes(search) || (d.nameKana && d.nameKana.includes(search)) || (d.phone && d.phone.includes(search))
  );

  const getVehiclePlate = (vehicleId: string | null) => {
    if (!vehicleId) return '-';
    return vehicles.find(v => v.id === vehicleId)?.plateNumber ?? '-';
  };

  const onSubmit = async (data: CreateDriverInput) => {
    if (!organization) return;
    try {
      await createDriver.mutateAsync({ input: data, organizationId: organization.id });
      setDialogOpen(false);
      reset();
    } catch {
      // error handled by mutation
    }
  };

  const handleEdit = (driver: Driver) => {
    setEditDriver(driver);
    setEditDialogOpen(true);
  };

  const onEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editDriver || !organization) return;
    const formData = new FormData(e.currentTarget);
    const input: UpdateDriverInput = {
      name: formData.get('editName') as string,
      nameKana: (formData.get('editNameKana') as string) || undefined,
      phone: (formData.get('editPhone') as string) || undefined,
      dateOfBirth: (formData.get('editDateOfBirth') as string) || undefined,
      licenseNumber: (formData.get('editLicenseNumber') as string) || undefined,
    };
    try {
      await updateDriver.mutateAsync({ id: editDriver.id, input, organizationId: organization.id });
      setEditDialogOpen(false);
      setEditDriver(null);
    } catch {
      // error handled by mutation
    }
  };

  const handleLinkLine = async (driver: Driver) => {
    if (!organization) return;
    try {
      const token = await generateToken.mutateAsync({ id: driver.id, organizationId: organization.id });
      const liffId = import.meta.env.VITE_LIFF_ID ?? '';
      const url = `https://liff.line.me/${liffId}/link?token=${token}`;
      setLinkUrl(url);
      setLinkDriver(driver);
    } catch {
      // error handled by mutation
    }
  };

  const handleSoftDelete = async (driver: Driver) => {
    if (!organization) return;
    try {
      await updateDriver.mutateAsync({ id: driver.id, input: { status: 'inactive' }, organizationId: organization.id });
    } catch {
      // error handled by mutation
    }
  };

  if (isLoading) return <div className="flex items-center justify-center h-64 text-muted-foreground">読み込み中...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">ドライバー管理</h1>
          <p className="text-muted-foreground">ドライバーの登録・編集・LINE連携ができます</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />新規登録</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>ドライバー新規登録</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">氏名 *</Label>
                <Input id="name" {...register('name')} placeholder="山田 太郎" />
                {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="nameKana">フリガナ</Label>
                <Input id="nameKana" {...register('nameKana')} placeholder="ヤマダ タロウ" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">電話番号</Label>
                <Input id="phone" {...register('phone')} placeholder="090-0000-0000" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">生年月日</Label>
                <Input id="dateOfBirth" type="date" {...register('dateOfBirth')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="licenseNumber">免許証番号</Label>
                <Input id="licenseNumber" {...register('licenseNumber')} placeholder="123456789012" />
              </div>
              <Button type="submit" className="w-full" disabled={createDriver.isPending}>
                {createDriver.isPending ? '登録中...' : '登録'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="名前・フリガナ・電話番号で検索..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>氏名</TableHead>
                <TableHead>電話番号</TableHead>
                <TableHead>担当車両</TableHead>
                <TableHead>LINE連携</TableHead>
                <TableHead>状態</TableHead>
                <TableHead>入社日</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDrivers.map(driver => {
                const st = statusLabel[driver.status] ?? statusLabel['active']!;
                return (
                  <TableRow key={driver.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{driver.name}</p>
                        {driver.nameKana && <p className="text-xs text-muted-foreground">{driver.nameKana}</p>}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{driver.phone ?? '-'}</TableCell>
                    <TableCell className="text-sm">{getVehiclePlate(driver.defaultVehicleId)}</TableCell>
                    <TableCell>
                      {driver.lineUserId ? (
                        <Badge variant="default" className="bg-ecxia-green">連携済</Badge>
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => handleLinkLine(driver)} disabled={generateToken.isPending}>
                          <Link2 className="h-3 w-3 mr-1" />LINE連携
                        </Button>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={st.variant}>{st.label}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{driver.hireDate ?? '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(driver)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>ドライバーを退職にしますか？</AlertDialogTitle>
                              <AlertDialogDescription>
                                {driver.name} を退職状態にします。一覧から非表示になります。
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>キャンセル</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleSoftDelete(driver)}>退職にする</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {filteredDrivers.length === 0 && drivers.length === 0 && (
            <div className="text-center py-12 px-6">
              <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-1">まだドライバーが登録されていません</h3>
              <p className="text-sm text-muted-foreground mb-4">
                右上の「新規登録」ボタンから、ドライバーの氏名と電話番号を登録しましょう。
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!linkDriver} onOpenChange={open => { if (!open) { setLinkDriver(null); setLinkUrl(null); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>LINE連携 - {linkDriver?.name}</DialogTitle></DialogHeader>
          {linkUrl && (
            <div className="flex flex-col items-center gap-4 py-4">
              <p className="text-sm text-muted-foreground text-center">ドライバーにこのQRコードを読み取ってもらうか、URLを送信してください。</p>
              <QRCodeSVG value={linkUrl} size={200} />
              <div className="w-full">
                <Label className="text-xs">登録URL</Label>
                <div className="flex gap-2 mt-1">
                  <Input value={linkUrl} readOnly className="text-xs" />
                  <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(linkUrl)}>コピー</Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">このURLは1回限り有効です。連携完了後は無効になります。</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>ドライバー編集</DialogTitle></DialogHeader>
          {editDriver && (
            <form onSubmit={onEditSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editName">氏名 *</Label>
                <Input id="editName" name="editName" defaultValue={editDriver.name} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editNameKana">フリガナ</Label>
                <Input id="editNameKana" name="editNameKana" defaultValue={editDriver.nameKana ?? ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editPhone">電話番号</Label>
                <Input id="editPhone" name="editPhone" defaultValue={editDriver.phone ?? ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editDateOfBirth">生年月日</Label>
                <Input id="editDateOfBirth" name="editDateOfBirth" type="date" defaultValue={editDriver.dateOfBirth ?? ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editLicenseNumber">免許証番号</Label>
                <Input id="editLicenseNumber" name="editLicenseNumber" defaultValue={editDriver.licenseNumber ?? ''} />
              </div>
              <Button type="submit" className="w-full" disabled={updateDriver.isPending}>
                {updateDriver.isPending ? '更新中...' : '更新'}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
