// link-driver Edge Function
// ドライバーLINE連携: registration_token検証 → line_user_id自動紐付け
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

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

serve(async (req: Request) => {
  const origin = req.headers.get('Origin');

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(origin) });
  }

  try {
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

    const body = await req.json();
    const registrationToken = typeof body.registrationToken === 'string' ? body.registrationToken : null;
    if (!registrationToken) {
      return new Response(JSON.stringify({ message: '登録トークンが必要です' }), {
        status: 400, headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    // registration_tokenでドライバーを検索
    const { data: driver, error: findError } = await supabase
      .from('drivers')
      .select('id, name, organization_id')
      .eq('registration_token', registrationToken)
      .is('line_user_id', null)
      .single();

    if (findError || !driver) {
      return new Response(JSON.stringify({ message: '無効な登録トークンです。管理者に確認してください。' }), {
        status: 404, headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    // 既に別のドライバーに紐付いていないか確認
    const { data: existing } = await supabase
      .from('drivers')
      .select('id')
      .eq('line_user_id', lineUserId)
      .single();

    if (existing) {
      return new Response(JSON.stringify({ message: 'このLINEアカウントは既に別のドライバーに紐付けられています' }), {
        status: 409, headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    // LINE User IDを紐付け + registration_tokenをNULL化（使い捨て）
    const { error: updateError } = await supabase
      .from('drivers')
      .update({
        line_user_id: lineUserId,
        registration_token: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', driver.id);

    if (updateError) {
      throw new Error(`紐付けに失敗しました: ${updateError.message}`);
    }

    return new Response(JSON.stringify({
      success: true,
      message: `${driver.name} さんのLINE連携が完了しました`,
      driverName: driver.name,
    }), {
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : '内部エラーが発生しました';
    return new Response(JSON.stringify({ message }), {
      status: 500, headers: { ...corsHeaders(req.headers.get('Origin')), 'Content-Type': 'application/json' },
    });
  }
});
