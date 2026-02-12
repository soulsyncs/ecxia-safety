import { useEffect, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { driverService, vehicleService } from '@/lib/demo-store';
import type { Driver, Vehicle } from '@/types/database';

const statusLabel: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  active: { label: '稼働中', variant: 'default' },
  inactive: { label: '退職', variant: 'secondary' },
  suspended: { label: '停止', variant: 'destructive' },
};

export function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    Promise.all([driverService.list(), vehicleService.list()])
      .then(([d, v]) => {
        setDrivers(d);
        setVehicles(v);
      })
      .catch(err => {
        console.error('Failed to load drivers:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const filteredDrivers = drivers.filter(d =>
    d.name.includes(search) || (d.nameKana && d.nameKana.includes(search)) || (d.phone && d.phone.includes(search))
  );

  const getVehiclePlate = (vehicleId: string | null) => {
    if (!vehicleId) return '-';
    return vehicles.find(v => v.id === vehicleId)?.plateNumber ?? '-';
  };

  const handleAddDriver = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const form = new FormData(e.currentTarget);
      const driver = await driverService.create({
        lineUserId: null,
        name: form.get('name') as string,
        nameKana: form.get('nameKana') as string || null,
        phone: form.get('phone') as string || null,
        dateOfBirth: form.get('dateOfBirth') as string || null,
        hireDate: new Date().toISOString().split('T')[0]!,
        licenseNumber: form.get('licenseNumber') as string || null,
        licenseExpiry: null,
        healthCheckDate: null,
        isSenior: false,
        isNewHire: true,
        status: 'active',
        defaultVehicleId: null,
        registrationToken: crypto.randomUUID().slice(0, 8),
      });
      setDrivers(prev => [...prev, driver]);
      setDialogOpen(false);
    } catch (err) {
      console.error('Failed to add driver:', err);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">読み込み中...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">ドライバー管理</h1>
          <p className="text-muted-foreground">{drivers.length}名登録</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />新規登録</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>ドライバー新規登録</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddDriver} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">氏名 *</Label>
                <Input id="name" name="name" required placeholder="山田 太郎" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nameKana">フリガナ</Label>
                <Input id="nameKana" name="nameKana" placeholder="ヤマダ タロウ" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">電話番号</Label>
                <Input id="phone" name="phone" placeholder="090-0000-0000" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">生年月日</Label>
                <Input id="dateOfBirth" name="dateOfBirth" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="licenseNumber">免許証番号</Label>
                <Input id="licenseNumber" name="licenseNumber" placeholder="123456789012" />
              </div>
              <Button type="submit" className="w-full">登録</Button>
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
                        <Badge variant="default" className="bg-[#06C755]">連携済</Badge>
                      ) : driver.registrationToken ? (
                        <Badge variant="secondary">登録待ち</Badge>
                      ) : (
                        <Badge variant="outline">未連携</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={st.variant}>{st.label}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{driver.hireDate ?? '-'}</TableCell>
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
