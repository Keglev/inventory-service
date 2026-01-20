/**
 * @file SettingsStorage.test.ts
 * @module tests/context/settings/SettingsStorage
 *
 * @summary
 * Validates the localStorage-backed settings persistence helpers.
 * Covers language-specific defaults, save/load/clear flows, and error handling branches.
 *
 * @enterprise
 * - Protects startup defaults so locale switching stays predictable
 * - Ensures storage failures degrade gracefully without crashing the app
 * - Confirms mutation helpers interact with localStorage using the unified key
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
    it('returns German defaults when language starts with de', () => {
      expect(getDefaultPreferences('de')).toEqual({
        dateFormat: 'DD.MM.YYYY',
        numberFormat: 'DE',
        tableDensity: 'comfortable',
      });
    });

    it('returns English defaults otherwise', () => {
      expect(getDefaultPreferences('en')).toEqual({
        dateFormat: 'MM/DD/YYYY',
        numberFormat: 'EN_US',
        tableDensity: 'comfortable',
      });
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

    it('falls back to defaults when storage missing or parse fails', () => {
      getItem.mockReturnValue(null);

      expect(loadPreferencesFromStorage('de')).toEqual({
        dateFormat: 'DD.MM.YYYY',
        numberFormat: 'DE',
        tableDensity: 'comfortable',
      });

      getItem.mockReturnValue('invalid json');
      expect(loadPreferencesFromStorage('en')).toEqual({
        dateFormat: 'MM/DD/YYYY',
        numberFormat: 'EN_US',
        tableDensity: 'comfortable',
      });
      expect(console.warn).toHaveBeenCalledWith('Failed to load settings from localStorage:', expect.any(SyntaxError));
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
