// =============================================
// ECXIA Safety Management System - 型定義
// DB設計書（docs/06_DATABASE_DESIGN.md v2）と完全対応
// 3-AIコンセンサス反映済み（17テーブル）
// =============================================

// --- 共通型 ---

export type DriverStatus = 'active' | 'inactive' | 'suspended';
export type VehicleStatus = 'active' | 'maintenance' | 'retired';
export type AdminRole = 'org_admin' | 'manager';
export type AlcoholCheckResult = 'negative' | 'positive';
export type HealthCondition = 'good' | 'fair' | 'poor';
export type FatigueLevel = 'none' | 'mild' | 'severe';
export type SubmittedVia = 'liff' | 'web' | 'manual';
export type AccidentStatus = 'draft' | 'submitted' | 'reviewed';
export type BroadcastTarget = 'all' | 'selected';
export type BroadcastMessageType = 'text' | 'image' | 'template';
export type EventActorType = 'admin' | 'driver' | 'system';
export type GuidanceType = 'initial' | 'accident' | 'senior' | 'regular';
export type AptitudeTestType = 'initial' | 'periodic' | 'specific' | 'senior';
export type TrainingType = 'initial' | 'periodic';
export type BroadcastTargetStatus = 'pending' | 'sent' | 'failed';

/** 休憩記録（JSONB） */
export interface RestPeriod {
  start: string;  // "HH:mm"
  end: string;    // "HH:mm"
  location: string;
}

// --- テーブル型（17テーブル） ---

/** 3.1 organizations（組織） */
export interface Organization {
  id: string;
  name: string;
  postalCode: string | null;
  address: string | null;
  phone: string | null;
  safetyManagerName: string | null;
  safetyManagerBirthdate: string | null;
  safetyManagerAppointedAt: string | null;
  safetyManagerTrainingCompletedAt: string | null;
  lineChannelId: string | null;
  lineChannelSecret: string | null;
  lineChannelAccessToken: string | null;
  liffId: string | null;
  settings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/** 3.2 admin_users（管理者ユーザー） */
export interface AdminUser {
  id: string;
  organizationId: string;
  email: string;
  name: string;
  role: AdminRole;
  createdAt: string;
  updatedAt: string;
}

/** 3.3 drivers（ドライバー） */
export interface Driver {
  id: string;
  organizationId: string;
  lineUserId: string | null;
  name: string;
  nameKana: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  hireDate: string | null;
  licenseNumber: string | null;
  licenseExpiry: string | null;
  healthCheckDate: string | null;
  isSenior: boolean;
  isNewHire: boolean;
  status: DriverStatus;
  defaultVehicleId: string | null;
  registrationToken: string | null;
  createdAt: string;
  updatedAt: string;
}

/** 3.4 vehicles（車両） */
export interface Vehicle {
  id: string;
  organizationId: string;
  plateNumber: string;
  maker: string | null;
  model: string | null;
  year: number | null;
  vehicleInspectionDate: string | null;
  status: VehicleStatus;
  createdAt: string;
  updatedAt: string;
}

/** 3.5 pre_work_reports（業務前報告 - 点呼：乗務前） */
export interface PreWorkReport {
  id: string;
  organizationId: string;
  driverId: string;
  vehicleId: string;
  reportDate: string;

  // 法定：業務記録
  clockInAt: string;
  startLocation: string;
  plannedDestinations: string;

  // 法定：点呼（乗務前）
  alcoholCheckResult: AlcoholCheckResult;
  alcoholCheckValue: number | null;
  alcoholCheckerName: string;
  healthCondition: HealthCondition;
  healthConditionNote: string | null;
  fatigueLevel: FatigueLevel;
  sleepHours: number | null;

  // 会社独自
  cargoCount: number | null;

  // 管理
  submittedVia: SubmittedVia;
  expiresAt: string;

  createdAt: string;
  updatedAt: string;
}

/** 3.6 post_work_reports（業務後報告 - 点呼：乗務後） */
export interface PostWorkReport {
  id: string;
  organizationId: string;
  driverId: string;
  vehicleId: string;
  reportDate: string;

  // 法定：業務記録
  clockOutAt: string;
  endLocation: string;
  actualDestinations: string;
  distanceKm: number;
  restPeriods: RestPeriod[] | null;

  // 法定：点呼（乗務後）
  alcoholCheckResult: AlcoholCheckResult;
  alcoholCheckValue: number | null;
  alcoholCheckerName: string;
  roadConditionNote: string | null;

  // 会社独自
  cargoDeliveredCount: number | null;

  // 管理
  submittedVia: SubmittedVia;
  expiresAt: string;

  createdAt: string;
  updatedAt: string;
}

/** 3.7 daily_inspections（日常点検記録） */
export interface DailyInspection {
  id: string;
  organizationId: string;
  driverId: string;
  vehicleId: string;
  inspectionDate: string;

  // エンジンルーム（3項目）
  engineOil: boolean;
  coolantLevel: boolean;
  battery: boolean;

  // ライト類（3項目）
  headlights: boolean;
  turnSignals: boolean;
  brakeLights: boolean;

  // タイヤ（3項目）
  tirePressure: boolean;
  tireTread: boolean;
  tireDamage: boolean;

