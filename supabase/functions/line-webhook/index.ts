// line-webhook Edge Function
// LINE Webhook受信: X-Line-Signature検証 + イベント処理
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const LINE_CHANNEL_SECRET = Deno.env.get('LINE_CHANNEL_SECRET');
const LINE_CHANNEL_ACCESS_TOKEN = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/** X-Line-Signature検証（timing-safe比較） */
async function verifySignature(body: string, signature: string): Promise<boolean> {
  if (!LINE_CHANNEL_SECRET) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(LINE_CHANNEL_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  const expected = new Uint8Array(sig);

  // Base64デコードして比較（timing-safe）
  const received = Uint8Array.from(atob(signature), c => c.charCodeAt(0));
  if (expected.length !== received.length) return false;

  // timing-safe comparison: 全バイトを比較してから結果を返す
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected[i]! ^ received[i]!;
  }
  return diff === 0;
}

/** LINE Reply API */
async function replyMessage(replyToken: string, messages: Array<{ type: string; text: string }>) {
  if (!LINE_CHANNEL_ACCESS_TOKEN) return;
  await fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({ replyToken, messages }),
  });
}

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    // FAIL CLOSED: LINE_CHANNEL_SECRETが未設定なら全リクエスト拒否
    if (!LINE_CHANNEL_SECRET) {
      return new Response('Service Unavailable: LINE not configured', { status: 503 });
    }

    const body = await req.text();
    const signature = req.headers.get('X-Line-Signature') ?? '';

    // 署名検証（必須 — スキップ不可）
    const valid = await verifySignature(body, signature);
    if (!valid) {
      return new Response('Invalid signature', { status: 403 });
    }

    const { events } = JSON.parse(body);
    if (!Array.isArray(events)) {
      return new Response('OK', { status: 200 });
    }

    for (const event of events) {
      // 友だち追加
      if (event.type === 'follow') {
        const lineUserId = event.source?.userId;
        if (!lineUserId) continue;

        // 既存ドライバーか確認
        const { data: driver } = await supabase
          .from('drivers')
          .select('name')
          .eq('line_user_id', lineUserId)
          .single();

        if (driver) {
          await replyMessage(event.replyToken, [{
            type: 'text',
            text: `${driver.name} さん、ECXIA安全管理システムへようこそ！\n\n画面下部のメニューから日報の提出ができます。`,
          }]);
        } else {
          await replyMessage(event.replyToken, [{
            type: 'text',
            text: 'ECXIA安全管理システムです。\n\n管理者から受け取った登録URLを開いて、LINE連携を完了してください。',
          }]);
        }
      }

      // メッセージ受信
      if (event.type === 'message' && event.message?.type === 'text') {
        const text = (event.message.text ?? '').trim();
        const textLower = text.toLowerCase();
        const lineUserId = event.source?.userId;

        // 管理者LINE連携: 登録トークンによる紐付け
        // トークンはUUID形式（8-4-4-4-12）→ 管理画面で生成されたもの
        if (lineUserId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(text)) {
          const { data: admin, error: adminError } = await supabase
            .from('admin_users')
            .select('id, name, line_registration_token')
            .eq('line_registration_token', text)
            .single();

          if (!adminError && admin) {
            // トークン一致 → LINE User IDを紐付け、トークンを無効化（アトミック更新）
            const { data: updateResult, error: updateError } = await supabase
              .from('admin_users')
              .update({ line_user_id: lineUserId, line_registration_token: null })
              .eq('id', admin.id)
              .eq('line_registration_token', text)
              .select('id')
              .single();

            if (!updateError && updateResult) {
              await replyMessage(event.replyToken, [{
                type: 'text',
                text: `${admin.name}さん、LINE連携が完了しました！\n\n今後、提出状況のサマリー通知がこのLINEに届きます。`,
              }]);
            } else {
              await replyMessage(event.replyToken, [{
                type: 'text',
                text: 'LINE連携の処理中にエラーが発生しました。管理画面から再度お試しください。',
              }]);
            }
            continue;
          }
          // トークンが見つからない場合はドライバーの登録トークンかもしれないのでフォールスルー
        }

        if (textLower.includes('ヘルプ') || textLower === 'help') {
          await replyMessage(event.replyToken, [{
            type: 'text',
            text: 'ECXIA安全管理システム\n\n画面下部のメニューから以下の操作ができます：\n・出勤 → 業務前報告\n・点検 → 日常点検\n・退勤 → 業務後報告\n・事故 → 事故報告',
          }]);
        }
      }
    }

    return new Response('OK', { status: 200 });
  } catch (_err) {
    return new Response('Internal Server Error', { status: 500 });
  }
});
