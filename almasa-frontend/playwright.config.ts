import { defineConfig, devices } from '@playwright/test';

/**
 * E2E tests assume:
 * - Frontend (Vite dev): http://localhost:5173 — see vite.config.ts (proxies /api to Spring)
 * - Backend: BACKEND_URL or http://localhost:8081 (Spring Boot; server.port in application.properties)
 *
 * To test the embedded JAR only, set PLAYWRIGHT_BASE_URL=http://localhost:8081 and run without conflicting webServer.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? 'github' : [['html', { open: 'never' }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    locale: 'ar-EG',
  },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'chromium',
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/admin.json',
      },
      testIgnore: [/auth\.setup\.ts/, /login\.flow\.spec\.ts/],
    },
    {
      name: 'chromium-login',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /login\.flow\.spec\.ts/,
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
