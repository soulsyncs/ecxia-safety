import { createRouter, createRoute, createRootRoute, redirect } from '@tanstack/react-router';
import { RootLayout } from '@/app/layouts/RootLayout';
import { AdminLayout } from '@/app/layouts/AdminLayout';
import { LiffLayout } from '@/liff/layouts/LiffLayout';
import { LoginPage } from '@/app/routes/LoginPage';
import { DashboardPage } from '@/app/routes/DashboardPage';
import { DriversPage } from '@/app/routes/DriversPage';
import { VehiclesPage } from '@/app/routes/VehiclesPage';
import { ReportsPage } from '@/app/routes/ReportsPage';
import { ExportPage } from '@/app/routes/ExportPage';
import { AdminUsersPage } from '@/app/routes/AdminUsersPage';
import { NotificationSettingsPage } from '@/app/routes/NotificationSettingsPage';
import { ShiftsPage } from '@/app/routes/ShiftsPage';
import { EmergencyPage } from '@/app/routes/EmergencyPage';
import { PreWorkFormPage } from '@/liff/pages/PreWorkFormPage';
import { InspectionFormPage } from '@/liff/pages/InspectionFormPage';
import { PostWorkFormPage } from '@/liff/pages/PostWorkFormPage';
import { AccidentFormPage } from '@/liff/pages/AccidentFormPage';
import { RegisterPage } from '@/liff/pages/RegisterPage';
import { isDemoMode, supabase } from '@/lib/supabase';

// Root
const rootRoute = createRootRoute({ component: RootLayout });

// Login
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
});

// Admin layout (認証ガード)
const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'admin',
  component: AdminLayout,
  beforeLoad: async () => {
    if (isDemoMode) {
      const isLoggedIn = sessionStorage.getItem('ecxia_logged_in');
      if (!isLoggedIn) throw redirect({ to: '/login' });
      return;
    }
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw redirect({ to: '/login' });
  },
});

// Admin pages
const dashboardRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/',
  component: DashboardPage,
});

const driversRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/drivers',
  component: DriversPage,
});

const vehiclesRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/vehicles',
  component: VehiclesPage,
});

const reportsRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/reports',
  component: ReportsPage,
});

const exportRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/export',
  component: ExportPage,
});

const adminUsersRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/admin-users',
  component: AdminUsersPage,
});

const notificationSettingsRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/notification-settings',
  component: NotificationSettingsPage,
});

const shiftsRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/shifts',
  component: ShiftsPage,
});

const emergencyRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/emergency',
  component: EmergencyPage,
});

// LIFF layout
const liffRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/liff',
  component: LiffLayout,
});

const preWorkRoute = createRoute({
  getParentRoute: () => liffRoute,
  path: '/pre-work',
  component: PreWorkFormPage,
});

const inspectionRoute = createRoute({
  getParentRoute: () => liffRoute,
  path: '/inspection',
  component: InspectionFormPage,
});

const postWorkRoute = createRoute({
  getParentRoute: () => liffRoute,
  path: '/post-work',
  component: PostWorkFormPage,
});

const accidentRoute = createRoute({
  getParentRoute: () => liffRoute,
  path: '/accident',
  component: AccidentFormPage,
});

// LIFF register (LiffLayout外 — 認証ガードなし)
const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/liff/register',
  component: RegisterPage,
});

// Router tree
const routeTree = rootRoute.addChildren([
  loginRoute,
  adminRoute.addChildren([
    dashboardRoute,
    driversRoute,
    vehiclesRoute,
    reportsRoute,
    exportRoute,
    adminUsersRoute,
    notificationSettingsRoute,
    shiftsRoute,
    emergencyRoute,
  ]),
  registerRoute,
  liffRoute.addChildren([
    preWorkRoute,
    inspectionRoute,
    postWorkRoute,
    accidentRoute,
  ]),
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
