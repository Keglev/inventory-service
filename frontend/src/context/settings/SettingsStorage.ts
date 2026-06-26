/**
 * @file SettingsStorage.ts
 * @module context/settings/SettingsStorage
 * @summary localStorage persistence helpers for SettingsContext: load/save/
 * clear user preferences with graceful degradation.
 * @enterprise
 * - Pure persistence layer — no React, no context. Used only by
 *   SettingsContext.tsx (Provider) and index.ts (re-export for advanced
 *   consumers; no production caller verified).
 * - All three I/O helpers swallow exceptions and log warnings. Rationale:
 *   localStorage can throw (Safari private mode, quota exceeded, disabled
 *   storage); preference persistence is best-effort and must not block app
 *   startup or settings updates.
 * - getDefaultPreferences is language-aware: German locales get DD.MM.YYYY +
 *   DE number format; everything else gets MM/DD/YYYY + EN_US. Locale
 *   detection is naive (startsWith('de')) but matches the i18n supportedLngs
 *   ['de', 'en'] contract.
 * - loadPreferencesFromStorage uses `as UserPreferences` without runtime
 *   validation — corrupt storage with wrong shape passes through silently.
 *   Acceptable today; could harden later if shape changes.
 */

import type { UserPreferences } from './SettingsContext.types';

const STORAGE_KEY = 'appSettings';

/**
 * Get language-appropriate default preferences
 * 
 * Returns locale-specific defaults based on i18n language:
 * - German (de-*): DD.MM.YYYY dates, DE number format
 * - Other: MM/DD/YYYY dates, EN_US number format
 * 
 * @param language - i18n language code (e.g., 'de', 'en', 'de-DE')
 * @returns Default preferences for the language
 */
export const getDefaultPreferences = (language: string): UserPreferences => {
  const isGerman = language?.startsWith('de');
  return {
    dateFormat: isGerman ? 'DD.MM.YYYY' : 'MM/DD/YYYY',
    numberFormat: isGerman ? 'DE' : 'EN_US',
    tableDensity: 'comfortable',
  };
};

/**
 * Load preferences from localStorage
 * 
 * Attempts to parse stored preferences, falling back to defaults if:
 * - No stored preferences exist
 * - Stored data is corrupted/unparseable
 * - localStorage is unavailable
 * 
 * @param language - i18n language for defaults
 * @returns Stored preferences or language defaults
 */
export const loadPreferencesFromStorage = (language: string): UserPreferences => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as UserPreferences;
    }
  } catch (error) {
    // BUCKET: unguarded console.warn ships to production (CB-APP35)
    console.warn('Failed to load settings from localStorage:', error);
  }
  return getDefaultPreferences(language);
};

/**
 * Save preferences to localStorage
 * 
 * Serializes preferences and persists to localStorage.
 * Logs warning on failure but doesn't throw (non-blocking).
 * 
 * @param prefs - User preferences to persist
 */
export const savePreferencesToStorage = (prefs: UserPreferences): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch (error) {
    // BUCKET: unguarded console.warn ships to production (CB-APP35)
    console.warn('Failed to save settings to localStorage:', error);
  }
};

/**
 * Clear preferences from localStorage
 * 
 * Removes the entire settings entry. Next load will use fresh defaults.
 * Logs warning on failure but doesn't throw.
 */
export const clearPreferencesFromStorage = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    // BUCKET: unguarded console.warn ships to production (CB-APP35)
    console.warn('Failed to clear settings from localStorage:', error);
  }
};
