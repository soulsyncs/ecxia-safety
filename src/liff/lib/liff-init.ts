import liff from '@line/liff';
import { isDemoMode } from '@/lib/supabase';

let liffInitialized = false;
let liffInitPromise: Promise<void> | null = null;

const LIFF_ID = import.meta.env.VITE_LIFF_ID as string | undefined;

/** LIFF SDK初期化（デモモード時はスキップ） */
export async function initLiff(): Promise<void> {
  if (isDemoMode || !LIFF_ID) return;
  if (liffInitialized) return;
  if (liffInitPromise) return liffInitPromise;

  liffInitPromise = liff.init({ liffId: LIFF_ID }).then(() => {
    liffInitialized = true;
  });

  return liffInitPromise;
}

/** LIFF初期化済みかどうか */
export function isLiffReady(): boolean {
  return isDemoMode || liffInitialized;
}

/** LIFF IDトークン取得（Edge Function認証用） */
export function getLiffIdToken(): string | null {
  if (isDemoMode) return null;
  return liff.getIDToken();
}

/** LINE User ID取得 */
export async function getLiffProfile() {
  if (isDemoMode) return null;
  if (!liff.isLoggedIn()) {
    liff.login();
    return null;
  }
  return liff.getProfile();
}

/** LIFFアプリを閉じる */
export function closeLiff(): void {
  if (isDemoMode) return;
  if (liff.isInClient()) {
    liff.closeWindow();
  }
}

export { liff };
