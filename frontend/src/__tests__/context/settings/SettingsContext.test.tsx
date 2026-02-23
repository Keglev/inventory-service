/**
 * @file SettingsContext.test.tsx
 * @module __tests__/context/settings/SettingsContext
 * @description Contract tests for the `SettingsProvider` orchestration layer.
 *
 * Contract under test:
 * - Loads initial preferences from storage using the active i18n language.
 * - Fetches system info on mount; on failure, uses a stable fallback and logs a warning.
 * - `setUserPreferences()` merges partial updates and persists them.
 * - Language changes sync date/number formats while preserving density.
 * - `resetToDefaults()` clears persisted preferences and restores language defaults.
 *
 * Out of scope:
 * - Storage serialization/parsing correctness (covered by `SettingsStorage.test.ts`).
 * - Health endpoint parsing / database auto-detection (covered by utils tests).
 *
 * Test strategy:
 * - Use a probe consumer component to assert observable state via test ids.
 * - Mock external edges deterministically (`react-i18next`, `getSystemInfo`, storage helpers).
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const i18nMock = vi.hoisted(() => ({
  language: 'en',
  changeLanguage: vi.fn(),
}));

const useTranslationMock = vi.hoisted(() => vi.fn(() => ({ i18n: i18nMock })));
const getSystemInfoMock = vi.hoisted(() => vi.fn());

const storageMocks = vi.hoisted(() => ({
  getDefaultPreferences: vi.fn(),
  loadPreferencesFromStorage: vi.fn(),
  savePreferencesToStorage: vi.fn(),
  clearPreferencesFromStorage: vi.fn(),
}));

vi.mock('react-i18next', () => ({ useTranslation: useTranslationMock }));

// Mock by a resolved path that matches the provider's runtime resolution.
vi.mock('../../../utils/systemInfo.js', () => ({ getSystemInfo: getSystemInfoMock }));
vi.mock('../../../context/settings/SettingsStorage', () => storageMocks);

import { SettingsContext } from '../../../context/settings/SettingsContext.types';
import { SettingsProvider } from '../../../context/settings/SettingsContext';

function SettingsProbe() {
  const ctx = React.useContext(SettingsContext);
  if (!ctx) throw new Error('SettingsContext missing');

  return (
    <div data-testid="probe">
      <div data-testid="loading">{String(ctx.isLoading)}</div>
      <div data-testid="db">{ctx.systemInfo?.database ?? ''}</div>
      <div data-testid="date">{ctx.userPreferences.dateFormat}</div>
      <div data-testid="number">{ctx.userPreferences.numberFormat}</div>
      <div data-testid="density">{ctx.userPreferences.tableDensity}</div>

      <button type="button" onClick={() => ctx.setUserPreferences({ dateFormat: 'YYYY-MM-DD' })}>
        set-date
      </button>
      <button type="button" onClick={ctx.resetToDefaults}>
        reset
      </button>
    </div>
  );
}

function renderProvider() {
  return render(
    <SettingsProvider>
      <SettingsProbe />
    </SettingsProvider>
  );
}

describe('SettingsProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    i18nMock.language = 'en';

    storageMocks.loadPreferencesFromStorage.mockReturnValue({
      dateFormat: 'MM/DD/YYYY',
      numberFormat: 'EN_US',
      tableDensity: 'comfortable',
    });

    storageMocks.getDefaultPreferences.mockImplementation((lang: string) => ({
      dateFormat: lang.startsWith('de') ? 'DD.MM.YYYY' : 'MM/DD/YYYY',
      numberFormat: lang.startsWith('de') ? 'DE' : 'EN_US',
      tableDensity: 'comfortable',
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads initial preferences using the active i18n language', () => {
    // This test is about storage hydration; keep system-info fetch pending to avoid act warnings.
    getSystemInfoMock.mockImplementation(() => new Promise<never>(() => {}));

    renderProvider();

    expect(storageMocks.loadPreferencesFromStorage).toHaveBeenCalledWith('en');
    expect(screen.getByTestId('date')).toHaveTextContent('MM/DD/YYYY');
    expect(screen.getByTestId('density')).toHaveTextContent('comfortable');
  });

  it('fetches system info on mount (success path)', async () => {
    const systemInfo = {
      database: 'ADB',
      version: '2.0',
      environment: 'stage',
      apiVersion: 'v2',
      buildDate: '2024-01-01',
      uptime: '24h',
      status: 'ONLINE',
    };
    getSystemInfoMock.mockResolvedValue(systemInfo);

    renderProvider();

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
    expect(screen.getByTestId('db')).toHaveTextContent('ADB');
  });

  it('falls back when system info fetch fails', async () => {
    getSystemInfoMock.mockRejectedValue(new Error('offline'));
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    renderProvider();

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));

    expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch system info:', expect.any(Error));

    // Fallback is intentionally stable so downstream UI can render reliably.
    expect(screen.getByTestId('db')).toHaveTextContent('Oracle ADB');
    consoleSpy.mockRestore();
  });

  it('persists preference updates and syncs language changes', async () => {
    getSystemInfoMock.mockResolvedValue({});
    const user = userEvent.setup();

    const { rerender } = renderProvider();

    await user.click(screen.getByRole('button', { name: 'set-date' }));

    expect(screen.getByTestId('date')).toHaveTextContent('YYYY-MM-DD');
    expect(storageMocks.savePreferencesToStorage).toHaveBeenCalledWith(
      expect.objectContaining({ dateFormat: 'YYYY-MM-DD' })
    );

    // Trigger the language-sync effect by updating the i18n language and re-rendering.
    i18nMock.language = 'de';
    rerender(
      <SettingsProvider>
        <SettingsProbe />
      </SettingsProvider>
    );

    // Language sync only normalizes the common formats (MM/DD/YYYY <-> DD.MM.YYYY).
    // Custom formats (e.g., YYYY-MM-DD) are intentionally preserved.
    await waitFor(() => expect(screen.getByTestId('date')).toHaveTextContent('YYYY-MM-DD'));
    expect(screen.getByTestId('number')).toHaveTextContent('DE');
    expect(screen.getByTestId('density')).toHaveTextContent('comfortable');

    await user.click(screen.getByRole('button', { name: 'reset' }));
    expect(storageMocks.clearPreferencesFromStorage).toHaveBeenCalledTimes(1);
    expect(storageMocks.getDefaultPreferences).toHaveBeenCalledWith('de');
    expect(screen.getByTestId('date')).toHaveTextContent('DD.MM.YYYY');
  });
});
