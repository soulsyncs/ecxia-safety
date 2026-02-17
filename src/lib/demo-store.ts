// デモ用インメモリストア — Supabaseの代替として機能
import type {
  Driver, Vehicle, PreWorkReport, PostWorkReport,
  DailyInspection, AccidentReport, DailySubmissionSummary,
  AdminUser,
} from '@/types/database';
import type { CreateAdminInput } from '@/lib/validations';
import {
  demoOrganization, demoDrivers, demoVehicles,
  demoPreWorkReports, demoPostWorkReports,
  demoDailyInspections, demoAccidentReports, demoAdminUser,
} from './demo-data';

// ストア（ミュータブル配列）
const store = {
  adminUsers: [demoAdminUser] as AdminUser[],
  drivers: [...demoDrivers],
  vehicles: [...demoVehicles],
  preWorkReports: [...demoPreWorkReports],
  postWorkReports: [...demoPostWorkReports],
  dailyInspections: [...demoDailyInspections],
  accidentReports: [...demoAccidentReports],
};

// 遅延シミュレーション（リアルなUX）
const delay = (ms = 300) => new Promise<void>(r => setTimeout(r, ms));

function genId(): string {
  return crypto.randomUUID();
}

// --- Auth ---
export const authService = {
  async login(_email: string, _password: string) {
    await delay(500);
    return { user: demoAdminUser, organization: demoOrganization };
  },
  async getCurrentUser() {
    await delay(100);
    return { user: demoAdminUser, organization: demoOrganization };
  },
};

// --- Admin Users ---
export const adminUserService = {
  async list(): Promise<AdminUser[]> {
    await delay();
    return store.adminUsers;
  },
  async create(input: CreateAdminInput): Promise<AdminUser> {
    await delay(500);
    const admin: AdminUser = {
      id: genId(),
      organizationId: demoOrganization.id,
      email: input.email,
      name: input.name,
      role: input.role,
      lineUserId: null,
      lineRegistrationToken: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.adminUsers.push(admin);
    return admin;
  },
  remove(id: string): void {
    const idx = store.adminUsers.findIndex(a => a.id === id);
    if (idx !== -1) store.adminUsers.splice(idx, 1);
  },
  async generateLineToken(id: string): Promise<string> {
    await delay(300);
    const token = crypto.randomUUID();
    const admin = store.adminUsers.find(a => a.id === id);
    if (admin) admin.lineRegistrationToken = token;
    return token;
  },
  async unlinkLine(id: string): Promise<void> {
    await delay(300);
    const admin = store.adminUsers.find(a => a.id === id);
    if (admin) {
      admin.lineUserId = null;
      admin.lineRegistrationToken = null;
    }
  },
};

// --- Drivers ---
export const driverService = {
  async list(): Promise<Driver[]> {
    await delay();
    return store.drivers.filter(d => d.status !== 'inactive');
  },
  async getById(id: string): Promise<Driver | undefined> {
    await delay();
    return store.drivers.find(d => d.id === id);
  },
  async create(input: Omit<Driver, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>): Promise<Driver> {
    await delay();
    const driver: Driver = {
      ...input,
      id: genId(),
      organizationId: demoOrganization.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.drivers.push(driver);
    return driver;
  },
  async update(id: string, input: Partial<Driver>): Promise<Driver> {
    await delay();
    const idx = store.drivers.findIndex(d => d.id === id);
    if (idx === -1) throw new Error('Driver not found');
    store.drivers[idx] = { ...store.drivers[idx]!, ...input, updatedAt: new Date().toISOString() };
    return store.drivers[idx]!;
  },
};

// --- Vehicles ---
export const vehicleService = {
  async list(): Promise<Vehicle[]> {
    await delay();
    return store.vehicles.filter(v => v.status !== 'retired');
  },
  async getById(id: string): Promise<Vehicle | undefined> {
    await delay();
    return store.vehicles.find(v => v.id === id);
  },
  async create(input: Omit<Vehicle, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>): Promise<Vehicle> {
    await delay();
    const vehicle: Vehicle = {
      ...input,
      id: genId(),
      organizationId: demoOrganization.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.vehicles.push(vehicle);
    return vehicle;
  },
  async update(id: string, input: Partial<Vehicle>): Promise<Vehicle> {
    await delay();
    const idx = store.vehicles.findIndex(v => v.id === id);
    if (idx === -1) throw new Error('Vehicle not found');
    store.vehicles[idx] = { ...store.vehicles[idx]!, ...input, updatedAt: new Date().toISOString() };
    return store.vehicles[idx]!;
  },
};

// --- Reports ---
export const reportService = {
  async getPreWorkReports(date?: string): Promise<PreWorkReport[]> {
    await delay();
    if (date) return store.preWorkReports.filter(r => r.reportDate === date);
    return store.preWorkReports;
  },
  async getPostWorkReports(date?: string): Promise<PostWorkReport[]> {
    await delay();
    if (date) return store.postWorkReports.filter(r => r.reportDate === date);
    return store.postWorkReports;
  },
  async getDailyInspections(date?: string): Promise<DailyInspection[]> {
    await delay();
    if (date) return store.dailyInspections.filter(r => r.inspectionDate === date);
    return store.dailyInspections;
  },
  async getAccidentReports(): Promise<AccidentReport[]> {
    await delay();
    return store.accidentReports;
  },
  async submitPreWorkReport(input: PreWorkReport): Promise<PreWorkReport> {
    await delay();
    store.preWorkReports.push(input);
    return input;
  },
  async submitPostWorkReport(input: PostWorkReport): Promise<PostWorkReport> {
    await delay();
    store.postWorkReports.push(input);
    return input;
  },
  async submitDailyInspection(input: DailyInspection): Promise<DailyInspection> {
    await delay();
    store.dailyInspections.push(input);
    return input;
  },
  async submitAccidentReport(input: AccidentReport): Promise<AccidentReport> {
    await delay();
    store.accidentReports.push(input);
    return input;
  },
};

// --- Dashboard ---
export const dashboardService = {
  async getDailySummary(date: string): Promise<DailySubmissionSummary> {
    await delay();
    const activeDrivers = store.drivers.filter(d => d.status === 'active');
    const preWork = store.preWorkReports.filter(r => r.reportDate === date);
    const postWork = store.postWorkReports.filter(r => r.reportDate === date);
    const inspections = store.dailyInspections.filter(r => r.inspectionDate === date);

    const preWorkDriverIds = new Set(preWork.map(r => r.driverId));
    const postWorkDriverIds = new Set(postWork.map(r => r.driverId));
    const inspectionDriverIds = new Set(inspections.map(r => r.driverId));

    return {
      date,
      totalDrivers: activeDrivers.length,
      preWorkSubmitted: preWork.length,
      postWorkSubmitted: postWork.length,
      inspectionSubmitted: inspections.length,
      preWorkMissing: activeDrivers.filter(d => !preWorkDriverIds.has(d.id)).map(d => d.name),
      postWorkMissing: activeDrivers.filter(d => !postWorkDriverIds.has(d.id)).map(d => d.name),
      inspectionMissing: activeDrivers.filter(d => !inspectionDriverIds.has(d.id)).map(d => d.name),
    };
  },
};
