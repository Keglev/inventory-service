/**
 * @file SettingsStorage.ts
 * @description Persistence layer for user preferences using localStorage
 * 
 * Handles all reading/writing of settings to localStorage with error handling.
 * Provides language-aware defaults and utility functions for the provider.
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
 * Logs warning but doesn't throw (graceful degradation).
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
    console.warn('Failed to clear settings from localStorage:', error);
  }
};
