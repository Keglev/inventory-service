/**
 * @file smoke.spec.ts
 * @module e2e
 * @testing First browser suite (ADR-0009): proves the local stack, not the UI.
 * @description Five tests against the e2e seed: the login page renders in
 *   both locales, the header language switcher flips the locale and persists
 *   it across a reload, the demo entry lands on the dashboard with a healthy
 *   header badge, and the inventory grid shows the seeded rows. Locale is
 *   seeded through the i18next storage key so no UI control is needed for the
 *   tests that are not about the switcher.
 */
import { test, expect, type Page } from '@playwright/test';

const I18N_KEY = 'i18nextLng';

// Seeds the starting locale WITHOUT overriding what the app later stores.
// addInitScript re-runs on every navigation, reload included, so an
// unconditional write would silently re-force the seed after page.reload()
// and make any persistence assertion test the fixture instead of the app.
async function presetLocale(page: Page, lng: 'en' | 'de'): Promise<void> {
  await page.addInitScript(
    ([key, value]) => {
      if (!window.localStorage.getItem(key)) {
        window.localStorage.setItem(key, value);
      }
    },
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

test('the header switcher changes locale and the choice survives a reload', async ({
  page,
}) => {
  await presetLocale(page, 'en');
  await page.goto('/login');
  await expect(page.getByRole('button', { name: /Continue in Demo Mode/i })).toBeVisible();

  // The toggle's accessible name is the tooltip text (MUI sets aria-label from
  // it, overriding the flag img's alt), so the name is itself localised and
  // doubles as the assertion that the switch took effect.
  await page.getByRole('button', { name: 'Switch language' }).click();
  await expect(page.getByRole('button', { name: /Im Demo-Modus fortfahren/i })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sprache wechseln' })).toBeVisible();

  // useLocale writes the same key the i18next detector reads first.
  await expect
    .poll(() => page.evaluate(() => window.localStorage.getItem('i18nextLng')))
    .toBe('de');

  await page.reload();
  await expect(page.getByRole('button', { name: /Im Demo-Modus fortfahren/i })).toBeVisible();

  await page.getByRole('button', { name: 'Sprache wechseln' }).click();
  await expect(page.getByRole('button', { name: /Continue in Demo Mode/i })).toBeVisible();
});

test('demo entry lands on the dashboard', async ({ page }) => {
  await presetLocale(page, 'en');
  await enterDemo(page, /Continue in Demo Mode/i);
  await expect(page.getByRole('heading', { name: /Dashboard/i }).first()).toBeVisible();
  // The header badge reads "System OK" (same string in both locales) only when
  // the health probe reached the local backend and it reported the database up.
  // This is the request-level proof that the probe no longer follows the
  // serving origin.
  await expect(page.getByText('System OK')).toBeVisible();
});

test('inventory grid shows the seeded rows', async ({ page }) => {
  await presetLocale(page, 'en');
  await enterDemo(page, /Continue in Demo Mode/i);
  await page.goto('/inventory');
  // The board sends no search until a supplier is chosen (mandatory step 1).
  // The filter Select is now selectable by its accessible name; the test runs
  // with the English locale preset, so the name is the English label.
  await page.getByRole('combobox', { name: 'Supplier' }).click();
  await page.getByRole('option', { name: 'Nordlicht Werkzeuge GmbH' }).click();
  // All three items of that supplier, incl. the one below minimum quantity.
  await expect(page.getByText('Hammer 300 g')).toBeVisible();
  await expect(page.getByText('Schraubendreher Set')).toBeVisible();
  await expect(page.getByText('E2E-WWG-060')).toBeVisible();
});
