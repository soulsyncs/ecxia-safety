// submit-report Edge Function
// LIFF経由のレポート送信を処理（IDトークン検証 → ドライバー特定 → DB INSERT）
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

/** LINE User IDからドライバーを検索 */
async function findDriverByLineUserId(lineUserId: string) {
  const { data, error } = await supabase
    .from('drivers')
    .select('id, organization_id, name, default_vehicle_id')
    .eq('line_user_id', lineUserId)
    .eq('status', 'active')
    .single();

  if (error || !data) return null;
  return data;
}

/** ドライバーのデフォルト車両を取得 */
async function getVehicle(vehicleId: string | null) {
  if (!vehicleId) return null;
  const { data } = await supabase
    .from('vehicles')
    .select('id, plate_number, maker, model')
    .eq('id', vehicleId)
    .single();
  return data;
}

// --- 入力ホワイトリスト: レポート種別ごとの許可フィールド ---
const ALLOWED_FIELDS: Record<string, string[]> = {
  pre_work: [
    'reportDate', 'vehicleId', 'clockInAt', 'departurePoint',
    'alcoholCheckResult', 'alcoholCheckValue', 'alcoholCheckerName',
    'healthCondition', 'fatigueLevel', 'sleepHours', 'sleepSufficient',
    'illnessNote', 'routeInfo', 'notes',
  ],
  post_work: [
    'reportDate', 'vehicleId', 'clockOutAt', 'arrivalPoint',
    'distanceKm', 'cargoDeliveredCount', 'restPeriods',
    'alcoholCheckResult', 'alcoholCheckValue', 'alcoholCheckerName',
    'roadConditionNote', 'vehicleConditionNote', 'notes',
  ],
  inspection: [
    'inspectionDate', 'vehicleId',
    'engineOil', 'coolantLevel', 'battery', 'fanBelt',
    'headlights', 'turnSignals', 'brakeLights', 'hazardLights',
    'tirePressure', 'tireTread', 'tireDamage',
    'mirrors', 'seatbelt', 'brakes', 'steering',
    'allPassed', 'abnormalityNote', 'notes',
  ],
  accident: [
    'occurredAt', 'vehicleId', 'location', 'latitude', 'longitude',
    'summary', 'cause', 'preventionMeasures',
    'hasInjuries', 'injuryDetails', 'isSerious',
    'counterpartyInfo', 'policeReported', 'insuranceContacted',
    'notes', 'status',
  ],
};

/** ホワイトリストに基づいてフィールドをフィルタ */
function sanitizePayload(type: string, data: Record<string, unknown>): Record<string, unknown> {
  const allowed = ALLOWED_FIELDS[type];
  if (!allowed) return {};
  const result: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in data) {
      result[key] = data[key];
    }
  }
  return result;
}

/** レポートをDBに保存 */
async function insertReport(table: string, payload: Record<string, unknown>) {
  // camelCase → snake_case 変換
  const snakePayload: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    const snakeKey = key.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`);
    snakePayload[snakeKey] = value;
  }

  // expires_at 自動計算
  const now = new Date();
  const retentionYears = table === 'accident_reports' ? 3 : 1;
  const expiresAt = new Date(now);
  expiresAt.setFullYear(expiresAt.getFullYear() + retentionYears);
  snakePayload['expires_at'] = expiresAt.toISOString().split('T')[0];

  const { data, error } = await supabase.from(table).insert(snakePayload).select().single();
  if (error) throw new Error(`DB insert failed: ${error.message}`);
  return data;
}

const TABLE_MAP: Record<string, string> = {
  pre_work: 'pre_work_reports',
  post_work: 'post_work_reports',
  inspection: 'daily_inspections',
  accident: 'accident_reports',
};

serve(async (req: Request) => {
  const origin = req.headers.get('Origin');

  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(origin) });
  }

  try {
    // IDトークン取得
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ message: '認証が必要です' }), {
        status: 401,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }
    const idToken = authHeader.slice(7);

    // LINE IDトークン検証
    const lineUserId = await verifyLineIdToken(idToken);
    if (!lineUserId) {
      return new Response(JSON.stringify({ message: 'LINE認証に失敗しました' }), {
        status: 401,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    // ドライバー検索
    const driverRow = await findDriverByLineUserId(lineUserId);
    if (!driverRow) {
      return new Response(JSON.stringify({ message: '登録されていないドライバーです' }), {
        status: 403,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { action, type, data } = body;

    // ドライバー特定のみ（LIFF起動時）
    if (action === 'identify') {
      const vehicle = await getVehicle(driverRow.default_vehicle_id);
      return new Response(JSON.stringify({
        driver: {
          id: driverRow.id,
          organizationId: driverRow.organization_id,
          name: driverRow.name,
          defaultVehicleId: driverRow.default_vehicle_id,
        },
        vehicle: vehicle ? {
          id: vehicle.id,
          plateNumber: vehicle.plate_number,
          maker: vehicle.maker,
          model: vehicle.model,
        } : null,
      }), {
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    // レポート送信
    if (action === 'submit') {
      const table = TABLE_MAP[type];
      if (!table) {
        return new Response(JSON.stringify({ message: '無効なレポート種別です' }), {
          status: 400,
          headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
        });
      }

      // ホワイトリストでサニタイズ（不明フィールドは除去）
      const sanitized = sanitizePayload(type, data ?? {});

      // organization_idとdriver_idはサーバー側で上書き（改竄防止）
      const safePayload = {
        ...sanitized,
        organizationId: driverRow.organization_id,
        driverId: driverRow.id,
        submittedVia: 'liff',
      };

      const result = await insertReport(table, safePayload);
      return new Response(JSON.stringify({ success: true, data: result }), {
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ message: '無効なアクションです' }), {
      status: 400,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : '内部エラーが発生しました';
    return new Response(JSON.stringify({ message }), {
      status: 500,
      headers: { ...corsHeaders(req.headers.get('Origin')), 'Content-Type': 'application/json' },
    });
  }
});
