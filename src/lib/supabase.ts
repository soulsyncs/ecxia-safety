import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// デモモード判定: 環境変数未設定時はdemo-storeにフォールバック
export const isDemoMode = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY;

// 本番ビルドでのデモモード起動を防止（環境変数忘れ検知）
if (isDemoMode && import.meta.env.PROD) {
  throw new Error(
    'FATAL: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in production. ' +
    'Demo mode is not allowed in production builds.'
  );
}

// Supabaseクライアント（デモモード時はダミー）
export const supabase: SupabaseClient = isDemoMode
  ? (null as unknown as SupabaseClient) // デモモードではサービス層でdemo-storeを使う
  : createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY,
    );

// --- snake_case ↔ camelCase 変換ヘルパー ---

export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}

export function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

/** DB行(snake_case) → TypeScript型(camelCase) に変換 */
export function fromDb<T>(row: Record<string, unknown>): T {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    result[snakeToCamel(key)] = value;
  }
  return result as T;
}

/** TypeScript型(camelCase) → DB行(snake_case) に変換 */
export function toDb(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[camelToSnake(key)] = value;
  }
  return result;
}

/** DB行の配列を一括変換 */
export function fromDbArray<T>(rows: Record<string, unknown>[]): T[] {
  return rows.map((row) => fromDb<T>(row));
}

// --- エラーハンドリング ---

export class SupabaseError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: string,
  ) {
    super(message);
    this.name = 'SupabaseError';
  }
}

/** Supabaseレスポンスのエラーチェック */
export function handleSupabaseError(error: { message: string; code?: string; details?: string }): never {
  throw new SupabaseError(error.message, error.code, error.details);
}
