/**
 * @file SettingsContext.tsx
 * @module context/settings/SettingsContext
 * @summary SettingsProvider component owning user preferences (date/number
 * formats, table density) and runtime system info from /api/health,
 * with language-aware defaults and localStorage persistence.
 * @enterprise
 * - Two concerns bridged in one context: USER PREFERENCES (locale-sensitive,
 *   persisted to localStorage under 'appSettings') and RUNTIME SYSTEM INFO
 *   (database flavor + health status from /api/health). See CB-APP1 for the
 *   open question of splitting these into separate sources
 *   of truth.
 * - SINGLE production consumer of getSystemInfo() (utils/systemInfo), which
 *   returns only database/environment/status — nothing fabricated. This file
 *   applies a SECOND layer of 'unknown' fallbacks on top.
 * - Format preferences are language-independent: the i18n language sets the
 *   initial default (first load) and the reset baseline only. Once chosen, a
 *   date/number format is sticky and a language change never rewrites it — a
 *   German UI with a US date format is a valid, persisted combination.
 * - On /api/health fetch failure, systemInfo falls back to 'unknown' values
 *   rather than asserting a guessed environment.
 * - Consumed via hooks/useSettings.ts — the factory-built consumer hook with
 *   16 production call sites. The former sibling duplicate
 *   context/settings/useSettings.ts has been removed.
 */

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { getSystemInfo } from '../../utils/systemInfo';
import {
  SettingsContext,
  type SettingsContextType,
  type UserPreferences,
  type SystemInfo,
} from './SettingsContext.types';
import {
  getDefaultPreferences,
  loadPreferencesFromStorage,
  savePreferencesToStorage,
  clearPreferencesFromStorage,
} from './SettingsStorage';
import { logWarn } from '../../utils/logger';

export type { DateFormat, NumberFormat, TableDensity, UserPreferences, SystemInfo, SettingsContextType } from './SettingsContext.types';
export { SettingsContext };

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { i18n } = useTranslation('common');

  const [isLoading, setIsLoading] = React.useState(true);
  const [systemInfo, setSystemInfo] = React.useState<SystemInfo | null>(null);
  const [userPreferences, setUserPreferencesState] = React.useState<UserPreferences>(() =>
    loadPreferencesFromStorage(i18n.language)
  );

  /** One-time fetch on mount; fallbacks ensure systemInfo is never null. */
  React.useEffect(() => {
    const fetchSystemInfo = async () => {
      try {
        const data = await getSystemInfo();
        const info: SystemInfo = {
          database: data.database ?? 'Unknown',
          environment: data.environment ?? 'unknown',
          status: (data.status ?? 'UNKNOWN') as 'ONLINE' | 'DEGRADED' | 'OFFLINE' | 'UNKNOWN',
        };
        setSystemInfo(info);
      } catch (error) {
        logWarn('Failed to fetch system info:', error);

        // WHY: on fetch failure we assert nothing — 'unknown' everywhere instead of guessing production values.
        setSystemInfo({
          database: 'Unknown',
          environment: 'unknown',
          status: 'UNKNOWN',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSystemInfo();
  }, []);

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
    systemInfo,
    setUserPreferences,
    resetToDefaults,
    isLoading,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export default SettingsProvider;
