/**
 * @file playwright.config.ts
 * @module e2e
 * @testing Playwright browser suite (ADR-0009).
 * @description Runs the production bundle via `vite preview` on port 5173
 *   (the port the backend's default CORS allow-list already admits) against a
 *   backend that MUST already be listening on 8081 in the `test,e2e` profile.
 *   The backend is deliberately not started here: locally you start it once and
 *   iterate; in CI the workflow starts it and waits for /actuator/health.
 *   Chromium only, demo mode only, no credentials anywhere.
 */
import { defineConfig, devices } from '@playwright/test';

const PORT = 5173;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // The bundle must be built beforehand with VITE_API_BASE=http://localhost:8081;
    // preview serves dist/ as-is, so the API origin is fixed at build time.
    // The dedicated config forces HTTP and drops the production proxy.
    command: 'npx vite preview --config e2e/vite.preview.config.ts',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
