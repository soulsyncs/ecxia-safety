import { useEffect, useRef, useCallback } from 'react';

const AUTOSAVE_INTERVAL = 5_000; // 5秒ごとに自動保存

/**
 * フォームの入力内容をlocalStorageに自動保存・復元するフック
 * LIFF画面でのクラッシュ・通信断からデータを保護
 *
 * @param key - localStorageのキー（フォーム種別ごとに一意）
 * @param form - フォームの現在値
 * @param setForm - フォーム値のセッター
 */
export function useFormAutosave<T extends Record<string, unknown>>(
  key: string,
  form: T,
  setForm: (updater: (prev: T) => T) => void,
) {
  const initialized = useRef(false);

  // 初回マウント時にlocalStorageから復元
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<T>;
        setForm(prev => ({ ...prev, ...parsed }));
      }
    } catch {
      // パースエラー時は無視
    }
  }, [key, setForm]);

  // 定期的にlocalStorageに保存
  useEffect(() => {
    const timer = setInterval(() => {
      try {
        localStorage.setItem(key, JSON.stringify(form));
      } catch {
        // ストレージ容量超過時は無視
      }
    }, AUTOSAVE_INTERVAL);
    return () => clearInterval(timer);
  }, [key, form]);

  // 送信完了時にlocalStorageをクリア
  const clearSaved = useCallback(() => {
    try {
      localStorage.removeItem(key);
    } catch {
      // 無視
    }
  }, [key]);

  return { clearSaved };
}
