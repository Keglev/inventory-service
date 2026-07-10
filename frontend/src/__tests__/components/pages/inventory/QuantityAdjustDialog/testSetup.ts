/**
 * @file testSetup.ts
 * @module __tests__/components/pages/inventory/QuantityAdjustDialog/testSetup
 * @description Shared deterministic mocks for QuantityAdjustDialog tests.
 *
 * Notes:
 * - i18n is mocked so tests don't depend on runtime init or external locale files.
 * - A tiny {{var}} interpolation is provided for hint/helper-text assertions.
 * - toast is mocked as a no-op function to keep unit tests isolated.
 */

import { vi } from 'vitest';

import { makeTEn } from '../../../../test/i18nEn';

const tEn = makeTEn(['inventory', 'common']);

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => tEn(key, options),
  }),
}));

vi.mock('../../../../../context/toast/ToastContext', () => ({
  // ToastContext exposes a function; this provides a stable no-op callback.
  useToast: () => vi.fn(),
}));
