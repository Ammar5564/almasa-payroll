import { test as setup, expect } from '@playwright/test';

const backendUrl = () => process.env.BACKEND_URL ?? 'http://localhost:8081';

setup('authenticate as admin', async ({ page, request }) => {
  const username = process.env.E2E_ADMIN_USER ?? 'Yasser Basher';
  const password = process.env.E2E_ADMIN_PASSWORD ?? '1479y';

  const loginRes = await request.post(`${backendUrl()}/api/auth/login`, {
    data: { username, password },
    headers: { 'Content-Type': 'application/json' },
  });

  expect(loginRes.ok(), `Backend login failed (${loginRes.status()}): ${await loginRes.text()}`).toBeTruthy();

  const body = (await loginRes.json()) as {
    token: string;
    username: string;
    role: 'ROLE_ADMIN' | 'ROLE_USER';
  };

  await page.goto('/login');
  await page.evaluate(
    (auth: { token: string; username: string; role: string }) => {
      localStorage.setItem(
        'almasa_auth',
        JSON.stringify({
          token: auth.token,
          username: auth.username,
          role: auth.role,
        }),
      );
    },
    { token: body.token, username: body.username, role: body.role },
  );

  await page.goto('/');
  await expect(page).not.toHaveURL(/\/login$/);

  await page.context().storageState({ path: '.auth/admin.json' });
});
