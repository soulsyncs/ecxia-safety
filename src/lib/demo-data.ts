// デモ用データ — Supabase接続なしで完全に動作するデモ環境
// 本番移行時はservicesレイヤーをSupabase実装に切り替えるだけ

import type {
  Organization, Driver, Vehicle,
  PreWorkReport, PostWorkReport, DailyInspection,
  AccidentReport, AdminUser,
} from '@/types/database';

const ORG_ID = 'demo-org-ecxia-001';

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0]!;
}

function isoNow(): string {
  return new Date().toISOString();
}

function addYears(dateStr: string, years: number): string {
  const d = new Date(dateStr);
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString().split('T')[0]!;
}

// --- 組織 ---
export const demoOrganization: Organization = {
  id: ORG_ID,
  name: '株式会社ECXIA',
  postalCode: '272-0023',
  address: '千葉県市川市南八幡5-10-1 ピエール本八幡502',
  phone: '047-702-8267',
  safetyManagerName: '田中 一郎',
  safetyManagerBirthdate: '1975-03-15',
  safetyManagerAppointedAt: '2025-04-01',
  safetyManagerTrainingCompletedAt: '2025-05-20',
  lineChannelId: null,
  lineChannelSecret: null,
  lineChannelAccessToken: null,
  liffId: null,
  settings: {},
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: isoNow(),
};

// --- 車両 ---
export const demoVehicles: Vehicle[] = [
  { id: 'v-001', organizationId: ORG_ID, plateNumber: '市川 480 あ 1234', maker: 'ダイハツ', model: 'ハイゼットカーゴ', year: 2024, vehicleInspectionDate: '2027-03-15', status: 'active', createdAt: '2026-01-01T00:00:00Z', updatedAt: isoNow() },
  { id: 'v-002', organizationId: ORG_ID, plateNumber: '市川 480 い 5678', maker: 'スズキ', model: 'エブリイ', year: 2023, vehicleInspectionDate: '2026-09-20', status: 'active', createdAt: '2026-01-01T00:00:00Z', updatedAt: isoNow() },
  { id: 'v-003', organizationId: ORG_ID, plateNumber: '市川 480 う 9012', maker: 'ホンダ', model: 'N-VAN', year: 2025, vehicleInspectionDate: '2027-06-10', status: 'active', createdAt: '2026-01-01T00:00:00Z', updatedAt: isoNow() },
  { id: 'v-004', organizationId: ORG_ID, plateNumber: '市川 480 え 3456', maker: 'ダイハツ', model: 'ハイゼットカーゴ', year: 2022, vehicleInspectionDate: '2026-04-25', status: 'active', createdAt: '2026-01-01T00:00:00Z', updatedAt: isoNow() },
  { id: 'v-005', organizationId: ORG_ID, plateNumber: '市川 480 お 7890', maker: 'スズキ', model: 'エブリイ', year: 2024, vehicleInspectionDate: '2027-01-30', status: 'maintenance', createdAt: '2026-01-01T00:00:00Z', updatedAt: isoNow() },
];

