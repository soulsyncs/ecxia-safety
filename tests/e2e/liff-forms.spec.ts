import { test, expect } from '@playwright/test';

test.describe('LIFFフォーム（デモモード）', () => {
  test('業務前報告フォームが表示される', async ({ page }) => {
    await page.goto('/liff/pre-work');
    await expect(page.getByText('業務前報告')).toBeVisible();
    await expect(page.getByText('ドライバー')).toBeVisible();
    await expect(page.getByText('アルコールチェック')).toBeVisible();
  });

  test('日常点検フォームが表示される', async ({ page }) => {
    await page.goto('/liff/inspection');
    await expect(page.getByText('日常点検')).toBeVisible();
    await expect(page.getByText('エンジンルーム')).toBeVisible();
    await expect(page.getByText('ライト類')).toBeVisible();
  });

  test('業務後報告フォームが表示される', async ({ page }) => {
    await page.goto('/liff/post-work');
    await expect(page.getByText('業務後報告')).toBeVisible();
    await expect(page.getByText('業務記録')).toBeVisible();
    await expect(page.getByText('休憩記録')).toBeVisible();
  });

  test('事故報告フォームが表示される', async ({ page }) => {
    await page.goto('/liff/accident');
    await expect(page.getByText('事故報告')).toBeVisible();
    await expect(page.getByText('事故の基本情報')).toBeVisible();
    await expect(page.getByText('負傷・重大事故')).toBeVisible();
  });

  test('全てOKボタンで全項目チェック', async ({ page }) => {
    await page.goto('/liff/inspection');
    await expect(page.getByText('日常点検')).toBeVisible();
    await page.getByRole('button', { name: '全てOK' }).click();
    // 全チェック後、提出ボタンが有効になる
    await expect(page.getByRole('button', { name: '日常点検を提出' })).toBeEnabled();
  });
});
