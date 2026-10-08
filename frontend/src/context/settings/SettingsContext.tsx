/**
 * @file SettingsContext.tsx
 * @module context/settings/SettingsContext
 * @summary SettingsProvider component owning user preferences (date/number
 * formats, table density) with language-aware defaults and localStorage
 * persistence.
 * @enterprise
 * - User preferences only (locale-sensitive, persisted to localStorage under
 *   'appSettings'). Runtime system facts (backend status, database product) come
 *   from the shared health query (features/health/useHealthCheck); this context
 *   no longer fetches /api/health (FW5 fork 3).
 * - Format preferences are language-independent: the i18n language sets the
 *   initial default (first load) and the reset baseline only. Once chosen, a
 *   date/number format is sticky and a language change never rewrites it — a
 *   German UI with a US date format is a valid, persisted combination.
 * - Consumed via hooks/useSettings.ts — the factory-built consumer hook with
 *   16 production call sites. The former sibling duplicate
 *   context/settings/useSettings.ts has been removed.
 */

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  SettingsContext,
  type SettingsContextType,
  type UserPreferences,
} from './SettingsContext.types';
import {
  getDefaultPreferences,
  loadPreferencesFromStorage,
  savePreferencesToStorage,
  clearPreferencesFromStorage,
} from './SettingsStorage';

export type { DateFormat, NumberFormat, SettingsContextType } from './SettingsContext.types';
export { SettingsContext };

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { i18n } = useTranslation('common');

  const [userPreferences, setUserPreferencesState] = React.useState<UserPreferences>(() =>
    loadPreferencesFromStorage(i18n.language)
  );

  /** Update preferences with partial merge; persists to localStorage. */
  const setUserPreferences = (prefs: Partial<UserPreferences>) => {
    setUserPreferencesState((prev) => {
      const updated = { ...prev, ...prefs };
      // WHY: persistence failure is non-blocking — in-memory state still applies; user re-edits will re-attempt save.
      savePreferencesToStorage(updated);
      
      return updated;
    });
  };

  /** Clear stored preferences and restore language-appropriate defaults. */
  const resetToDefaults = () => {
    clearPreferencesFromStorage();
    setUserPreferencesState(getDefaultPreferences(i18n.language));
  };

  const value: SettingsContextType = {
    userPreferences,
    setUserPreferences,
    resetToDefaults,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};
