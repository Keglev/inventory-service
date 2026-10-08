/**
 * @file SettingsProvider.test.tsx
 * @module __tests__/context/settings/SettingsProvider
 * @description Compact integration tests for the `SettingsProvider`.
 *
 * Contract under test:
 * - Renders children and provides settings via context.
 * - Hydrates user preferences from localStorage (or falls back to defaults on corruption).
 * - Fetches system info on mount; failure path provides stable fallback and logs a warning.
 *
 * Out of scope:
 * - Storage helper implementation details (covered by `SettingsStorage.test.ts`).
 * - Detailed i18n sync behavior (covered by `SettingsContext.test.tsx`).
 *
 * Test strategy:
 * - Use a probe component that consumes the context via `useSettings` (real consumer path).
 * - Stub `localStorage` explicitly for determinism.
 * - No network: the provider no longer fetches system info (FW5 fork 3).
 */

import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SettingsProvider } from '@/context/settings/SettingsContext';
import { useSettings } from '@/hooks/useSettings';

const i18nMock = vi.hoisted(() => ({ language: 'en' }));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ i18n: i18nMock }),
}));


function SettingsProbe() {
  const { userPreferences } = useSettings();
  return (
    <div data-testid="probe">
      <div data-testid="date">{userPreferences.dateFormat}</div>
      <div data-testid="number">{userPreferences.numberFormat}</div>
      <div data-testid="density">{userPreferences.tableDensity}</div>
    </div>
  );
}

function renderProvider(children?: React.ReactNode) {
  return render(
    <SettingsProvider>
      {children ?? <SettingsProbe />}
    </SettingsProvider>
  );
}

describe('SettingsProvider', () => {
  const getItem = vi.fn();
  const setItem = vi.fn();
  const removeItem = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    i18nMock.language = 'en';

    // Deterministic localStorage stub for all tests in this file.
    vi.stubGlobal('localStorage', {
      get length() {
        return 0;
      },
      clear: vi.fn(),
      key: vi.fn(),
      getItem: getItem as Storage['getItem'],
      setItem: setItem as Storage['setItem'],
      removeItem: removeItem as Storage['removeItem'],
    } satisfies Partial<Storage>);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('renders children', () => {
    renderProvider(<div data-testid="child">child</div>);
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('hydrates preferences from localStorage when present', () => {
    getItem.mockReturnValue(
      JSON.stringify({ dateFormat: 'YYYY-MM-DD', numberFormat: 'EN_US', tableDensity: 'compact' })
    );

    renderProvider();
    expect(screen.getByTestId('date')).toHaveTextContent('YYYY-MM-DD');
    expect(screen.getByTestId('density')).toHaveTextContent('compact');
  });

  it('falls back to defaults when stored preferences are corrupted', () => {
    getItem.mockReturnValue('not-json');
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    renderProvider();

    // Defaults for English locale.
    expect(screen.getByTestId('date')).toHaveTextContent('MM/DD/YYYY');
    expect(screen.getByTestId('number')).toHaveTextContent('EN_US');
  });


  it('sends no request on mount', () => {
    // System info comes from the shared health query; the provider stays offline.
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    getItem.mockReturnValue(null);

    renderProvider();

    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
