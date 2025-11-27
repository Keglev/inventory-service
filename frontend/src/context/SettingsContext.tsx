/**
 * @file SettingsContext.tsx
 * @description
 * Global settings context provider for user preferences and system information.
 * Manages date format, number format, table density, and system info.
 * Persists user preferences to localStorage.
 *
 * @enterprise
 * - Centralized state management
 * - localStorage persistence
 * - Language-aware defaults
 * - Auto-fetch system info on mount
 *
 * @usage
 * Wrap App.tsx with <SettingsProvider>
 * Access anywhere with: const { userPreferences, systemInfo } = useSettings()
 */
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { getSystemInfo } from '../utils/systemInfo.js';
import { SettingsContext, type SettingsContextType, type UserPreferences, type SystemInfo } from './SettingsContext.types';

// Re-export types for backward compatibility
export type { DateFormat, NumberFormat, TableDensity, UserPreferences, SystemInfo, SettingsContextType } from './SettingsContext.types';
export { SettingsContext } from './SettingsContext.types';

const STORAGE_KEY = 'appSettings';

/**
 * Get default preferences based on i18n language
 */
const getDefaultPreferences = (language: string): UserPreferences => ({
  dateFormat: language.startsWith('de') ? 'DD.MM.YYYY' : 'MM/DD/YYYY',
  numberFormat: language.startsWith('de') ? 'DE' : 'EN_US',
  tableDensity: 'compact',
});

/**
 * Load preferences from localStorage or return defaults
 */
const loadPreferences = (language: string): UserPreferences => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.userPreferences) {
        return { ...getDefaultPreferences(language), ...parsed.userPreferences };
      }
    }
  } catch (error) {
    console.warn('Failed to load settings from localStorage:', error);
  }
  return getDefaultPreferences(language);
};

/**
 * Save preferences to localStorage
 */
const savePreferences = (prefs: UserPreferences): void => {
  try {
    const data = {
      version: 1,
      userPreferences: prefs,
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to save settings to localStorage:', error);
  }
};

/**
 * SettingsProvider: Wrap around App.tsx
 */
export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { i18n } = useTranslation('common');
  const [isLoading, setIsLoading] = React.useState(true);
  const [systemInfo, setSystemInfo] = React.useState<SystemInfo | null>(null);
  const [userPreferences, setUserPreferencesState] = React.useState<UserPreferences>(() =>
    loadPreferences(i18n.language)
  );

  /**
   * Fetch system info once on mount
   */
  React.useEffect(() => {
    const fetchSystemInfo = async () => {
      try {
        const info = await getSystemInfo();
        setSystemInfo(info);
      } catch (error) {
        console.warn('Failed to fetch system info:', error);
        // Fallback values if fetch fails
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

  /**
   * Sync preferences with i18n language changes
   */
  React.useEffect(() => {
    setUserPreferencesState((prev) => {
      const updated = { ...prev };
      // Update format defaults if language changed
      if (i18n.language.startsWith('de')) {
        if (updated.dateFormat === 'MM/DD/YYYY') {
          updated.dateFormat = 'DD.MM.YYYY';
        }
        if (updated.numberFormat === 'EN_US') {
          updated.numberFormat = 'DE';
        }
      } else {
        if (updated.dateFormat === 'DD.MM.YYYY') {
          updated.dateFormat = 'MM/DD/YYYY';
        }
        if (updated.numberFormat === 'DE') {
          updated.numberFormat = 'EN_US';
        }
      }
      return updated;
    });
  }, [i18n.language]);

  /**
   * Update preferences and persist to localStorage
   */
  const setUserPreferences = (prefs: Partial<UserPreferences>) => {
    setUserPreferencesState((prev) => {
      const updated = { ...prev, ...prefs };
      savePreferences(updated);
      return updated;
    });
  };

  /**
   * Reset to defaults and clear localStorage
   */
  const resetToDefaults = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setUserPreferencesState(getDefaultPreferences(i18n.language));
    } catch (error) {
      console.warn('Failed to reset settings:', error);
    }
  };

  const value: SettingsContextType = {
    userPreferences,
    systemInfo,
    setUserPreferences,
    resetToDefaults,
    isLoading,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export default SettingsProvider;