  // 運転席周り（4項目）
  mirrors: boolean;
  seatbelt: boolean;
  brakes: boolean;
  steering: boolean;

  // 総合
  allPassed: boolean;
  abnormalityNote: string | null;

  // 管理
  submittedVia: SubmittedVia;
  expiresAt: string;

  createdAt: string;
  updatedAt: string;
}

/** 3.8 accident_reports（事故報告） */
export interface AccidentReport {
  id: string;
  organizationId: string;
  driverId: string;
  vehicleId: string | null;

  // 法定：事故記録（3年間保存）
  occurredAt: string;
  location: string;
  summary: string;
  cause: string;
  preventionMeasures: string;
  hasInjuries: boolean;
  injuryDetails: string | null;

  // 法定：国交省報告
  isSerious: boolean;
  reportedToMlit: boolean;
  reportedToMlitAt: string | null;
  mlitReportDeadline: string | null;

  // 管理
  status: AccidentStatus;
  expiresAt: string;

  createdAt: string;
  updatedAt: string;
}

/** 3.9 accident_photos（事故写真） */
export interface AccidentPhoto {
  id: string;
  organizationId: string;
  accidentReportId: string;
  storagePath: string;
  mimeType: string;
  fileSizeBytes: number | null;
  fileHash: string | null;
  uploadedBy: string;
  createdAt: string;
}

/** 3.10 driver_guidance_records（指導監督記録 — 3年保存） */
export interface DriverGuidanceRecord {
  id: string;
  organizationId: string;
  driverId: string;
  guidanceType: GuidanceType;
  guidanceDate: string;
  content: string;
  instructorName: string;
  durationMinutes: number | null;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

/** 3.11 aptitude_tests（適性診断記録 — 3年保存） */
export interface AptitudeTest {
  id: string;
  organizationId: string;
  driverId: string;
  testType: AptitudeTestType;
  testDate: string;
  testingInstitution: string;
  resultSummary: string | null;
  nextTestDue: string | null;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

/** 3.12 safety_manager_trainings（安全管理者講習記録） */
export interface SafetyManagerTraining {
  id: string;
  organizationId: string;
  trainingType: TrainingType;
  trainingDate: string;
  trainingInstitution: string;
  certificateNumber: string | null;
  nextTrainingDue: string | null;
  createdAt: string;
  updatedAt: string;
}

/** 3.13 line_broadcasts（LINE一斉配信記録） */
export interface LineBroadcast {
  id: string;
  organizationId: string;
  sentBy: string;
  messageType: BroadcastMessageType;
  content: string;
  targetType: BroadcastTarget;
  sentCount: number;
  failedCount: number;
  sentAt: string;
  createdAt: string;
  updatedAt: string;
}

/** 3.14 line_broadcast_targets（配信対象ドライバー） */
export interface LineBroadcastTarget {
  id: string;
  broadcastId: string;
  driverId: string;
  status: BroadcastTargetStatus;
  errorCode: string | null;
  sentAt: string | null;
  createdAt: string;
}

/** 3.15 event_logs（監査ログ） */
export interface EventLog {
  id: string;
  organizationId: string;
  actorType: EventActorType;
  actorId: string;
  action: string;
  resourceType: string;
  resourceId: string | null;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
}

// --- フォーム入力型（LIFF用） ---

export interface PreWorkReportInput {
  vehicleId: string;
  startLocation: string;
  plannedDestinations: string;
  alcoholCheckResult: AlcoholCheckResult;
  alcoholCheckValue: number | null;
  alcoholCheckerName: string;
  healthCondition: HealthCondition;
  healthConditionNote: string | null;
  fatigueLevel: FatigueLevel;
  sleepHours: number | null;
  cargoCount: number | null;
}

export interface PostWorkReportInput {
  vehicleId: string;
  endLocation: string;
  actualDestinations: string;
  distanceKm: number;
  restPeriods: RestPeriod[] | null;
  alcoholCheckResult: AlcoholCheckResult;
  alcoholCheckValue: number | null;
  alcoholCheckerName: string;
  roadConditionNote: string | null;
  cargoDeliveredCount: number | null;
}

export interface DailyInspectionInput {
  vehicleId: string;
  engineOil: boolean;
  coolantLevel: boolean;
  battery: boolean;
  headlights: boolean;
  turnSignals: boolean;
  brakeLights: boolean;
  tirePressure: boolean;
  tireTread: boolean;
  tireDamage: boolean;
  mirrors: boolean;
  seatbelt: boolean;
  brakes: boolean;
  steering: boolean;
  abnormalityNote: string | null;
}

export interface AccidentReportInput {
  vehicleId: string | null;
  occurredAt: string;
  location: string;
  summary: string;
  cause: string;
  preventionMeasures: string;
  hasInjuries: boolean;
  injuryDetails: string | null;
  isSerious: boolean;
}

// --- ダッシュボード用集計型 ---

export interface DailySubmissionSummary {
  date: string;
  totalDrivers: number;
  preWorkSubmitted: number;
  postWorkSubmitted: number;
  inspectionSubmitted: number;
  preWorkMissing: string[];
  postWorkMissing: string[];
  inspectionMissing: string[];
}
