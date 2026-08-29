/**
 * @file smoke.spec.ts
 * @module e2e
 * @testing First browser suite (ADR-0009): proves the local stack, not the UI.
 * @description Four tests against the e2e seed: the login page renders in
 *   both locales, the demo entry lands on the dashboard, and the inventory grid
 *   shows the seeded rows. Locale is preset through the i18next storage key so
 *   no UI control is needed for it; the language switcher gets its own test
 *   once its selector is pinned.
 */
import { test, expect, type Page } from '@playwright/test';

const I18N_KEY = 'i18nextLng';

async function presetLocale(page: Page, lng: 'en' | 'de'): Promise<void> {
  await page.addInitScript(
    ([key, value]) => window.localStorage.setItem(key, value),
    [I18N_KEY, lng],
  );
}

async function enterDemo(page: Page, demoLabel: RegExp): Promise<void> {
  await page.goto('/login');
  await page.getByRole('button', { name: demoLabel }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test.describe('login page', () => {
  test('renders in English', async ({ page }) => {
    await presetLocale(page, 'en');
    await page.goto('/login');
    await expect(page.getByRole('button', { name: /Continue in Demo Mode/i })).toBeVisible();
  });

  test('renders in German', async ({ page }) => {
    await presetLocale(page, 'de');
    await page.goto('/login');
    await expect(page.getByRole('button', { name: /Im Demo-Modus fortfahren/i })).toBeVisible();
  });
});

test('demo entry lands on the dashboard', async ({ page }) => {
  await presetLocale(page, 'en');
  await enterDemo(page, /Continue in Demo Mode/i);
  await expect(page.getByRole('heading', { name: /Dashboard/i }).first()).toBeVisible();
});

test('inventory grid shows the seeded rows', async ({ page }) => {
  await presetLocale(page, 'en');
  await enterDemo(page, /Continue in Demo Mode/i);
  await page.goto('/inventory');
  // The board sends no search until a supplier is chosen (mandatory step 1).
  // The MUI Select is the page's only combobox and carries no accessible name.
  await page.getByRole('combobox').click();
  await page.getByRole('option', { name: 'Nordlicht Werkzeuge GmbH' }).click();
  // All three items of that supplier, incl. the one below minimum quantity.
  await expect(page.getByText('Hammer 300 g')).toBeVisible();
  await expect(page.getByText('Schraubendreher Set')).toBeVisible();
  await expect(page.getByText('E2E-WWG-060')).toBeVisible();
});
