import { test, expect } from '@playwright/test';

test.describe('ドライバー管理', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('パスワード').fill('demo');
    await page.getByRole('button', { name: 'ログイン' }).click();
    await expect(page.getByText('ダッシュボード')).toBeVisible({ timeout: 5000 });
    await page.getByText('ドライバー').click();
  });

  test('ドライバー一覧が表示される', async ({ page }) => {
    await expect(page.getByText('ドライバー管理')).toBeVisible();
    await expect(page.getByText(/\d+名登録/)).toBeVisible();
  });

  test('検索が機能する', async ({ page }) => {
    await page.getByPlaceholder('名前・フリガナ・電話番号で検索...').fill('佐藤');
    await expect(page.getByText('佐藤 太郎')).toBeVisible();
  });

  test('新規登録ダイアログが開く', async ({ page }) => {
    await page.getByRole('button', { name: '新規登録' }).click();
    await expect(page.getByText('ドライバー新規登録')).toBeVisible();
    await expect(page.getByText('氏名 *')).toBeVisible();
  });
});
