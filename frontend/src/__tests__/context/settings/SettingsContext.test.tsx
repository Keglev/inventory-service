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
 * - System info: the provider no longer fetches it (shared health query, FW5 fork 3).
 *
 * Test strategy:
 * - Use a probe consumer component to assert observable state via test ids.
 * - Mock external edges deterministically (`react-i18next`, storage helpers).
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

const storageMocks = vi.hoisted(() => ({
  getDefaultPreferences: vi.fn(),
  loadPreferencesFromStorage: vi.fn(),
  savePreferencesToStorage: vi.fn(),
  clearPreferencesFromStorage: vi.fn(),
}));

vi.mock('react-i18next', () => ({ useTranslation: useTranslationMock }));

vi.mock('@/context/settings/SettingsStorage', () => storageMocks);

import { SettingsContext } from '@/context/settings/SettingsContext.types';
import { SettingsProvider } from '@/context/settings/SettingsContext';

function SettingsProbe() {
  const ctx = React.useContext(SettingsContext);
  if (!ctx) throw new Error('SettingsContext missing');

  return (
    <div data-testid="probe">
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

    renderProvider();

    expect(storageMocks.loadPreferencesFromStorage).toHaveBeenCalledWith('en');
    expect(screen.getByTestId('date')).toHaveTextContent('MM/DD/YYYY');
    expect(screen.getByTestId('density')).toHaveTextContent('comfortable');
  });


  it('exposes preferences and their controls only', () => {
    // System info moved to the shared health query; the context carries no fetch state.
    let keys: string[] = [];
    function KeysProbe() {
      keys = Object.keys(React.useContext(SettingsContext) ?? {}).sort();
      return null;
    }
    render(
      <SettingsProvider>
        <KeysProbe />
      </SettingsProvider>,
    );
    expect(keys).toEqual(['resetToDefaults', 'setUserPreferences', 'userPreferences']);
  });

  it('persists preference updates and leaves formats unchanged on a language switch', async () => {
    const user = userEvent.setup();

    const { rerender } = renderProvider();

    await user.click(screen.getByRole('button', { name: 'set-date' }));

    expect(screen.getByTestId('date')).toHaveTextContent('YYYY-MM-DD');
    expect(storageMocks.savePreferencesToStorage).toHaveBeenCalledWith(
      expect.objectContaining({ dateFormat: 'YYYY-MM-DD' })
    );

    // A language change must not rewrite formats: the chosen date format and the
    // stored number format both survive the switch to German.
    i18nMock.language = 'de';
    rerender(
      <SettingsProvider>
        <SettingsProbe />
      </SettingsProvider>
    );

    await waitFor(() => expect(screen.getByTestId('date')).toHaveTextContent('YYYY-MM-DD'));
    expect(screen.getByTestId('number')).toHaveTextContent('EN_US');
    expect(screen.getByTestId('density')).toHaveTextContent('comfortable');

    await user.click(screen.getByRole('button', { name: 'reset' }));
    expect(storageMocks.clearPreferencesFromStorage).toHaveBeenCalledTimes(1);
    expect(storageMocks.getDefaultPreferences).toHaveBeenCalledWith('de');
    expect(screen.getByTestId('date')).toHaveTextContent('DD.MM.YYYY');
  });

  it('keeps US formats when the language switches to de', async () => {
    // Stored prefs carry the US defaults (from beforeEach): MM/DD/YYYY + EN_US.
    const { rerender } = renderProvider();

    expect(screen.getByTestId('date')).toHaveTextContent('MM/DD/YYYY');

    i18nMock.language = 'de';
    rerender(
      <SettingsProvider>
        <SettingsProbe />
      </SettingsProvider>
    );

    // A German UI with US formats is a valid, preserved combination.
    await waitFor(() => expect(screen.getByTestId('date')).toHaveTextContent('MM/DD/YYYY'));
    expect(screen.getByTestId('number')).toHaveTextContent('EN_US');
  });

  it('keeps German formats when the language switches to en', async () => {
    i18nMock.language = 'de';
    storageMocks.loadPreferencesFromStorage.mockReturnValue({
      dateFormat: 'DD.MM.YYYY',
      numberFormat: 'DE',
      tableDensity: 'comfortable',
    });

    const { rerender } = renderProvider();

    expect(screen.getByTestId('date')).toHaveTextContent('DD.MM.YYYY');

    i18nMock.language = 'en';
    rerender(
      <SettingsProvider>
        <SettingsProbe />
      </SettingsProvider>
    );

    // An English UI with German formats is a valid, preserved combination.
    await waitFor(() => expect(screen.getByTestId('date')).toHaveTextContent('DD.MM.YYYY'));
    expect(screen.getByTestId('number')).toHaveTextContent('DE');
  });
});