// --- ドライバー ---
export const demoDrivers: Driver[] = [
  { id: 'd-001', organizationId: ORG_ID, lineUserId: 'U001', name: '佐藤 太郎', nameKana: 'サトウ タロウ', phone: '090-1234-5678', dateOfBirth: '1985-06-15', hireDate: '2024-04-01', licenseNumber: '123456789012', licenseExpiry: '2027-06-15', healthCheckDate: '2026-01-10', isSenior: false, isNewHire: false, status: 'active', defaultVehicleId: 'v-001', registrationToken: null, createdAt: '2026-01-01T00:00:00Z', updatedAt: isoNow() },
  { id: 'd-002', organizationId: ORG_ID, lineUserId: 'U002', name: '鈴木 花子', nameKana: 'スズキ ハナコ', phone: '090-2345-6789', dateOfBirth: '1990-11-20', hireDate: '2025-01-15', licenseNumber: '234567890123', licenseExpiry: '2028-11-20', healthCheckDate: '2026-01-10', isSenior: false, isNewHire: false, status: 'active', defaultVehicleId: 'v-002', registrationToken: null, createdAt: '2026-01-01T00:00:00Z', updatedAt: isoNow() },
  { id: 'd-003', organizationId: ORG_ID, lineUserId: 'U003', name: '高橋 健一', nameKana: 'タカハシ ケンイチ', phone: '090-3456-7890', dateOfBirth: '1978-03-05', hireDate: '2023-10-01', licenseNumber: '345678901234', licenseExpiry: '2027-03-05', healthCheckDate: '2025-12-15', isSenior: false, isNewHire: false, status: 'active', defaultVehicleId: 'v-003', registrationToken: null, createdAt: '2026-01-01T00:00:00Z', updatedAt: isoNow() },
  { id: 'd-004', organizationId: ORG_ID, lineUserId: 'U004', name: '田中 美咲', nameKana: 'タナカ ミサキ', phone: '090-4567-8901', dateOfBirth: '1995-08-25', hireDate: '2026-02-01', licenseNumber: '456789012345', licenseExpiry: '2029-08-25', healthCheckDate: '2026-02-01', isSenior: false, isNewHire: true, status: 'active', defaultVehicleId: 'v-004', registrationToken: null, createdAt: '2026-02-01T00:00:00Z', updatedAt: isoNow() },
  { id: 'd-005', organizationId: ORG_ID, lineUserId: null, name: '山本 義男', nameKana: 'ヤマモト ヨシオ', phone: '090-5678-9012', dateOfBirth: '1960-01-10', hireDate: '2020-04-01', licenseNumber: '567890123456', licenseExpiry: '2026-07-10', healthCheckDate: '2025-11-20', isSenior: true, isNewHire: false, status: 'active', defaultVehicleId: null, registrationToken: 'reg-token-005', createdAt: '2026-01-01T00:00:00Z', updatedAt: isoNow() },
];

// --- 業務前報告（過去7日分: d-001〜d-004が提出、d-005は未提出多め） ---
export const demoPreWorkReports: PreWorkReport[] = [];
for (let day = 0; day < 7; day++) {
  const date = daysAgo(day);
  const drivers = day === 0 ? ['d-001', 'd-002', 'd-003'] : ['d-001', 'd-002', 'd-003', 'd-004'];
  for (const dId of drivers) {
    const driver = demoDrivers.find(d => d.id === dId)!;
    const vehicle = demoVehicles.find(v => v.id === driver.defaultVehicleId) ?? demoVehicles[0]!;
    demoPreWorkReports.push({
      id: `pwr-${dId}-${date}`,
      organizationId: ORG_ID,
      driverId: dId,
      vehicleId: vehicle.id,
      reportDate: date,
      clockInAt: `${date}T08:${String(Math.floor(Math.random() * 30)).padStart(2, '0')}:00+09:00`,
      startLocation: '市川市南八幡 本社',
      plannedDestinations: '江東区・江戸川区エリア 宅配便',
      alcoholCheckResult: 'negative',
      alcoholCheckValue: 0,
      alcoholCheckerName: '田中 一郎',
      healthCondition: 'good',
      healthConditionNote: null,
      fatigueLevel: 'none',
      sleepHours: 7,
      cargoCount: Math.floor(Math.random() * 50) + 80,
      submittedVia: 'liff',
      expiresAt: addYears(date, 1),
      createdAt: `${date}T08:00:00+09:00`,
      updatedAt: `${date}T08:00:00+09:00`,
    });
  }
}

