import { test, expect } from '@playwright/test';

test.describe('ダッシュボード', () => {
  test.beforeEach(async ({ page }) => {
    // デモモードでログイン
    await page.goto('/login');
    await page.getByPlaceholder('パスワード').fill('demo');
    await page.getByRole('button', { name: 'ログイン' }).click();
    await expect(page.getByText('ダッシュボード')).toBeVisible({ timeout: 5000 });
  });

  test('稼働ドライバー数が表示される', async ({ page }) => {
    await expect(page.getByText('稼働ドライバー')).toBeVisible();
    await expect(page.getByText(/\d+名/)).toBeVisible();
  });

  test('提出状況カードが4つ表示される', async ({ page }) => {
    await expect(page.getByText('業務前報告')).toBeVisible();
    await expect(page.getByText('日常点検')).toBeVisible();
    await expect(page.getByText('業務後報告')).toBeVisible();
  });

  test('アクティビティセクションが表示される', async ({ page }) => {
    await expect(page.getByText('本日のアクティビティ')).toBeVisible();
  });
});
