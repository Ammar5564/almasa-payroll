import { test, expect } from '@playwright/test';

const user = process.env.E2E_ADMIN_USER ?? 'Yasser Basher';
const pass = process.env.E2E_ADMIN_PASSWORD ?? '1479y';

test.describe('login', () => {
  test('admin credentials yield authenticated dashboard session', async ({ page }) => {
    await page.goto('/login');

    await page.getByPlaceholder('مثال: Almasa-user1').fill(user);
    await page.locator('input[type="password"]').fill(pass);

    const loginPromise = page.waitForResponse(
      (r) => r.url().includes('/api/auth/login') && r.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'دخول' }).click();

    const loginRes = await loginPromise;
    expect(loginRes.ok(), await loginRes.text()).toBeTruthy();

    await expect(page).not.toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: 'لوحة التحكم' }).first()).toBeVisible();

    const stored = await page.evaluate(() => localStorage.getItem('almasa_auth'));
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored!) as { token?: string; role?: string };
    expect(parsed.token?.length).toBeGreaterThan(10);
    expect(parsed.role).toBe('ROLE_ADMIN');
  });
});
