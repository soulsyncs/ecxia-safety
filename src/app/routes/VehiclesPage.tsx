import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { vehicleService } from '@/lib/demo-store';
import type { Vehicle } from '@/types/database';

const statusLabel: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  active: { label: '稼働中', variant: 'default' },
  maintenance: { label: '整備中', variant: 'secondary' },
  retired: { label: '廃車', variant: 'destructive' },
};

export function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    vehicleService.list()
      .then(v => { setVehicles(v); })
      .catch(err => { console.error('Failed to load vehicles:', err); })
      .finally(() => { setLoading(false); });
  }, []);

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const form = new FormData(e.currentTarget);
      const vehicle = await vehicleService.create({
        plateNumber: form.get('plateNumber') as string,
        maker: form.get('maker') as string || null,
        model: form.get('model') as string || null,
        year: form.get('year') ? Number(form.get('year')) : null,
        vehicleInspectionDate: form.get('vehicleInspectionDate') as string || null,
        status: 'active',
      });
      setVehicles(prev => [...prev, vehicle]);
      setDialogOpen(false);
    } catch (err) {
      console.error('Failed to add vehicle:', err);
    }
  };

  const isExpiringSoon = (date: string | null) => {
    if (!date) return false;
    const diff = new Date(date).getTime() - Date.now();
    return diff > 0 && diff < 90 * 24 * 60 * 60 * 1000;
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">読み込み中...</div>;

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
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="plateNumber">ナンバープレート *</Label>
                <Input id="plateNumber" name="plateNumber" required placeholder="市川 480 あ 1234" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maker">メーカー</Label>
                  <Input id="maker" name="maker" placeholder="ダイハツ" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">車種</Label>
                  <Input id="model" name="model" placeholder="ハイゼットカーゴ" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="year">年式</Label>
                  <Input id="year" name="year" type="number" placeholder="2024" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vehicleInspectionDate">車検有効期限</Label>
                  <Input id="vehicleInspectionDate" name="vehicleInspectionDate" type="date" />
                </div>
              </div>
              <Button type="submit" className="w-full">登録</Button>
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
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
