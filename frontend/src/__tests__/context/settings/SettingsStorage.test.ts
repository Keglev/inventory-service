/**
 * @file SettingsStorage.test.ts
 * @module __tests__/context/settings/SettingsStorage
 * @description Contract tests for the `SettingsStorage` persistence helpers.
 *
 * Contract under test:
 * - Defaults are language-aware (`de*` → German formats; otherwise English formats).
 * - Load returns stored preferences when present; otherwise returns defaults.
 * - Save and clear interact with localStorage using the unified storage key.
 * - Storage failures never throw; they log a warning and fall back safely.
 *
 * Out of scope:
 * - Any consumer/provider behavior (covered by SettingsProvider tests).
 *
 * Test strategy:
 * - Stub `localStorage` explicitly (no implicit globals) and assert calls + returned values.
 * - Validate error branches via throwing stubs and `console.warn` capture.
 */

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import {
  getDefaultPreferences,
  loadPreferencesFromStorage,
  savePreferencesToStorage,
  clearPreferencesFromStorage,
} from '@/context/settings/SettingsStorage';
import type { UserPreferences } from '@/context/settings/SettingsContext.types';

const storageKey = 'appSettings';

describe('SettingsStorage', () => {
  const getItem = vi.fn();
  const setItem = vi.fn();
  const removeItem = vi.fn();

  beforeEach(() => {
    getItem.mockReset();
    setItem.mockReset();
    removeItem.mockReset();

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

    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('getDefaultPreferences', () => {
    it.each([
      {
        name: 'German defaults for de* languages',
        language: 'de-DE',
        expected: { dateFormat: 'DD.MM.YYYY', numberFormat: 'DE', tableDensity: 'comfortable' },
      },
      {
        name: 'English defaults for non-de languages',
        language: 'en',
        expected: { dateFormat: 'MM/DD/YYYY', numberFormat: 'EN_US', tableDensity: 'comfortable' },
      },
    ])('$name', ({ language, expected }) => {
      expect(getDefaultPreferences(language)).toEqual(expected);
    });
  });

  describe('loadPreferencesFromStorage', () => {
    it('parses stored preferences when available', () => {
      const stored: UserPreferences = {
        dateFormat: 'YYYY-MM-DD',
        numberFormat: 'EN_US',
        tableDensity: 'compact',
      };
      getItem.mockReturnValue(JSON.stringify(stored));

      const result = loadPreferencesFromStorage('en');

      expect(result).toEqual(stored);
    });

    it('returns defaults when nothing is stored', () => {
      getItem.mockReturnValue(null);
      expect(loadPreferencesFromStorage('de')).toEqual({
        dateFormat: 'DD.MM.YYYY',
        numberFormat: 'DE',
        tableDensity: 'comfortable',
      });
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('returns defaults and logs a warning when stored data is invalid', () => {
      getItem.mockReturnValue('invalid json');
      expect(loadPreferencesFromStorage('en')).toEqual({
        dateFormat: 'MM/DD/YYYY',
        numberFormat: 'EN_US',
        tableDensity: 'comfortable',
      });
      expect(console.warn).toHaveBeenCalledWith(
        'Failed to load settings from localStorage:',
        expect.any(SyntaxError)
      );
    });
  });

  describe('savePreferencesToStorage', () => {
    it('serializes preferences and writes to localStorage', () => {
      const prefs: UserPreferences = {
        dateFormat: 'YYYY-MM-DD',
        numberFormat: 'EN_US',
        tableDensity: 'comfortable',
      };

      savePreferencesToStorage(prefs);

      expect(setItem).toHaveBeenCalledWith(storageKey, JSON.stringify(prefs));
    });

    it('logs warning when storage write fails', () => {
      setItem.mockImplementation(() => {
        throw new Error('quota exceeded');
      });

      const prefs: UserPreferences = {
        dateFormat: 'MM/DD/YYYY',
        numberFormat: 'EN_US',
        tableDensity: 'comfortable',
      };

      savePreferencesToStorage(prefs);

      expect(console.warn).toHaveBeenCalledWith('Failed to save settings to localStorage:', expect.any(Error));
    });
  });

  describe('clearPreferencesFromStorage', () => {
    it('removes stored preferences', () => {
      clearPreferencesFromStorage();

      expect(removeItem).toHaveBeenCalledWith(storageKey);
    });

    it('logs warning when removal fails', () => {
      removeItem.mockImplementation(() => {
        throw new Error('locked');
      });

      clearPreferencesFromStorage();

      expect(console.warn).toHaveBeenCalledWith('Failed to clear settings from localStorage:', expect.any(Error));
    });
  });
});
