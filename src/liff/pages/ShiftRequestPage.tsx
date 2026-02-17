import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { isDemoMode } from '@/lib/supabase';
import { useLiffAuth } from '@/liff/hooks/use-liff-auth';
import { shiftService as demoShiftService } from '@/lib/demo-store';

const EDGE_FUNCTION_BASE = import.meta.env.VITE_SUPABASE_URL
  ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`
  : '';

type ShiftStatus = 'working' | 'day_off' | 'half_am' | 'half_pm';

const STATUS_LABELS: Record<ShiftStatus, string> = {
  working: '出勤',
  day_off: '休み',
  half_am: '午前のみ',
  half_pm: '午後のみ',
};

const STATUS_COLORS: Record<ShiftStatus, string> = {
  working: 'bg-green-100 text-green-800 border-green-300',
  day_off: 'bg-gray-100 text-gray-600 border-gray-300',
  half_am: 'bg-blue-100 text-blue-800 border-blue-300',
  half_pm: 'bg-orange-100 text-orange-800 border-orange-300',
};

interface ShiftEntry {
  shift_date: string;
  status: string;
  note: string | null;
}

export function ShiftRequestPage() {
  const { driver, idToken } = useLiffAuth();
  const [shifts, setShifts] = useState<ShiftEntry[]>([]);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const yearMonth = `${currentMonth.year}-${String(currentMonth.month + 1).padStart(2, '0')}`;

  // 月のカレンダー日付を生成
  const days = useMemo(() => {
    const result: { date: string; dayOfWeek: number; day: number }[] = [];
    const daysInMonth = new Date(currentMonth.year, currentMonth.month + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(currentMonth.year, currentMonth.month, d);
      result.push({
        date: dateObj.toISOString().split('T')[0]!,
        dayOfWeek: dateObj.getDay(),
        day: d,
      });
    }
    return result;
  }, [currentMonth.year, currentMonth.month]);

  // シフトデータ取得
  useEffect(() => {
    if (!driver) return;

    async function fetchShifts() {
      if (isDemoMode) {
        const data = await demoShiftService.listByMonth(currentMonth.year, currentMonth.month + 1);
        const myShifts = data.filter(s => s.driverId === driver!.id);
        setShifts(myShifts.map(s => ({ shift_date: s.shiftDate, status: s.status, note: s.note })));
        return;
      }
      try {
        const res = await fetch(`${EDGE_FUNCTION_BASE}/submit-shift`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
          },
          body: JSON.stringify({ action: 'get_shifts', yearMonth }),
        });
        if (res.ok) {
          const data = await res.json();
          setShifts(data.shifts ?? []);
        }
      } catch {
        // 取得失敗は無視
      }
    }
    fetchShifts();
  }, [driver, idToken, yearMonth]);

  if (!driver) return null;

  const shiftMap = new Map(shifts.map(s => [s.shift_date, s.status]));
  const today = new Date().toISOString().split('T')[0]!;

  const handleShiftRequest = async (date: string, status: ShiftStatus) => {
    setSubmitting(date);
    setMessage(null);
    try {
      if (isDemoMode) {
        await demoShiftService.upsert(driver.id, date, status, 'driver');
        setShifts(prev => {
          const filtered = prev.filter(s => s.shift_date !== date);
          return [...filtered, { shift_date: date, status, note: null }];
        });
        setMessage({ type: 'success', text: `${date} を「${STATUS_LABELS[status]}」に設定しました` });
      } else {
        const res = await fetch(`${EDGE_FUNCTION_BASE}/submit-shift`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
          },
          body: JSON.stringify({ action: 'request_shift', shiftDate: date, status }),
        });
        const data = await res.json();
        if (res.ok) {
          setShifts(prev => {
            const filtered = prev.filter(s => s.shift_date !== date);
            return [...filtered, { shift_date: date, status, note: null }];
          });
          setMessage({ type: 'success', text: data.message ?? '申請しました' });
        } else {
          setMessage({ type: 'error', text: data.message ?? '申請に失敗しました' });
        }
      }
    } catch {
      setMessage({ type: 'error', text: '通信エラーが発生しました' });
    } finally {
      setSubmitting(null);
    }
  };

  const prevMonth = () => {
    setCurrentMonth(prev => {
      if (prev.month === 0) return { year: prev.year - 1, month: 11 };
      return { ...prev, month: prev.month - 1 };
    });
  };
  const nextMonth = () => {
    setCurrentMonth(prev => {
      if (prev.month === 11) return { year: prev.year + 1, month: 0 };
      return { ...prev, month: prev.month + 1 };
    });
  };

  const dayLabels = ['日', '月', '火', '水', '木', '金', '土'];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-5 w-5 text-[#49b93d]" />
            シフト申請
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            日付をタップして出勤/休みを申請できます
          </p>
        </CardHeader>
        <CardContent>
          {/* 月ナビ */}
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="sm" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-bold text-sm">{currentMonth.year}年 {currentMonth.month + 1}月</span>
            <Button variant="ghost" size="sm" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* メッセージ */}
          {message && (
            <div className={`text-xs p-2 rounded mb-3 ${
              message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {message.text}
            </div>
          )}

          {/* 凡例 */}
          <div className="flex flex-wrap gap-2 mb-3">
            {(Object.entries(STATUS_LABELS) as [ShiftStatus, string][]).map(([key, label]) => (
              <span key={key} className={`text-xs px-2 py-0.5 rounded border ${STATUS_COLORS[key]}`}>
                {label}
              </span>
            ))}
          </div>

          {/* カレンダー */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {dayLabels.map((d, i) => (
              <div key={d} className={`font-bold py-1 ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : ''}`}>
                {d}
              </div>
            ))}
            {/* 月初の空白 */}
            {Array.from({ length: days[0]?.dayOfWeek ?? 0 }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {/* 日付 */}
            {days.map(d => {
              const currentStatus = shiftMap.get(d.date) as ShiftStatus | undefined;
              const isPast = d.date < today;
              const isToday = d.date === today;
              const isLoading = submitting === d.date;

              return (
                <div
                  key={d.date}
                  className={`relative rounded p-1 min-h-[52px] border ${
                    isToday ? 'border-[#49b93d] border-2' : 'border-gray-100'
                  } ${isPast ? 'opacity-50' : ''}`}
                >
                  <div className={`text-xs mb-0.5 ${
                    d.dayOfWeek === 0 ? 'text-red-500' : d.dayOfWeek === 6 ? 'text-blue-500' : ''
                  }`}>
                    {d.day}
                  </div>
                  {currentStatus && (
                    <div className={`text-[10px] px-1 rounded ${STATUS_COLORS[currentStatus] ?? ''}`}>
                      {STATUS_LABELS[currentStatus] ?? ''}
                    </div>
                  )}
                  {!isPast && !isLoading && (
                    <select
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      value={currentStatus ?? ''}
                      onChange={(e) => {
                        if (e.target.value) {
                          handleShiftRequest(d.date, e.target.value as ShiftStatus);
                        }
                      }}
                    >
                      <option value="">選択</option>
                      <option value="working">出勤</option>
                      <option value="day_off">休み</option>
                      <option value="half_am">午前のみ</option>
                      <option value="half_pm">午後のみ</option>
                    </select>
                  )}
                  {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded">
                      <div className="animate-spin h-3 w-3 border-2 border-[#49b93d] border-t-transparent rounded-full" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
