import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useDrivers } from '@/hooks/use-drivers';
import { useVehicles } from '@/hooks/use-vehicles';
import { usePreWorkReports, usePostWorkReports, useDailyInspections, useAccidentReports } from '@/hooks/use-reports';
import { useAuth } from '@/contexts/auth-context';

const PAGE_SIZE = 20;

function usePagination<T>(items: T[]) {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const paginated = items.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  return { page, totalPages, paginated, setPage, total: items.length };
}

export function ReportsPage() {
  const { organization } = useAuth();
  const orgId = organization?.id ?? '';
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]!);
  const [filterDriverId, setFilterDriverId] = useState('');

  const { data: drivers = [] } = useDrivers(orgId);
  const { data: vehicles = [] } = useVehicles(orgId);
  const { data: preWork = [], isLoading: loadingPre } = usePreWorkReports(orgId, date);
  const { data: postWork = [], isLoading: loadingPost } = usePostWorkReports(orgId, date);
  const { data: inspections = [], isLoading: loadingInsp } = useDailyInspections(orgId, date);
  const { data: accidents = [], isLoading: loadingAcc } = useAccidentReports(orgId);

  const loading = loadingPre || loadingPost || loadingInsp || loadingAcc;

  const filterBy = <T extends { driverId: string }>(items: T[]) =>
    filterDriverId ? items.filter(r => r.driverId === filterDriverId) : items;

  const filteredPre = useMemo(() => filterBy(preWork), [preWork, filterDriverId]);
  const filteredPost = useMemo(() => filterBy(postWork), [postWork, filterDriverId]);
  const filteredInsp = useMemo(() => filterBy(inspections), [inspections, filterDriverId]);
  const filteredAcc = useMemo(() => filterBy(accidents), [accidents, filterDriverId]);

  const prePag = usePagination(filteredPre);
  const postPag = usePagination(filteredPost);
  const inspPag = usePagination(filteredInsp);
  const accPag = usePagination(filteredAcc);

  const driverName = (id: string) => drivers.find(d => d.id === id)?.name ?? '-';
  const vehiclePlate = (id: string) => vehicles.find(v => v.id === id)?.plateNumber ?? '-';
  const timeOnly = (iso: string) => {
    try { return new Date(iso).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }); }
    catch { return '-'; }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">日報一覧</h1>
          <p className="text-muted-foreground">ドライバーの報告を日付別に確認</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filterDriverId}
            onChange={e => setFilterDriverId(e.target.value)}
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
          >
            <option value="">全ドライバー</option>
            {drivers.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-44" />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-muted-foreground">読み込み中...</div>
      ) : (
        <Tabs defaultValue="pre-work">
          <TabsList className="mb-4">
            <TabsTrigger value="pre-work">業務前報告 ({filteredPre.length})</TabsTrigger>
            <TabsTrigger value="post-work">業務後報告 ({filteredPost.length})</TabsTrigger>
            <TabsTrigger value="inspection">日常点検 ({filteredInsp.length})</TabsTrigger>
            <TabsTrigger value="accident">事故報告 ({filteredAcc.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pre-work">
            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ドライバー</TableHead>
                      <TableHead>車両</TableHead>
                      <TableHead>出勤時刻</TableHead>
                      <TableHead>アルコール</TableHead>
                      <TableHead>体調</TableHead>
                      <TableHead>疲労</TableHead>
                      <TableHead>睡眠</TableHead>
                      <TableHead>提出方法</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {prePag.paginated.map(r => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{driverName(r.driverId)}</TableCell>
                        <TableCell className="text-sm">{vehiclePlate(r.vehicleId)}</TableCell>
                        <TableCell>{timeOnly(r.clockInAt)}</TableCell>
                        <TableCell>
                          <Badge variant={r.alcoholCheckResult === 'negative' ? 'default' : 'destructive'}>
                            {r.alcoholCheckResult === 'negative' ? '陰性' : '陽性'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={r.healthCondition === 'good' ? 'default' : r.healthCondition === 'fair' ? 'secondary' : 'destructive'}>
                            {r.healthCondition === 'good' ? '良好' : r.healthCondition === 'fair' ? '普通' : '不良'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{r.fatigueLevel === 'none' ? 'なし' : r.fatigueLevel === 'mild' ? '軽度' : '重度'}</TableCell>
                        <TableCell className="text-sm">{r.sleepHours}h</TableCell>
                        <TableCell><Badge variant="outline">{r.submittedVia}</Badge></TableCell>
                      </TableRow>
                    ))}
                    {filteredPre.length === 0 && (
                      <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">この日の業務前報告はありません</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
              {prePag.totalPages > 1 && (
                <div className="flex items-center justify-between px-6 pb-4">
                  <span className="text-sm text-muted-foreground">{prePag.total}件中 {prePag.page * PAGE_SIZE + 1}-{Math.min((prePag.page + 1) * PAGE_SIZE, prePag.total)}件</span>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" disabled={prePag.page === 0} onClick={() => prePag.setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                    <Button variant="outline" size="sm" disabled={prePag.page >= prePag.totalPages - 1} onClick={() => prePag.setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="post-work">
            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ドライバー</TableHead>
                      <TableHead>車両</TableHead>
                      <TableHead>退勤時刻</TableHead>
                      <TableHead>走行距離</TableHead>
                      <TableHead>配送数</TableHead>
                      <TableHead>アルコール</TableHead>
                      <TableHead>道路状況</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {postPag.paginated.map(r => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{driverName(r.driverId)}</TableCell>
                        <TableCell className="text-sm">{vehiclePlate(r.vehicleId)}</TableCell>
                        <TableCell>{timeOnly(r.clockOutAt)}</TableCell>
                        <TableCell>{r.distanceKm} km</TableCell>
                        <TableCell>{r.cargoDeliveredCount ?? '-'}</TableCell>
                        <TableCell>
                          <Badge variant={r.alcoholCheckResult === 'negative' ? 'default' : 'destructive'}>
                            {r.alcoholCheckResult === 'negative' ? '陰性' : '陽性'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{r.roadConditionNote ?? '特になし'}</TableCell>
                      </TableRow>
                    ))}
                    {filteredPost.length === 0 && (
                      <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">この日の業務後報告はありません</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
              {postPag.totalPages > 1 && (
                <div className="flex items-center justify-between px-6 pb-4">
                  <span className="text-sm text-muted-foreground">{postPag.total}件中 {postPag.page * PAGE_SIZE + 1}-{Math.min((postPag.page + 1) * PAGE_SIZE, postPag.total)}件</span>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" disabled={postPag.page === 0} onClick={() => postPag.setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                    <Button variant="outline" size="sm" disabled={postPag.page >= postPag.totalPages - 1} onClick={() => postPag.setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="inspection">
            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ドライバー</TableHead>
                      <TableHead>車両</TableHead>
                      <TableHead>結果</TableHead>
                      <TableHead>エンジン</TableHead>
                      <TableHead>ライト</TableHead>
                      <TableHead>タイヤ</TableHead>
                      <TableHead>運転席</TableHead>
                      <TableHead>異常メモ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inspPag.paginated.map(r => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{driverName(r.driverId)}</TableCell>
                        <TableCell className="text-sm">{vehiclePlate(r.vehicleId)}</TableCell>
                        <TableCell>
                          <Badge variant={r.allPassed ? 'default' : 'destructive'}>
                            {r.allPassed ? '合格' : '異常あり'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">{r.engineOil && r.coolantLevel && r.battery ? '○' : '×'}</TableCell>
                        <TableCell className="text-center">{r.headlights && r.turnSignals && r.brakeLights ? '○' : '×'}</TableCell>
                        <TableCell className="text-center">{r.tirePressure && r.tireTread && r.tireDamage ? '○' : '×'}</TableCell>
                        <TableCell className="text-center">{r.mirrors && r.seatbelt && r.brakes && r.steering ? '○' : '×'}</TableCell>
                        <TableCell className="text-sm">{r.abnormalityNote ?? '-'}</TableCell>
                      </TableRow>
                    ))}
                    {filteredInsp.length === 0 && (
                      <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">この日の日常点検はありません</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
              {inspPag.totalPages > 1 && (
                <div className="flex items-center justify-between px-6 pb-4">
                  <span className="text-sm text-muted-foreground">{inspPag.total}件中 {inspPag.page * PAGE_SIZE + 1}-{Math.min((inspPag.page + 1) * PAGE_SIZE, inspPag.total)}件</span>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" disabled={inspPag.page === 0} onClick={() => inspPag.setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                    <Button variant="outline" size="sm" disabled={inspPag.page >= inspPag.totalPages - 1} onClick={() => inspPag.setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="accident">
            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>発生日時</TableHead>
                      <TableHead>ドライバー</TableHead>
                      <TableHead>場所</TableHead>
                      <TableHead>概要</TableHead>
                      <TableHead>負傷者</TableHead>
                      <TableHead>重大事故</TableHead>
                      <TableHead>状態</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accPag.paginated.map(r => (
                      <TableRow key={r.id}>
                        <TableCell className="text-sm">{new Date(r.occurredAt).toLocaleString('ja-JP')}</TableCell>
                        <TableCell className="font-medium">{driverName(r.driverId)}</TableCell>
                        <TableCell className="text-sm">{r.location}</TableCell>
                        <TableCell className="text-sm max-w-xs truncate">{r.summary}</TableCell>
                        <TableCell>
                          <Badge variant={r.hasInjuries ? 'destructive' : 'default'}>
                            {r.hasInjuries ? 'あり' : 'なし'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={r.isSerious ? 'destructive' : 'secondary'}>
                            {r.isSerious ? '重大' : '軽微'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={r.status === 'reviewed' ? 'default' : 'secondary'}>
                            {r.status === 'draft' ? '下書き' : r.status === 'submitted' ? '提出済' : '確認済'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredAcc.length === 0 && (
                      <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">事故報告はありません</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
              {accPag.totalPages > 1 && (
                <div className="flex items-center justify-between px-6 pb-4">
                  <span className="text-sm text-muted-foreground">{accPag.total}件中 {accPag.page * PAGE_SIZE + 1}-{Math.min((accPag.page + 1) * PAGE_SIZE, accPag.total)}件</span>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" disabled={accPag.page === 0} onClick={() => accPag.setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                    <Button variant="outline" size="sm" disabled={accPag.page >= accPag.totalPages - 1} onClick={() => accPag.setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
