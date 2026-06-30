/**
 * @file SettingsContext.tsx
 * @module context/settings/SettingsContext
 * @summary SettingsProvider component owning user preferences (date/number
 * formats, table density) and runtime system info from /api/health,
 * with language-aware defaults and localStorage persistence.
 * @enterprise
 * - Two concerns bridged in one context: USER PREFERENCES (locale-sensitive,
 *   persisted to localStorage under 'appSettings') and RUNTIME SYSTEM INFO
 *   (database flavor + health status from /api/health). See CB-APP1 (re-scoped
 *   in MASTER) for the open question of splitting these into separate sources
 *   of truth.
 * - SINGLE production consumer of getSystemInfo() (utils/systemInfo). The
 *   fetched object's apiVersion/buildDate/uptime/version/environment fields
 *   are FABRICATIONS — see CB-APP18 in MASTER. This file applies a SECOND
 *   layer of fallbacks on top.
 * - Language-sync effect: on i18n.language change, format defaults are
 *   silently rewritten to match locale. KNOWN BUGS — see CB-APP33 (overwrites
 *   explicit user choice) and CB-APP34 (in-memory only, not persisted).
 * - On /api/health fetch failure, fallback values are HARDCODED
 *   (database: 'Oracle ADB', environment: 'production'). These ship to the UI
 *   as assertions — particularly suspect because fetch failures are more likely
 *   in dev. → CB-APP32.
 * - Consumed via hooks/useSettings.ts — the factory-built consumer hook with
 *   16 production call sites. The former sibling duplicate
 *   context/settings/useSettings.ts has been removed. → ST-APP9.
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

export type { DateFormat, NumberFormat, TableDensity, UserPreferences, SystemInfo, SettingsContextType } from './SettingsContext.types';
export { SettingsContext };

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { i18n } = useTranslation('common');

  const [isLoading, setIsLoading] = React.useState(true);
  const [systemInfo, setSystemInfo] = React.useState<SystemInfo | null>(null);
  const [userPreferences, setUserPreferencesState] = React.useState<UserPreferences>(() =>
    loadPreferencesFromStorage(i18n.language)
  );

  /** One-time fetch on mount; fallbacks ensure systemInfo is never null. See CB-APP32 for fallback concerns. */
  React.useEffect(() => {
    const fetchSystemInfo = async () => {
      try {
        const data = await getSystemInfo();
        const info: SystemInfo = {
          database: data.database ?? 'Unknown',
          version: data.version ?? '1.0.0',
          environment: data.environment ?? 'production',
          apiVersion: data.apiVersion ?? 'v1',
          buildDate: data.buildDate ?? 'Unknown',
          uptime: data.uptime ?? 'Unknown',
          status: (data.status ?? 'UNKNOWN') as 'ONLINE' | 'DEGRADED' | 'OFFLINE' | 'UNKNOWN',
        };
        setSystemInfo(info);
      } catch (error) {
        // BUCKET: unguarded console.warn ships to production; wrap in import.meta.env.DEV or remove (CB-APP35 — also at SettingsStorage.ts lines 47, 65, 79)
        console.warn('Failed to fetch system info:', error);

        // BUCKET: hardcoded fallbacks ship to UI on fetch failure — database: 'Oracle ADB' and environment: 'production' are strong assertions, particularly suspect since fetch failure is more likely in dev (CB-APP32)
        setSystemInfo({
          database: 'Oracle ADB',
          version: 'dev',
          environment: 'production',
          apiVersion: 'unknown',
          buildDate: 'unknown',
          uptime: '0h',
          status: 'UNKNOWN',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSystemInfo();
  }, []);

  /** Sync format defaults to current i18n language on language change. */
  React.useEffect(() => {
    setUserPreferencesState((prev) => {
      const updated = { ...prev };
      // BUCKET: silently overwrites explicit user-chosen formats (e.g. ISO YYYY-MM-DD survives but MM/DD/YYYY in a German UI gets overwritten on language change) — explicit preferences should be sticky (CB-APP33)
      // BUCKET: mutates state only; does NOT call savePreferencesToStorage, so next mount reloads old prefs from storage until something else triggers persistence (CB-APP34)
      if (i18n.language.startsWith('de')) {
        if (updated.dateFormat === 'MM/DD/YYYY') updated.dateFormat = 'DD.MM.YYYY';
        if (updated.numberFormat === 'EN_US') updated.numberFormat = 'DE';
      } else {
        if (updated.dateFormat === 'DD.MM.YYYY') updated.dateFormat = 'MM/DD/YYYY';
        if (updated.numberFormat === 'DE') updated.numberFormat = 'EN_US';
      }
      
      return updated;
    });
  }, [i18n.language]);

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
