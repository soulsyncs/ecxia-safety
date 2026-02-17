// check-submissions Edge Function
// 未提出アラート（09:30 / 19:00）+ 管理者サマリー（10:00）
// Cron: 0 0:30 * * * (UTC=JST 09:30), 0 10 * * * (UTC=JST 19:00), 0 1 * * * (UTC=JST 10:00)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { maskName } from '../_shared/pii-mask.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function pushMessage(
  accessToken: string,
  userId: string,
  messages: Array<{ type: string; text: string }>,
) {
  await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ to: userId, messages }),
  });
}

/** Timing-safe string comparison（タイミング攻撃防止） */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const encoder = new TextEncoder();
  const bufA = encoder.encode(a);
  const bufB = encoder.encode(b);
  let diff = 0;
  for (let i = 0; i < bufA.length; i++) {
    diff |= bufA[i]! ^ bufB[i]!;
  }
  return diff === 0;
}

serve(async (req: Request) => {
  // Cron / 手動実行のみ許可（CRON_SECRET または SERVICE_ROLE_KEY で認証）
  const authHeader = req.headers.get('Authorization');
  const cronSecret = Deno.env.get('CRON_SECRET');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const isAuthorized =
    (authHeader && cronSecret && timingSafeEqual(authHeader, `Bearer ${cronSecret}`)) ||
    (authHeader && serviceRoleKey && timingSafeEqual(authHeader, `Bearer ${serviceRoleKey}`));
  if (!isAuthorized) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // リクエストボディからチェック種別を取得
    let checkType = 'pre_work'; // default
    try {
      const body = await req.json();
      checkType = body.type ?? 'pre_work';
    } catch {
      // bodyなしの場合はデフォルト
    }

    // JSTで当日日付を取得（日本はDSTなし、UTC+9固定）
    const jstNow = new Date(Date.now() + 9 * 60 * 60 * 1000);
    const today = jstNow.toISOString().split('T')[0]!;

    // LINE連携済みの全組織を取得
    const { data: orgs } = await supabase
      .from('organizations')
      .select('id, name, line_channel_access_token, settings')
      .not('line_channel_access_token', 'is', null);

    if (!orgs || orgs.length === 0) {
      return new Response(JSON.stringify({ message: 'No organizations', checked: 0 }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let totalAlerts = 0;

    for (const org of orgs) {
      if (!org.line_channel_access_token) continue;

      // 通知設定チェック — 該当する通知タイプがOFFならスキップ
      const notification = (org.settings as Record<string, unknown>)?.notification as Record<string, { enabled: boolean }> | undefined;
      if (notification) {
        if (checkType === 'pre_work' && !notification.preWorkAlert?.enabled) continue;
        if (checkType === 'post_work' && !notification.postWorkAlert?.enabled) continue;
        if (checkType === 'admin_summary' && !notification.adminSummary?.enabled) continue;
      }

      // 稼働中ドライバー一覧
      const { data: drivers } = await supabase
        .from('drivers')
        .select('id, name, line_user_id')
        .eq('organization_id', org.id)
        .eq('status', 'active')
        .not('line_user_id', 'is', null);

      if (!drivers || drivers.length === 0) continue;

      const driverIds = drivers.map(d => d.id);

      if (checkType === 'pre_work') {
        // 業務前報告の未提出者チェック
        const { data: submitted } = await supabase
          .from('pre_work_reports')
          .select('driver_id')
          .eq('report_date', today)
          .in('driver_id', driverIds);

        const submittedIds = new Set((submitted ?? []).map(r => r.driver_id));
        const missing = drivers.filter(d => !submittedIds.has(d.id));

        for (const driver of missing) {
          if (!driver.line_user_id) continue;
          try {
            await pushMessage(org.line_channel_access_token, driver.line_user_id, [{
              type: 'text',
              text: `${driver.name}さん、業務前報告が未提出です。\n\n安全確認のため、早めの提出をお願いします。`,
            }]);
            totalAlerts++;
          } catch {
            // skip
          }
        }
      } else if (checkType === 'post_work') {
        // 業務後報告の未提出者チェック
        const { data: submitted } = await supabase
          .from('post_work_reports')
          .select('driver_id')
          .eq('report_date', today)
          .in('driver_id', driverIds);

        const submittedIds = new Set((submitted ?? []).map(r => r.driver_id));
        const missing = drivers.filter(d => !submittedIds.has(d.id));

        for (const driver of missing) {
          if (!driver.line_user_id) continue;
          try {
            await pushMessage(org.line_channel_access_token, driver.line_user_id, [{
              type: 'text',
              text: `${driver.name}さん、業務後報告が未提出です。\n\n本日の業務後報告の提出をお願いします。`,
            }]);
            totalAlerts++;
          } catch {
            // skip
          }
        }
      } else if (checkType === 'admin_summary') {
        // 管理者サマリー通知
        const { data: preSubmitted } = await supabase
          .from('pre_work_reports')
          .select('driver_id')
          .eq('report_date', today)
          .in('driver_id', driverIds);

        const { data: inspSubmitted } = await supabase
          .from('daily_inspections')
          .select('driver_id')
          .eq('inspection_date', today)
          .in('driver_id', driverIds);

        const total = drivers.length;
        const preSubmittedIds = new Set((preSubmitted ?? []).map(r => r.driver_id));
        const inspSubmittedIds = new Set((inspSubmitted ?? []).map(r => r.driver_id));
        const preCount = preSubmittedIds.size;
        const inspCount = inspSubmittedIds.size;

        const preMissing = drivers
          .filter(d => !preSubmittedIds.has(d.id))
          .map(d => d.name);
        const inspMissing = drivers
          .filter(d => !inspSubmittedIds.has(d.id))
          .map(d => d.name);

        // LINE連携済みの管理者を取得
        const { data: admins } = await supabase
          .from('admin_users')
          .select('id, name, line_user_id')
          .eq('organization_id', org.id)
          .not('line_user_id', 'is', null);

        if (!admins || admins.length === 0) {
          console.log(`Admin summary for org ${org.id}: no LINE-linked admins, skipping`);
          continue;
        }

        // サマリーテキスト
        let summary = `【${org.name}】本日の提出状況（${today}）\n\n`;
        summary += `📋 業務前報告: ${preCount}/${total}名\n`;
        if (preMissing.length > 0) {
          summary += `  未提出: ${preMissing.join('、')}\n`;
        }
        summary += `\n🔧 日常点検: ${inspCount}/${total}名\n`;
        if (inspMissing.length > 0) {
          summary += `  未提出: ${inspMissing.join('、')}\n`;
        }

        if (preMissing.length === 0 && inspMissing.length === 0) {
          summary += '\n✅ 全員提出済みです。';
        } else {
          summary += `\n⚠️ 未提出者がいます。確認をお願いします。`;
        }

        // LINE連携済みの全管理者にプッシュ通知
        for (const admin of admins) {
          if (!admin.line_user_id) continue;
          try {
            await pushMessage(org.line_channel_access_token, admin.line_user_id, [{
              type: 'text',
              text: summary,
            }]);
            totalAlerts++;
          } catch {
            console.error(`Failed to send admin summary to admin ${admin.id}`);
          }
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      type: checkType,
      alerts: totalAlerts,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Check submissions error:', (err as Error).message);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