// --- 業務後報告 ---
export const demoPostWorkReports: PostWorkReport[] = [];
for (let day = 1; day < 7; day++) {
  const date = daysAgo(day);
  for (const dId of ['d-001', 'd-002', 'd-003', 'd-004']) {
    const driver = demoDrivers.find(d => d.id === dId)!;
    const vehicle = demoVehicles.find(v => v.id === driver.defaultVehicleId) ?? demoVehicles[0]!;
    demoPostWorkReports.push({
      id: `powr-${dId}-${date}`,
      organizationId: ORG_ID,
      driverId: dId,
      vehicleId: vehicle.id,
      reportDate: date,
      clockOutAt: `${date}T18:${String(Math.floor(Math.random() * 30)).padStart(2, '0')}:00+09:00`,
      endLocation: '市川市南八幡 本社',
      actualDestinations: '江東区亀戸・江戸川区葛西エリア',
      distanceKm: Math.floor(Math.random() * 80) + 60,
      restPeriods: [{ start: '12:00', end: '13:00', location: '江東区亀戸 コンビニ駐車場' }],
      alcoholCheckResult: 'negative',
      alcoholCheckValue: 0,
      alcoholCheckerName: '田中 一郎',
      roadConditionNote: day === 3 ? '首都高 湾岸線で渋滞あり' : null,
      cargoDeliveredCount: Math.floor(Math.random() * 50) + 75,
      submittedVia: 'liff',
      expiresAt: addYears(date, 1),
      createdAt: `${date}T18:00:00+09:00`,
      updatedAt: `${date}T18:00:00+09:00`,
    });
  }
}

// --- 日常点検 ---
export const demoDailyInspections: DailyInspection[] = [];
for (let day = 0; day < 7; day++) {
  const date = daysAgo(day);
  const drivers = day === 0 ? ['d-001', 'd-002'] : ['d-001', 'd-002', 'd-003', 'd-004'];
  for (const dId of drivers) {
    const driver = demoDrivers.find(d => d.id === dId)!;
    const vehicle = demoVehicles.find(v => v.id === driver.defaultVehicleId) ?? demoVehicles[0]!;
    demoDailyInspections.push({
      id: `di-${dId}-${date}`,
      organizationId: ORG_ID,
      driverId: dId,
      vehicleId: vehicle.id,
      inspectionDate: date,
      engineOil: true, coolantLevel: true, battery: true,
      headlights: true, turnSignals: true, brakeLights: true,
      tirePressure: true, tireTread: true, tireDamage: true,
      mirrors: true, seatbelt: true, brakes: true, steering: true,
      allPassed: true,
      abnormalityNote: null,
      submittedVia: 'liff',
      expiresAt: addYears(date, 1),
      createdAt: `${date}T07:50:00+09:00`,
      updatedAt: `${date}T07:50:00+09:00`,
    });
  }
}

// --- 事故報告（1件のサンプル） ---
export const demoAccidentReports: AccidentReport[] = [
  {
    id: 'ar-001',
    organizationId: ORG_ID,
    driverId: 'd-003',
    vehicleId: 'v-003',
    occurredAt: `${daysAgo(15)}T14:30:00+09:00`,
    location: '江東区亀戸2丁目交差点',
    summary: '左折時に電柱に車両左後部を接触。車両に軽微な傷あり。',
    cause: '左折時の内輪差の確認不足',
    preventionMeasures: '左折時のミラー確認の徹底。全ドライバーへの安全運転講習実施。',
    hasInjuries: false,
    injuryDetails: null,
    isSerious: false,
    reportedToMlit: false,
    reportedToMlitAt: null,
    mlitReportDeadline: null,
    status: 'reviewed',
    expiresAt: addYears(daysAgo(15), 3),
    createdAt: `${daysAgo(15)}T15:00:00+09:00`,
    updatedAt: `${daysAgo(14)}T10:00:00+09:00`,
  },
];

// --- デモ用管理者 ---
export const demoAdminUser: AdminUser = {
  id: 'admin-001',
  organizationId: ORG_ID,
  email: 'admin@ecxia.co.jp',
  name: '田中 一郎',
  role: 'org_admin',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: isoNow(),
};
