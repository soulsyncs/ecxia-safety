import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { AdminUser, Organization } from '@/types/database';
import { authService } from '@/services';
import { isDemoMode } from '@/lib/supabase';

interface AuthState {
  user: AdminUser | null;
  organization: Organization | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthState>({
  user: null,
  organization: null,
  isLoading: true,
  isAuthenticated: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    organization: null,
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    if (isDemoMode) {
      const isLoggedIn = sessionStorage.getItem('ecxia_logged_in') === 'true';
      if (isLoggedIn) {
        authService.getCurrentUser().then((result) => {
          setState({ user: result.user, organization: result.organization, isLoading: false, isAuthenticated: true });
        });
      } else {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
      return;
    }

    const unsubscribe = authService.onAuthStateChange((isLoggedIn) => {
      if (isLoggedIn) {
        authService.getCurrentUser().then((result) => {
          setState({ user: result.user, organization: result.organization, isLoading: false, isAuthenticated: true });
        }).catch(() => {
          setState({ user: null, organization: null, isLoading: false, isAuthenticated: false });
        });
      } else {
        setState({ user: null, organization: null, isLoading: false, isAuthenticated: false });
      }
    });

    return unsubscribe;
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
