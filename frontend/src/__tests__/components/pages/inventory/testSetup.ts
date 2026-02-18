/**
 * @file testSetup.ts
 * @module __tests__/components/pages/inventory/testSetup
 * @description Shared deterministic mocks for inventory page tests.
 *
 * Why this exists:
 * - Inventory UI tests import i18n strings via react-i18next.
 * - In tests, we want stable keys (no async resource loading / locale differences).
 *
 * Usage:
 * - Import this file once at the top of each test that renders UI.
 *
 * Out of scope:
 * - Validating translations or locale behavior.
 */

import { vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue ?? key,
  }),
}));
