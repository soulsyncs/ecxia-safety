// morning-reminder Edge Function
// 毎朝08:00にLINEプッシュ通知でリマインド送信
// Cron: 0 23 * * * (UTC = JST 08:00)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { maskName } from '../_shared/pii-mask.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/** 組織ごとのLINE Access Tokenを使ってプッシュ通知 */
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
  // Cron / 手動実行のみ許可（CRON_SECRET検証 - timing-safe）
  const authHeader = req.headers.get('Authorization');
  const cronSecret = Deno.env.get('CRON_SECRET');
  if (!authHeader || !cronSecret || !timingSafeEqual(authHeader, `Bearer ${cronSecret}`)) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // LINE連携済みの全組織を取得
    const { data: orgs } = await supabase
      .from('organizations')
      .select('id, name, line_channel_access_token, settings')
      .not('line_channel_access_token', 'is', null);

    if (!orgs || orgs.length === 0) {
      return new Response(JSON.stringify({ message: 'No organizations with LINE configured', sent: 0 }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let totalSent = 0;

    for (const org of orgs) {
      if (!org.line_channel_access_token) continue;

      // 通知設定チェック — morningReminderがOFFならスキップ
      const notification = (org.settings as Record<string, unknown>)?.notification as Record<string, { enabled: boolean }> | undefined;
      if (notification && !notification.morningReminder?.enabled) continue;

      // 稼働中かつLINE連携済みのドライバーを取得
      const { data: drivers } = await supabase
        .from('drivers')
        .select('id, name, line_user_id')
        .eq('organization_id', org.id)
        .eq('status', 'active')
        .not('line_user_id', 'is', null);

      if (!drivers || drivers.length === 0) continue;

      // 各ドライバーにリマインド送信
      for (const driver of drivers) {
        if (!driver.line_user_id) continue;
        try {
          await pushMessage(org.line_channel_access_token, driver.line_user_id, [{
            type: 'text',
            text: `おはようございます、${driver.name}さん。\n\n本日も安全運転でお願いします。\n業務前報告の提出をお願いします。`,
          }]);
          totalSent++;
        } catch (err) {
          // 個別の送信失敗はスキップ（ブロック済み等）
          console.error(`Failed to send to driver ${driver.id} (${maskName(driver.name)}):`, (err as Error).message);
        }
      }
    }

    return new Response(JSON.stringify({ success: true, sent: totalSent }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Morning reminder error:', (err as Error).message);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
