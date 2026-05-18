import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * Ensures at least one department exists for HR flows.
 * Empty catalogs happen with a fresh DB or when integration tests point at a non-seeded backend.
 */
export async function ensureDepartmentCatalog(page: Page): Promise<void> {
  const frontendOrigin = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173';

  await page.goto('/');
  const raw = await page.evaluate(() => localStorage.getItem('almasa_auth'));
  expect(raw, 'admin storageState must include almasa_auth').toBeTruthy();
  const token = (JSON.parse(raw!) as { token: string }).token;

  const listRes = await page.request.get(`${frontendOrigin}/api/departments`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(listRes.ok(), await listRes.text()).toBeTruthy();
  const payload = await listRes.json();
  const rows = Array.isArray(payload) ? payload : [];
  if (rows.length > 0) return;

  const createRes = await page.request.post(`${frontendOrigin}/api/departments`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    data: {
      departmentName: `E2E Dept ${Date.now()}`,
      officialStart: '09:00',
      officialEnd: '17:30',
    },
  });
  expect(createRes.ok(), await createRes.text()).toBeTruthy();

  const verifyRes = await page.request.get(`${frontendOrigin}/api/departments`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(verifyRes.ok(), await verifyRes.text()).toBeTruthy();
  const verifyPayload = await verifyRes.json();
  const verified = Array.isArray(verifyPayload) ? verifyPayload : [];
  expect(verified.length).toBeGreaterThan(0);
}
