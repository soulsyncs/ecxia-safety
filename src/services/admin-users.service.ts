import type { AdminUser } from '@/types/database';
import type { CreateAdminInput } from '@/lib/validations';
import { supabase, isDemoMode, fromDb, fromDbArray, handleSupabaseError } from '@/lib/supabase';
import { adminUserService as demoAdminUserService } from '@/lib/demo-store';

async function list(organizationId: string): Promise<AdminUser[]> {
  if (isDemoMode) return demoAdminUserService.list();

  const { data, error } = await supabase.from('admin_users').select('*')
    .eq('organization_id', organizationId)
    .order('name');
  if (error) handleSupabaseError(error);
  return fromDbArray<AdminUser>(data ?? []);
}

async function create(input: CreateAdminInput, _organizationId: string): Promise<AdminUser> {
  if (isDemoMode) return demoAdminUserService.create(input);

  // Edge Function経由でサーバーサイドで作成（呼び出し元のセッションは影響なし）
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) handleSupabaseError({ message: 'ログインが必要です' });

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const res = await fetch(`${supabaseUrl}/functions/v1/create-admin-user`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      email: input.email,
      password: input.password,
      name: input.name,
      role: input.role,
    }),
  });

  const result = await res.json();
  if (!res.ok) {
    throw new Error(result.message ?? 'スタッフの追加に失敗しました');
  }

  return fromDb<AdminUser>(result.adminUser);
}

async function remove(id: string, organizationId: string): Promise<void> {
  if (isDemoMode) {
    demoAdminUserService.remove(id);
    return;
  }

  // 最後のorg_admin削除を防止
  const { data: orgAdmins, error: countError } = await supabase
    .from('admin_users')
    .select('id, role')
    .eq('organization_id', organizationId)
    .eq('role', 'org_admin');

  if (countError) handleSupabaseError(countError);

  const isTargetOrgAdmin = orgAdmins?.some(a => a.id === id);
  if (isTargetOrgAdmin && (orgAdmins?.length ?? 0) <= 1) {
    throw new Error('管理者が1名のみのため削除できません。先に別の管理者を追加してください。');
  }

  const { error } = await supabase.from('admin_users').delete()
    .eq('id', id)
    .eq('organization_id', organizationId);
  if (error) handleSupabaseError(error);
}

/** LINE連携用トークンを生成 */
async function generateLineToken(id: string, organizationId: string): Promise<string> {
  if (isDemoMode) {
    return demoAdminUserService.generateLineToken(id);
  }

  const token = crypto.randomUUID();
  const { error } = await supabase
    .from('admin_users')
    .update({ line_registration_token: token })
    .eq('id', id)
    .eq('organization_id', organizationId);
  if (error) handleSupabaseError(error);
  return token;
}

/** LINE連携を解除 */
async function unlinkLine(id: string, organizationId: string): Promise<void> {
  if (isDemoMode) {
    demoAdminUserService.unlinkLine(id);
    return;
  }

  const { error } = await supabase
    .from('admin_users')
    .update({ line_user_id: null, line_registration_token: null })
    .eq('id', id)
    .eq('organization_id', organizationId);
  if (error) handleSupabaseError(error);
}

export const adminUsersService = { list, create, remove, generateLineToken, unlinkLine };
