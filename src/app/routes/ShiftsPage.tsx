import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Users, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';
import { useDrivers } from '@/hooks/use-drivers';
import { useShiftsByMonth, useUpsertShift, useBulkUpsertShifts } from '@/hooks/use-shifts';
import type { ShiftStatus, Shift } from '@/types/database';

const STATUS_LABELS: Record<ShiftStatus, string> = {
  working: '出勤',
  day_off: '休み',
  half_am: '午前のみ',
  half_pm: '午後のみ',
  absent: '欠勤',
  pending: '未定',
};

const STATUS_COLORS: Record<ShiftStatus, string> = {
  working: 'bg-green-100 text-green-800',
  day_off: 'bg-gray-100 text-gray-600',
  half_am: 'bg-blue-100 text-blue-800',
  half_pm: 'bg-blue-100 text-blue-800',
  absent: 'bg-red-100 text-red-800',
  pending: 'bg-yellow-100 text-yellow-800',
};

const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

export function ShiftsPage() {
  const { organization } = useAuth();
  const orgId = organization?.id ?? '';

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);

  const { data: drivers = [] } = useDrivers(orgId);
  const activeDrivers = useMemo(() => drivers.filter(d => d.status === 'active'), [drivers]);
  const { data: shifts = [], isLoading } = useShiftsByMonth(orgId, year, month);
  const upsertMutation = useUpsertShift(orgId);
  const bulkMutation = useBulkUpsertShifts(orgId);

  // 月のカレンダー情報
  const daysInMonth = new Date(year, month, 0).getDate();
  const dates = Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(year, month - 1, i + 1);
    return {
      date: `${year}-${String(month).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`,
      day: i + 1,
      weekday: d.getDay(),
    };
  });

  // シフトのマップ: key = `driverId-date`
  const shiftMap = useMemo(() => {
    const map = new Map<string, Shift>();
    for (const s of shifts) {
      map.set(`${s.driverId}-${s.shiftDate}`, s);
    }
    return map;
  }, [shifts]);

  const getShiftStatus = (driverId: string, date: string): ShiftStatus | null => {
    return shiftMap.get(`${driverId}-${date}`)?.status ?? null;
  };

  const handleStatusChange = (driverId: string, date: string, status: ShiftStatus) => {
    upsertMutation.mutate({ driverId, date, status });
  };

  const handlePrevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  };

  const handleNextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  };

  // テンプレート：平日は出勤、土日は休み
  const applyWeekdayTemplate = () => {
    const entries = activeDrivers.flatMap(driver =>
      dates.map(d => ({
        driverId: driver.id,
        date: d.date,
        status: (d.weekday === 0 || d.weekday === 6 ? 'day_off' : 'working') as ShiftStatus,
      }))
    );
    bulkMutation.mutate(entries);
  };

  // 日ごとの出勤人数
  const dailyCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const d of dates) {
      let count = 0;
      for (const driver of activeDrivers) {
        const status = getShiftStatus(driver.id, d.date);
        if (status === 'working' || status === 'half_am' || status === 'half_pm') count++;
      }
      counts[d.date] = count;
    }
    return counts;
  }, [dates, activeDrivers, shiftMap]);

  const todayStr = today.toISOString().split('T')[0]!;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">シフト管理</h1>
          <p className="text-muted-foreground">ドライバーの出勤・休みの予定を管理します</p>
        </div>
        <Button onClick={applyWeekdayTemplate} variant="outline" disabled={bulkMutation.isPending}>
          <Copy className="h-4 w-4 mr-2" />
          {bulkMutation.isPending ? '適用中...' : '平日出勤テンプレート適用'}
        </Button>
      </div>

      {/* 月切り替え */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={handlePrevMonth}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {year}年 {month}月
            </h2>
            <Button variant="ghost" onClick={handleNextMonth}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 出勤人数サマリー */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            日別出勤人数
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-1 flex-wrap">
            {dates.map(d => {
              const count = dailyCounts[d.date] ?? 0;
              const isWeekend = d.weekday === 0 || d.weekday === 6;
              const isToday = d.date === todayStr;
              return (
                <div
                  key={d.date}
                  className={`w-10 h-14 flex flex-col items-center justify-center rounded text-xs border ${
                    isToday ? 'border-green-500 border-2' : 'border-gray-200'
                  } ${isWeekend ? 'bg-gray-50' : ''} ${
                    count === 0 && !isWeekend ? 'bg-red-50' : ''
                  }`}
                >
                  <span className={`text-[10px] ${isWeekend ? 'text-red-400' : 'text-gray-400'}`}>
                    {d.day}
                  </span>
                  <span className={`text-[10px] ${isWeekend ? 'text-red-400' : 'text-gray-400'}`}>
                    {WEEKDAY_LABELS[d.weekday]}
                  </span>
                  <span className={`font-bold ${count === 0 ? 'text-red-500' : 'text-green-700'}`}>
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* シフト表 */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">読み込み中...</p>
          ) : activeDrivers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">ドライバーが登録されていません</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="sticky left-0 bg-white z-10 text-left p-2 border-b min-w-[120px]">
                      ドライバー
                    </th>
                    {dates.map(d => {
                      const isWeekend = d.weekday === 0 || d.weekday === 6;
                      const isToday = d.date === todayStr;
                      return (
                        <th
                          key={d.date}
                          className={`text-center p-1 border-b min-w-[56px] ${
                            isWeekend ? 'bg-gray-50 text-red-400' : ''
                          } ${isToday ? 'bg-green-50' : ''}`}
                        >
                          <div className="text-xs">{d.day}</div>
                          <div className="text-[10px]">{WEEKDAY_LABELS[d.weekday]}</div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {activeDrivers.map(driver => (
                    <tr key={driver.id} className="hover:bg-gray-50">
                      <td className="sticky left-0 bg-white z-10 p-2 border-b font-medium whitespace-nowrap">
                        {driver.name}
                      </td>
                      {dates.map(d => {
                        const status = getShiftStatus(driver.id, d.date);
                        const isToday = d.date === todayStr;
                        return (
                          <td
                            key={d.date}
                            className={`text-center p-1 border-b ${isToday ? 'bg-green-50' : ''}`}
                          >
                            <select
                              value={status ?? ''}
                              onChange={e => {
                                if (e.target.value) {
                                  handleStatusChange(driver.id, d.date, e.target.value as ShiftStatus);
                                }
                              }}
                              className={`text-xs w-full rounded px-1 py-0.5 border-0 cursor-pointer ${
                                status ? STATUS_COLORS[status] : 'bg-white text-gray-300'
                              }`}
                            >
                              <option value="">--</option>
                              <option value="working">出勤</option>
                              <option value="day_off">休み</option>
                              <option value="half_am">午前</option>
                              <option value="half_pm">午後</option>
                            </select>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 凡例 */}
      <div className="mt-4 flex gap-3 text-xs text-muted-foreground">
        {(['working', 'day_off', 'half_am', 'half_pm', 'absent'] as ShiftStatus[]).map(s => (
          <span key={s} className="flex items-center gap-1">
            <span className={`inline-block w-3 h-3 rounded ${STATUS_COLORS[s]}`} />
            {STATUS_LABELS[s]}
          </span>
        ))}
      </div>
    </div>
  );
}
