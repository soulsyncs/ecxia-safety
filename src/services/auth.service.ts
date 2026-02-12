import type { AdminUser, Organization } from '@/types/database';
import { supabase, isDemoMode, fromDb, handleSupabaseError } from '@/lib/supabase';
import { authService as demoAuthService } from '@/lib/demo-store';

export interface AuthResult {
  user: AdminUser;
  organization: Organization;
}

async function login(email: string, password: string): Promise<AuthResult> {
  if (isDemoMode) return demoAuthService.login(email, password);

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) handleSupabaseError(error);

  return getCurrentUser();
}

async function logout(): Promise<void> {
  if (isDemoMode) {
    sessionStorage.removeItem('ecxia_logged_in');
    return;
  }
  const { error } = await supabase.auth.signOut();
  if (error) handleSupabaseError(error);
}

async function getCurrentUser(): Promise<AuthResult> {
  if (isDemoMode) return demoAuthService.getCurrentUser();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) handleSupabaseError(authError ?? { message: 'Not authenticated' });

  const { data: adminRow, error: adminError } = await supabase
    .from('admin_users')
    .select('*')
    .eq('id', user.id)
    .single();
  if (adminError || !adminRow) handleSupabaseError(adminError ?? { message: 'Admin user not found' });

  const adminUser = fromDb<AdminUser>(adminRow);

  const { data: orgRow, error: orgError } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', adminRow.organization_id)
    .single();
  if (orgError || !orgRow) handleSupabaseError(orgError ?? { message: 'Organization not found' });

  return { user: adminUser, organization: fromDb<Organization>(orgRow) };
}

function onAuthStateChange(callback: (isLoggedIn: boolean) => void): () => void {
  if (isDemoMode) {
    // デモモード: sessionStorageベース
    const check = () => callback(sessionStorage.getItem('ecxia_logged_in') === 'true');
    check();
    const interval = setInterval(check, 1000);
    return () => clearInterval(interval);
  }

  const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
    callback(event !== 'SIGNED_OUT');
  });
  return () => subscription.unsubscribe();
}

export const authService = { login, logout, getCurrentUser, onAuthStateChange };
