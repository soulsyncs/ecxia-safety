// create-admin-user Edge Function
// 管理者（org_admin）が新しいスタッフアカウントを作成する
// service_roleキーで Auth + admin_users テーブルに登録
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') ?? 'https://ecxia-safety.vercel.app';

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function corsHeaders(origin?: string | null) {
  const allowed = origin === ALLOWED_ORIGIN ? origin : ALLOWED_ORIGIN;
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

serve(async (req: Request) => {
  const origin = req.headers.get('Origin');

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(origin) });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ message: 'Method not allowed' }), {
      status: 405, headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
    });
  }

  try {
    // 呼び出し元の認証トークンから管理者を特定
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ message: '認証が必要です' }), {
        status: 401, headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    const jwt = authHeader.slice(7);
    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(jwt);
    if (authError || !caller) {
      return new Response(JSON.stringify({ message: '認証に失敗しました' }), {
        status: 401, headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    // 呼び出し元がorg_adminであることを確認
    const { data: callerAdmin, error: callerError } = await supabaseAdmin
      .from('admin_users')
      .select('role, organization_id')
      .eq('id', caller.id)
      .single();

    if (callerError || !callerAdmin || callerAdmin.role !== 'org_admin') {
      return new Response(JSON.stringify({ message: 'この操作にはorg_admin権限が必要です' }), {
        status: 403, headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    // リクエストボディの検証
    const body = await req.json();
    const { email, password, name, role } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return new Response(JSON.stringify({ message: '有効なメールアドレスを入力してください' }), {
        status: 400, headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }
    if (!password || typeof password !== 'string' || password.length < 8) {
      return new Response(JSON.stringify({ message: 'パスワードは8文字以上で入力してください' }), {
        status: 400, headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return new Response(JSON.stringify({ message: '氏名は必須です' }), {
        status: 400, headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }
    if (!['org_admin', 'manager'].includes(role)) {
      return new Response(JSON.stringify({ message: '無効な権限です' }), {
        status: 400, headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    // Supabase Admin APIでユーザー作成（呼び出し元のセッションは影響なし）
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim(),
      password,
      email_confirm: true,
    });

    if (createError) {
      // 重複メールの場合
      if (createError.message?.includes('already')) {
        return new Response(JSON.stringify({ message: 'このメールアドレスは既に登録されています' }), {
          status: 409, headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ message: 'ユーザー作成に失敗しました' }), {
        status: 500, headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    // admin_usersテーブルに追加
    const { data: adminRow, error: insertError } = await supabaseAdmin
      .from('admin_users')
      .insert({
        id: newUser.user.id,
        organization_id: callerAdmin.organization_id,
        email: email.trim(),
        name: name.trim(),
        role,
      })
      .select()
      .single();

    if (insertError) {
      // ロールバック：admin_usersの挿入に失敗した場合、Authユーザーも削除
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      return new Response(JSON.stringify({ message: 'スタッフ登録に失敗しました。再度お試しください。' }), {
        status: 500, headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      adminUser: {
        id: adminRow.id,
        email: adminRow.email,
        name: adminRow.name,
        role: adminRow.role,
        organization_id: adminRow.organization_id,
        created_at: adminRow.created_at,
        updated_at: adminRow.updated_at,
      },
    }), {
      status: 201,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('create-admin-user error:', err instanceof Error ? err.message : 'Unknown error');
    return new Response(JSON.stringify({ message: '内部エラーが発生しました' }), {
      status: 500, headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
    });
  }
});
