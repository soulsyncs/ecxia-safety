// submit-shift Edge Function
// LIFF経由のシフト申請・緊急連絡を処理（IDトークン検証 → ドライバー特定 → DB INSERT/UPSERT）
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { checkRateLimit, getClientIp } from '../_shared/rate-limit.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const LINE_CHANNEL_ID = Deno.env.get('LINE_CHANNEL_ID');
const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') ?? 'https://ecxia-safety.vercel.app';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function corsHeaders(origin?: string | null) {
  const allowed = origin === ALLOWED_ORIGIN ? origin : ALLOWED_ORIGIN;
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

/** LINE IDトークンを検証してユーザーIDを取得 */
async function verifyLineIdToken(idToken: string): Promise<string | null> {
  if (!LINE_CHANNEL_ID) return null;
  const res = await fetch('https://api.line.me/oauth2/v2.1/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ id_token: idToken, client_id: LINE_CHANNEL_ID }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.sub ?? null;
}

/** LINE User IDからドライバーを検索 */
async function findDriverByLineUserId(lineUserId: string) {
  const { data, error } = await supabase
    .from('drivers')
    .select('id, organization_id, name')
    .eq('line_user_id', lineUserId)
    .eq('status', 'active')
    .single();
  if (error || !data) return null;
  return data;
}

serve(async (req: Request) => {
  const origin = req.headers.get('Origin');

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(origin) });
  }

  try {
    // レート制限
    const clientIp = getClientIp(req);
    const ipLimit = checkRateLimit(`ip:shift:${clientIp}`, 20, 60_000);
    if (!ipLimit.allowed) {
      return new Response(JSON.stringify({ message: 'リクエスト数が上限を超えました。しばらく待ってから再度お試しください。' }), {
        status: 429,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json', 'Retry-After': String(Math.ceil(ipLimit.retryAfterMs / 1000)) },
      });
    }

    // IDトークン検証
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ message: '認証が必要です' }), {
        status: 401, headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    const lineUserId = await verifyLineIdToken(authHeader.slice(7));
    if (!lineUserId) {
      return new Response(JSON.stringify({ message: 'LINE認証に失敗しました' }), {
        status: 401, headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    const driverRow = await findDriverByLineUserId(lineUserId);
    if (!driverRow) {
      return new Response(JSON.stringify({ message: 'ドライバー登録がされていません。管理者から受け取った登録URLを開いて、LINE連携を完了してください。' }), {
        status: 403, headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { action } = body;

    // シフト取得（当月のシフト一覧）
    if (action === 'get_shifts') {
      const yearMonth = typeof body.yearMonth === 'string' ? body.yearMonth : null;
      if (!yearMonth || !/^\d{4}-\d{2}$/.test(yearMonth)) {
        return new Response(JSON.stringify({ message: '年月の形式が不正です' }), {
          status: 400, headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
        });
      }
      const startDate = `${yearMonth}-01`;
      const endDate = `${yearMonth}-31`;

      const { data: shifts } = await supabase
        .from('shifts')
        .select('shift_date, status, note')
        .eq('driver_id', driverRow.id)
        .gte('shift_date', startDate)
        .lte('shift_date', endDate);

      return new Response(JSON.stringify({
        driverName: driverRow.name,
        shifts: shifts ?? [],
      }), {
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    // シフト申請（希望休の登録）
    if (action === 'request_shift') {
      const shiftDate = typeof body.shiftDate === 'string' ? body.shiftDate : null;
      const status = typeof body.status === 'string' ? body.status : null;
      const note = typeof body.note === 'string' ? body.note : null;

      if (!shiftDate || !/^\d{4}-\d{2}-\d{2}$/.test(shiftDate)) {
        return new Response(JSON.stringify({ message: '日付の形式が不正です' }), {
          status: 400, headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
        });
      }

      const allowedStatuses = ['working', 'day_off', 'half_am', 'half_pm'];
      if (!status || !allowedStatuses.includes(status)) {
        return new Response(JSON.stringify({ message: '無効なシフト種別です' }), {
          status: 400, headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
        });
      }

      const { error: upsertError } = await supabase
        .from('shifts')
        .upsert({
          organization_id: driverRow.organization_id,
          driver_id: driverRow.id,
          shift_date: shiftDate,
          status,
          note,
          submitted_by: 'driver',
        }, { onConflict: 'driver_id,shift_date' });

      if (upsertError) {
        return new Response(JSON.stringify({ message: 'シフト申請に失敗しました' }), {
          status: 500, headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true, message: 'シフトを申請しました' }), {
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    // 緊急連絡の送信
    if (action === 'emergency') {
      const reportType = typeof body.reportType === 'string' ? body.reportType : null;
      const reason = typeof body.reason === 'string' ? body.reason : null;

      const allowedTypes = ['absent', 'vehicle_trouble', 'accident', 'family', 'other'];
      if (!reportType || !allowedTypes.includes(reportType)) {
        return new Response(JSON.stringify({ message: '無効な連絡種別です' }), {
          status: 400, headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
        });
      }

      const jstNow = new Date(Date.now() + 9 * 60 * 60 * 1000);
      const today = jstNow.toISOString().split('T')[0]!;

      // 緊急連絡を登録
      const { error: insertError } = await supabase
        .from('emergency_reports')
        .insert({
          organization_id: driverRow.organization_id,
          driver_id: driverRow.id,
          report_date: today,
          report_type: reportType,
          reason,
          submitted_via: 'liff',
        });

      if (insertError) {
        return new Response(JSON.stringify({ message: '緊急連絡の送信に失敗しました' }), {
          status: 500, headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
        });
      }

      // シフトも欠勤に自動更新
      await supabase
        .from('shifts')
        .upsert({
          organization_id: driverRow.organization_id,
          driver_id: driverRow.id,
          shift_date: today,
          status: 'absent',
          note: `緊急連絡: ${reason ?? reportType}`,
          submitted_by: 'system',
        }, { onConflict: 'driver_id,shift_date' });

      // 管理者にLINEプッシュ通知（緊急連絡があったことを知らせる）
      const { data: org } = await supabase
        .from('organizations')
        .select('name, line_channel_access_token')
        .eq('id', driverRow.organization_id)
        .single();

      if (org?.line_channel_access_token) {
        const { data: admins } = await supabase
          .from('admin_users')
          .select('line_user_id')
          .eq('organization_id', driverRow.organization_id)
          .not('line_user_id', 'is', null);

        const typeLabels: Record<string, string> = {
          absent: '体調不良・欠勤',
          vehicle_trouble: '車両故障',
          accident: '事故',
          family: '家庭の事情',
          other: 'その他',
        };

        const alertMsg = `🚨 緊急連絡\n\n${driverRow.name}さんから緊急連絡がありました。\n種別: ${typeLabels[reportType] ?? reportType}\n${reason ? `理由: ${reason}` : ''}\n\n管理画面の「緊急連絡」ページで確認してください。`;

        for (const admin of admins ?? []) {
          if (!admin.line_user_id) continue;
          try {
            await fetch('https://api.line.me/v2/bot/message/push', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${org.line_channel_access_token}`,
              },
              body: JSON.stringify({
                to: admin.line_user_id,
                messages: [{ type: 'text', text: alertMsg }],
              }),
            });
          } catch {
            // 通知失敗は無視（緊急連絡の登録自体は成功している）
          }
        }
      }

      return new Response(JSON.stringify({ success: true, message: '緊急連絡を送信しました。管理者に通知されます。' }), {
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ message: '無効なアクションです' }), {
      status: 400, headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('submit-shift error:', err instanceof Error ? err.message : 'Unknown error');
    return new Response(JSON.stringify({ message: '内部エラーが発生しました' }), {
      status: 500, headers: { ...corsHeaders(req.headers.get('Origin')), 'Content-Type': 'application/json' },
    });
  }
});
