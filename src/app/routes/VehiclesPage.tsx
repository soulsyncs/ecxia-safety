import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useVehicles, useCreateVehicle, useUpdateVehicle } from '@/hooks/use-vehicles';
import { useAuth } from '@/contexts/auth-context';
import { createVehicleSchema, type CreateVehicleInput, type UpdateVehicleInput } from '@/lib/validations';
import type { Vehicle } from '@/types/database';

const statusLabel: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  active: { label: '稼働中', variant: 'default' },
  maintenance: { label: '整備中', variant: 'secondary' },
  retired: { label: '廃車', variant: 'destructive' },
};

export function VehiclesPage() {
  const { organization } = useAuth();
  const orgId = organization?.id ?? '';
  const { data: vehicles = [], isLoading } = useVehicles(orgId);
  const createVehicle = useCreateVehicle();
  const updateVehicle = useUpdateVehicle();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateVehicleInput>({
    resolver: zodResolver(createVehicleSchema),
    defaultValues: { status: 'active' },
  });

  const isExpiringSoon = (date: string | null | undefined) => {
    if (!date) return false;
    const diff = new Date(date).getTime() - Date.now();
    return diff > 0 && diff < 90 * 24 * 60 * 60 * 1000;
  };

  const onSubmit = async (data: CreateVehicleInput) => {
    if (!organization) return;
    try {
      await createVehicle.mutateAsync({ input: data, organizationId: organization.id });
      setDialogOpen(false);
      reset();
    } catch {
      // error handled by mutation
    }
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditVehicle(vehicle);
    setEditDialogOpen(true);
  };

  const onEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editVehicle || !organization) return;
    const formData = new FormData(e.currentTarget);
    const yearVal = formData.get('editYear') as string;
    const input: UpdateVehicleInput = {
      plateNumber: formData.get('editPlateNumber') as string,
      maker: (formData.get('editMaker') as string) || undefined,
      model: (formData.get('editModel') as string) || undefined,
      year: yearVal ? parseInt(yearVal) : undefined,
      vehicleInspectionDate: (formData.get('editVehicleInspectionDate') as string) || undefined,
    };
    try {
      await updateVehicle.mutateAsync({ id: editVehicle.id, input, organizationId: organization.id });
      setEditDialogOpen(false);
      setEditVehicle(null);
    } catch {
      // error handled by mutation
    }
  };

  const handleRetire = async (vehicle: Vehicle) => {
    if (!organization) return;
    try {
      await updateVehicle.mutateAsync({ id: vehicle.id, input: { status: 'retired' }, organizationId: organization.id });
    } catch {
      // error handled by mutation
    }
  };

  if (isLoading) return <div className="flex items-center justify-center h-64 text-muted-foreground">読み込み中...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">車両管理</h1>
          <p className="text-muted-foreground">{vehicles.length}台登録</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />新規登録</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>車両新規登録</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="plateNumber">ナンバープレート *</Label>
                <Input id="plateNumber" {...register('plateNumber')} placeholder="市川 480 あ 1234" />
                {errors.plateNumber && <p className="text-xs text-red-600">{errors.plateNumber.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maker">メーカー</Label>
                  <Input id="maker" {...register('maker')} placeholder="ダイハツ" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">車種</Label>
                  <Input id="model" {...register('model')} placeholder="ハイゼットカーゴ" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="year">年式</Label>
                  <Input id="year" type="number" {...register('year', { valueAsNumber: true })} placeholder="2024" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vehicleInspectionDate">車検有効期限</Label>
                  <Input id="vehicleInspectionDate" type="date" {...register('vehicleInspectionDate')} />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={createVehicle.isPending}>
                {createVehicle.isPending ? '登録中...' : '登録'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ナンバー</TableHead>
                <TableHead>メーカー</TableHead>
                <TableHead>車種</TableHead>
                <TableHead>年式</TableHead>
                <TableHead>車検有効期限</TableHead>
                <TableHead>状態</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicles.map(v => {
                const st = statusLabel[v.status] ?? statusLabel['active']!;
                return (
                  <TableRow key={v.id}>
                    <TableCell className="font-medium">{v.plateNumber}</TableCell>
                    <TableCell>{v.maker ?? '-'}</TableCell>
                    <TableCell>{v.model ?? '-'}</TableCell>
                    <TableCell>{v.year ?? '-'}</TableCell>
                    <TableCell>
                      {v.vehicleInspectionDate ?? '-'}
                      {isExpiringSoon(v.vehicleInspectionDate) && (
                        <Badge variant="destructive" className="ml-2 text-xs">期限間近</Badge>
                      )}
                    </TableCell>
                    <TableCell><Badge variant={st.variant}>{st.label}</Badge></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(v)}>
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
                              <AlertDialogTitle>この車両を廃車にしますか？</AlertDialogTitle>
                              <AlertDialogDescription>
                                {v.plateNumber} を廃車状態にします。一覧から非表示になります。
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>キャンセル</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleRetire(v)}>廃車にする</AlertDialogAction>
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
        </CardContent>
      </Card>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>車両編集</DialogTitle></DialogHeader>
          {editVehicle && (
            <form onSubmit={onEditSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editPlateNumber">ナンバープレート *</Label>
                <Input id="editPlateNumber" name="editPlateNumber" defaultValue={editVehicle.plateNumber} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editMaker">メーカー</Label>
                  <Input id="editMaker" name="editMaker" defaultValue={editVehicle.maker ?? ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editModel">車種</Label>
                  <Input id="editModel" name="editModel" defaultValue={editVehicle.model ?? ''} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editYear">年式</Label>
                  <Input id="editYear" name="editYear" type="number" defaultValue={editVehicle.year ?? ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editVehicleInspectionDate">車検有効期限</Label>
                  <Input id="editVehicleInspectionDate" name="editVehicleInspectionDate" type="date" defaultValue={editVehicle.vehicleInspectionDate ?? ''} />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={updateVehicle.isPending}>
                {updateVehicle.isPending ? '更新中...' : '更新'}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
