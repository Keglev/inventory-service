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
 * - Mock `getSystemInfo` to avoid network.
 */

import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { SettingsProvider } from '../../../context/settings/SettingsContext';
import { useSettings } from '../../../context/settings/useSettings';

const i18nMock = vi.hoisted(() => ({ language: 'en' }));
const getSystemInfoMock = vi.hoisted(() => vi.fn());

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ i18n: i18nMock }),
}));

// Match the provider's runtime module resolution.
vi.mock('../../../utils/systemInfo.js', () => ({
  getSystemInfo: getSystemInfoMock,
}));

function SettingsProbe() {
  const { userPreferences, systemInfo, isLoading } = useSettings();
  return (
    <div data-testid="probe">
      <div data-testid="loading">{String(isLoading)}</div>
      <div data-testid="date">{userPreferences.dateFormat}</div>
      <div data-testid="number">{userPreferences.numberFormat}</div>
      <div data-testid="density">{userPreferences.tableDensity}</div>
      <div data-testid="db">{systemInfo?.database ?? ''}</div>
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
    getSystemInfoMock.mockResolvedValue({});
    renderProvider(<div data-testid="child">child</div>);
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('hydrates preferences from localStorage when present', () => {
    getSystemInfoMock.mockResolvedValue({});
    getItem.mockReturnValue(
      JSON.stringify({ dateFormat: 'YYYY-MM-DD', numberFormat: 'EN_US', tableDensity: 'compact' })
    );

    renderProvider();
    expect(screen.getByTestId('date')).toHaveTextContent('YYYY-MM-DD');
    expect(screen.getByTestId('density')).toHaveTextContent('compact');
  });

  it('falls back to defaults when stored preferences are corrupted', () => {
    getSystemInfoMock.mockResolvedValue({});
    getItem.mockReturnValue('not-json');
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    renderProvider();

    // Defaults for English locale.
    expect(screen.getByTestId('date')).toHaveTextContent('MM/DD/YYYY');
    expect(screen.getByTestId('number')).toHaveTextContent('EN_US');
  });

  it('fetches system info on mount (success)', async () => {
    getSystemInfoMock.mockResolvedValue({ database: 'Oracle ADB', status: 'ONLINE' });
    getItem.mockReturnValue(null);

    renderProvider();

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
    expect(screen.getByTestId('db')).toHaveTextContent('Oracle ADB');
  });

  it('uses fallback system info and logs a warning on fetch failure', async () => {
    getSystemInfoMock.mockRejectedValue(new Error('offline'));
    getItem.mockReturnValue(null);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    renderProvider();

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
    expect(warnSpy).toHaveBeenCalledWith('Failed to fetch system info:', expect.any(Error));
    expect(screen.getByTestId('db')).toHaveTextContent('Oracle ADB');
  });
});
