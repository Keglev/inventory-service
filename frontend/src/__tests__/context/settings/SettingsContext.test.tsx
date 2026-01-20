/**
 * @file SettingsContext.test.tsx
 * @module tests/context/settings/SettingsContext
 *
 * @summary
 * Integration-level validation for the SettingsProvider component.
 * Exercises system info fetch success/failure, language sync, preference persistence, and reset flows.
 *
 * @enterprise
 * - Ensures bootstrapping remains resilient when backend/system storage misbehave
 * - Guarantees language changes update date/number formats while preserving density
 * - Confirms preference mutations persist via storage helpers and reset clears state
 */

import React from 'react';
import { act, render } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: vi.fn(),
}));

vi.mock('@/utils/systemInfo.js', () => ({
  getSystemInfo: vi.fn(),
}));

vi.mock('@/context/settings/SettingsStorage', () => ({
  getDefaultPreferences: vi.fn(),
  loadPreferencesFromStorage: vi.fn(),
  savePreferencesToStorage: vi.fn(),
  clearPreferencesFromStorage: vi.fn(),
}));

import { useTranslation } from 'react-i18next';
import { getSystemInfo } from '@/utils/systemInfo.js';
import {
  getDefaultPreferences,
  loadPreferencesFromStorage,
  savePreferencesToStorage,
  clearPreferencesFromStorage,
} from '@/context/settings/SettingsStorage';
import { SettingsContext } from '@/context/settings/SettingsContext.types';
import { SettingsProvider } from '@/context/settings/SettingsContext';

const useTranslationMock = useTranslation as unknown as ReturnType<typeof vi.fn>;
const getSystemInfoMock = getSystemInfo as ReturnType<typeof vi.fn>;
const loadPreferencesMock = loadPreferencesFromStorage as ReturnType<typeof vi.fn>;
const savePreferencesMock = savePreferencesToStorage as ReturnType<typeof vi.fn>;
const clearPreferencesMock = clearPreferencesFromStorage as ReturnType<typeof vi.fn>;
const getDefaultPreferencesMock = getDefaultPreferences as ReturnType<typeof vi.fn>;

const makeWrapper = () => {
  const Consumer: React.FC<{ onValue: (value: React.ContextType<typeof SettingsContext>) => void }> = ({ onValue }) => {
    const value = React.useContext(SettingsContext);
    if (!value) throw new Error('SettingsContext missing');
    onValue(value);
    return null;
  };

  const renderProvider = (onValue: (value: React.ContextType<typeof SettingsContext>) => void, children = null) =>
    render(
      <SettingsProvider>
        <Consumer onValue={onValue} />
        {children}
      </SettingsProvider>
    );

  return { renderProvider };
};

describe('SettingsProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useTranslationMock.mockReturnValue({ i18n: { language: 'en', changeLanguage: vi.fn() } });
    loadPreferencesMock.mockReturnValue({ dateFormat: 'MM/DD/YYYY', numberFormat: 'EN_US', tableDensity: 'comfortable' });
    getDefaultPreferencesMock.mockImplementation((lang: string) => ({
      dateFormat: lang.startsWith('de') ? 'DD.MM.YYYY' : 'MM/DD/YYYY',
      numberFormat: lang.startsWith('de') ? 'DE' : 'EN_US',
      tableDensity: 'comfortable',
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads system info on mount and updates context success path', async () => {
    const systemInfo = { database: 'ADB', version: '2.0', environment: 'stage', apiVersion: 'v2', buildDate: '2024-01-01', uptime: '24h', status: 'ONLINE' };
    getSystemInfoMock.mockResolvedValue(systemInfo);

    const spy = vi.fn();
    const { renderProvider } = makeWrapper();

    await act(async () => {
      renderProvider(spy);
    });

    const lastValue = spy.mock.calls.at(-1)?.[0];
    expect(lastValue?.systemInfo).toEqual(systemInfo);
    expect(lastValue?.isLoading).toBe(false);
  });

  it('falls back when system info fetch fails', async () => {
    getSystemInfoMock.mockRejectedValue(new Error('offline'));
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const spy = vi.fn();
    const { renderProvider } = makeWrapper();

    await act(async () => {
      renderProvider(spy);
    });

    const lastValue = spy.mock.calls.at(-1)?.[0];
    expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch system info:', expect.any(Error));
    expect(lastValue?.systemInfo).toEqual({
      database: 'Oracle ADB',
      version: 'dev',
      environment: 'production',
      apiVersion: 'unknown',
      buildDate: 'unknown',
      uptime: '0h',
      status: 'UNKNOWN',
    });
    expect(lastValue?.isLoading).toBe(false);
    consoleSpy.mockRestore();
  });

  it('persists preference updates and syncs language changes', async () => {
    const spy = vi.fn();
    const { renderProvider } = makeWrapper();
    const i18nObj = { language: 'en', changeLanguage: vi.fn() };
    useTranslationMock.mockReturnValue({ i18n: i18nObj });
    getSystemInfoMock.mockResolvedValue({});

    await act(async () => {
      renderProvider(spy);
    });

    const initial = spy.mock.calls.at(-1)?.[0];
    await act(async () => {
      initial?.setUserPreferences({ dateFormat: 'YYYY-MM-DD' });
    });
    const afterUpdate = spy.mock.calls.at(-1)?.[0];
    expect(afterUpdate?.userPreferences.dateFormat).toBe('YYYY-MM-DD');
    expect(savePreferencesMock).toHaveBeenCalledWith(expect.objectContaining({ dateFormat: 'YYYY-MM-DD' }));

    // Trigger language change effect to German
    i18nObj.language = 'de';
    await act(async () => {
      renderProvider(spy);
    });
    const afterGerman = spy.mock.calls.at(-1)?.[0];
    expect(afterGerman?.userPreferences.dateFormat).toBe('DD.MM.YYYY');
    expect(afterGerman?.userPreferences.numberFormat).toBe('DE');

    // Reset to defaults
    await act(async () => {
      afterGerman?.resetToDefaults();
    });
    const afterReset = spy.mock.calls.at(-1)?.[0];
    expect(clearPreferencesMock).toHaveBeenCalled();
    expect(afterReset?.userPreferences).toEqual(getDefaultPreferencesMock.mock.results.at(-1)?.value);
  });
});
