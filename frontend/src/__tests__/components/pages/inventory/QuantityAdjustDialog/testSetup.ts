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

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (
      key: string,
      fallbackOrOptions?: string | Record<string, unknown>,
      maybeOptions?: Record<string, unknown>
    ) => {
      const fallback = typeof fallbackOrOptions === 'string' ? fallbackOrOptions : undefined;
      const options =
        (typeof fallbackOrOptions === 'object' && fallbackOrOptions !== null
          ? fallbackOrOptions
          : maybeOptions) ?? {};

      const template = fallback ?? key;
      return Object.entries(options).reduce(
        (acc, [optionKey, value]) => acc.replaceAll(`{{${optionKey}}}`, String(value)),
        template
      );
    },
  }),
}));

vi.mock('../../../../../context/toast', () => ({
  // ToastContext exposes a function; this provides a stable no-op callback.
  useToast: () => vi.fn(),
}));
