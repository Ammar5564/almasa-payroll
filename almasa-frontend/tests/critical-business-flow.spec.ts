import { test, expect } from '@playwright/test';
import { ensureDepartmentCatalog } from './helpers/catalog';

test.describe.configure({ mode: 'serial', timeout: 60_000 });

function monthRangeIso(): { fromDate: string; toDate: string; today: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const pad = (n: number) => String(n).padStart(2, '0');
  const lastDay = new Date(y, m, 0).getDate();
  const today = `${y}-${pad(m)}-${pad(now.getDate())}`;
  return {
    fromDate: `${y}-${pad(m)}-01`,
    toDate: `${y}-${pad(m)}-${pad(lastDay)}`,
    today,
  };
}

test.describe('critical business flows (admin)', () => {
  let employeeName: string;
  test.use({ storageState: '.auth/admin.json' });

  test.beforeAll(() => {
    employeeName = `E2E Worker ${Date.now()}`;
  });

  test('add employee persists via API and UI confirmation', async ({ page }) => {
    await ensureDepartmentCatalog(page);
    await page.goto('/employees');
    await page.reload();

    await page.getByRole('button', { name: 'إضافة موظف' }).click();

    const empForm = page.locator('form').filter({
      has: page.getByRole('button', { name: 'حفظ الموظف' }),
    });
    const deptSelect = empForm.locator('select').first();
    await expect(deptSelect).toBeVisible();
    await expect
      .poll(async () => deptSelect.locator('option').count(), { timeout: 15_000 })
      .toBeGreaterThan(1);

    const optionLabels = (await deptSelect.locator('option').allInnerTexts()).map((t) => t.trim());
    const deptChoice =
      optionLabels.find((t) => t && !t.startsWith('--') && /ماليه/.test(t)) ??
      optionLabels.find((t) => t && !t.startsWith('--') && !/مبيعات/.test(t)) ??
      optionLabels.find((t) => t && !t.startsWith('--')) ??
      '';
    expect(deptChoice.length, 'department dropdown should list seeded departments').toBeGreaterThan(0);

    await empForm.getByPlaceholder('الاسم بالكامل').fill(employeeName);
    await empForm.getByPlaceholder('مثال: محاسب قانوني').fill('اختبار أتمتة');
    await deptSelect.selectOption({ label: deptChoice });
    await empForm.getByPlaceholder('0.00').fill('15000');

    const created = page.waitForResponse(
      (r) =>
        r.url().includes('/api/employees') &&
        r.request().method() === 'POST' &&
        !r.url().includes('/employees/count'),
    );
    await empForm.getByRole('button', { name: 'حفظ الموظف' }).click();

    const res = await created;
    expect(res.ok(), await res.text()).toBeTruthy();
    expect([200, 201]).toContain(res.status());
    await expect(page.getByText('تم إضافة الموظف بنجاح')).toBeVisible();
  });

  test('record attendance returns structured result', async ({ page }) => {
    const { today } = monthRangeIso();

    await page.goto('/attendance');

    const attendanceSection = page.locator('.form-section').filter({
      has: page.getByRole('heading', { name: 'تسجيل الحضور' }),
    });

    await attendanceSection.locator('select').first().selectOption({ value: employeeName });
    await attendanceSection.locator('input[type="date"]').fill(today);
    await attendanceSection.locator('input[type="time"]').nth(0).fill('09:00');
    await attendanceSection.locator('input[type="time"]').nth(1).fill('17:30');

    const posted = page.waitForResponse(
      (r) =>
        r.request().method() === 'POST' &&
        r.url().includes('/api/attendance') &&
        !r.url().includes('/absence'),
    );
    await attendanceSection.getByRole('button', { name: 'تسجيل الحضور' }).click();

    const res = await posted;
    expect(res.ok(), await res.text()).toBeTruthy();

    await expect(page.getByText('تم تسجيل الحضور بنجاح')).toBeVisible();
    await expect(page.getByText('دقائق التأخير')).toBeVisible();
  });

  test('run payroll opens payslip preview with net salary', async ({ page }) => {
    const now = new Date();

    await page.goto('/payroll');

    const payrollSection = page.locator('.form-section').filter({
      has: page.getByRole('heading', { name: 'احتساب الراتب' }),
    });

    const calc = page.waitForResponse(
      (r) =>
        r.url().includes(`/api/payroll/${encodeURIComponent(employeeName)}`) &&
        r.request().method() === 'POST',
    );

    await payrollSection.locator('select').first().selectOption({ value: employeeName });
    await payrollSection.getByRole('spinbutton').fill(String(now.getFullYear()));
    await payrollSection.locator('select').nth(1).selectOption({ value: String(now.getMonth() + 1) });
    await payrollSection.getByRole('button', { name: 'احتساب الراتب' }).click();

    const res = await calc;
    expect(res.ok(), await res.text()).toBeTruthy();

    await expect(page.getByText('نافذة المعاينة')).toBeVisible();
    await expect(page.getByText('قسيمة راتب')).toBeVisible();
    await expect(page.getByText('صافي الراتب').first()).toBeVisible();

    await page.locator('.fixed.inset-0.z-50').getByRole('button').first().click();
    await expect(page.getByText('نافذة المعاينة')).toHaveCount(0);
  });

  test('employee report preview loads aggregated data', async ({ page }) => {
    const { fromDate, toDate } = monthRangeIso();

    await page.goto('/');

    const reportSection = page.locator('.form-section').filter({
      has: page.getByRole('heading', { name: 'تقرير موظف' }),
    });

    const preview = page.waitForResponse(
      (r) => r.url().includes('/api/reports/employee') && r.request().method() === 'POST',
    );

    await reportSection.locator('select').first().selectOption({ value: employeeName });
    const dateInputs = reportSection.locator('input[type="date"]');
    await dateInputs.nth(0).fill(fromDate);
    await dateInputs.nth(1).fill(toDate);
    await reportSection.getByRole('button', { name: 'معاينة التقرير' }).click();

    const res = await preview;
    expect(res.ok(), await res.text()).toBeTruthy();

    await expect(page.getByText('بيانات الموظف')).toBeVisible();
    await expect(page.getByText('ملخص الفترة')).toBeVisible();
  });
});
