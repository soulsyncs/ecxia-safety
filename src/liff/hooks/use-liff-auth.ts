import { useState, useEffect } from 'react';
import { isDemoMode } from '@/lib/supabase';
import { initLiff, getLiffIdToken, getLiffProfile } from '@/liff/lib/liff-init';
import { demoDrivers, demoVehicles } from '@/lib/demo-data';
import type { Driver, Vehicle } from '@/types/database';

interface LiffAuthState {
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
  driver: Pick<Driver, 'id' | 'organizationId' | 'name' | 'defaultVehicleId'> | null;
  vehicle: Pick<Vehicle, 'id' | 'plateNumber' | 'maker' | 'model'> | null;
  idToken: string | null;
}

const EDGE_FUNCTION_BASE = import.meta.env.VITE_SUPABASE_URL
  ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`
  : '';

/** LIFF認証 + ドライバー情報取得フック */
export function useLiffAuth(): LiffAuthState {
  const [state, setState] = useState<LiffAuthState>({
    isReady: false,
    isLoading: true,
    error: null,
    driver: null,
    vehicle: null,
    idToken: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (isDemoMode) {
        // デモモード: 固定のドライバーデータ
        const driver = demoDrivers[0]!;
        const vehicle = demoVehicles.find(v => v.id === driver.defaultVehicleId) ?? demoVehicles[0]!;
        if (!cancelled) {
          setState({
            isReady: true,
            isLoading: false,
            error: null,
            driver: {
              id: driver.id,
              organizationId: driver.organizationId,
              name: driver.name,
              defaultVehicleId: driver.defaultVehicleId,
            },
            vehicle: {
              id: vehicle.id,
              plateNumber: vehicle.plateNumber,
              maker: vehicle.maker,
              model: vehicle.model,
            },
            idToken: null,
          });
        }
        return;
      }

      try {
        await initLiff();
        const idToken = getLiffIdToken();
        const profile = await getLiffProfile();

        if (!idToken || !profile) {
          if (!cancelled) {
            setState(s => ({ ...s, isLoading: false, error: 'LINE認証が必要です' }));
          }
          return;
        }

        // Edge Functionでドライバー情報を取得（IDトークン検証含む）
        const res = await fetch(`${EDGE_FUNCTION_BASE}/submit-report`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
          },
          body: JSON.stringify({ action: 'identify' }),
        });

        if (!res.ok) {
          throw new Error('ドライバー情報の取得に失敗しました');
        }

        const data = await res.json();
        if (!cancelled) {
          setState({
            isReady: true,
            isLoading: false,
            error: null,
            driver: data.driver,
            vehicle: data.vehicle,
            idToken,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setState(s => ({
            ...s,
            isLoading: false,
            error: err instanceof Error ? err.message : 'LIFF初期化に失敗しました',
          }));
        }
      }
    }

    init();
    return () => { cancelled = true; };
  }, []);

  return state;
}

/** Edge Functionにレポートを送信 */
export async function submitToEdgeFunction(
  type: 'pre_work' | 'post_work' | 'inspection' | 'accident',
  payload: Record<string, unknown>,
  idToken: string,
): Promise<Record<string, unknown>> {
  const res = await fetch(`${EDGE_FUNCTION_BASE}/submit-report`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
    },
    body: JSON.stringify({ action: 'submit', type, data: payload }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: '送信に失敗しました' }));
    throw new Error(err.message ?? '送信に失敗しました');
  }

  return res.json();
}
