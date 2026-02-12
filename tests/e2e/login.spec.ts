import { test, expect } from '@playwright/test';

test.describe('ログインページ', () => {
  test('ログインページが表示される', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText('安全管理システム')).toBeVisible();
    await expect(page.getByText('管理者ログイン')).toBeVisible();
  });

  test('デモモードでログインできる', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('パスワード').fill('demo');
    await page.getByRole('button', { name: 'ログイン' }).click();
    // ダッシュボードに遷移
    await expect(page.getByText('ダッシュボード')).toBeVisible({ timeout: 5000 });
  });

  test('未ログイン時はログインページにリダイレクト', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
  });
});
