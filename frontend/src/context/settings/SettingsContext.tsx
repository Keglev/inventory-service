/**
 * @file SettingsContext.tsx
 * @description Settings context provider for application-wide settings
 * 
 * Manages user preferences (date/number formats, table density) and system info.
 * Loads preferences from localStorage on mount and fetches system info from backend.
 * Synchronizes preferences with i18n language changes.
 * 
 * Usage:
 * ```tsx
 * <SettingsProvider>
 *   <App />
 * </SettingsProvider>
 * ```
 */

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { getSystemInfo } from '../../utils/systemInfo.js';
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

/**
 * SettingsProvider component
 *
 * Provides global settings context to the application.
 * Responsibilities:
 * - Load user preferences from localStorage on mount
 * - Fetch system info from backend on mount (with fallbacks)
 * - Sync preferences with i18n language changes
 * - Persist preference changes to localStorage
 * - Provide reset-to-defaults functionality
 *
 * @param children - React components to wrap
 * @returns JSX with SettingsContext.Provider wrapping children
 *
 * @example
 * ```tsx
 * import { SettingsProvider } from './context/settings';
 *
 * export default function App() {
 *   return (
 *     <SettingsProvider>
 *       <Router />
 *     </SettingsProvider>
 *   );
 * }
 * ```
 */
export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { i18n } = useTranslation('common');

  // Track whether system info is being fetched from backend
  const [isLoading, setIsLoading] = React.useState(true);
  
  // System information from backend (null while loading)
  const [systemInfo, setSystemInfo] = React.useState<SystemInfo | null>(null);
  
  // User preferences with language-aware defaults on first load
  const [userPreferences, setUserPreferencesState] = React.useState<UserPreferences>(() =>
    loadPreferencesFromStorage(i18n.language)
  );

  /**
   * Fetch system information from backend on component mount
   *
   * Runs once when provider mounts. If fetch fails, uses sensible fallback values
   * to ensure systemInfo is always available (never null).
   *
   * This prevents the app from breaking if backend is temporarily down.
   */
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
        // Log warning but continue - graceful degradation if backend is down
        console.warn('Failed to fetch system info:', error);
        
        // Use fallback values so systemInfo is never null
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
        // Mark loading complete regardless of success/failure
        setIsLoading(false);
      }
    };

    // Only fetch once on mount
    fetchSystemInfo();
  }, []);

  /**
   * Sync user preferences with i18n language changes
   *
   * When user changes language, update date/number format defaults to match
   * the new language while preserving table density preference.
   *
   * Example: Changing from German to English updates:
   * - dateFormat: DD.MM.YYYY → MM/DD/YYYY
   * - numberFormat: DE → EN_US
   * - tableDensity: (unchanged)
   */
  React.useEffect(() => {
    setUserPreferencesState((prev) => {
      const updated = { ...prev };
      
      // If language changed to German, ensure formats match German locale
      if (i18n.language.startsWith('de')) {
        if (updated.dateFormat === 'MM/DD/YYYY') updated.dateFormat = 'DD.MM.YYYY';
        if (updated.numberFormat === 'EN_US') updated.numberFormat = 'DE';
      }
      // If language changed to English, ensure formats match English locale
      else {
        if (updated.dateFormat === 'DD.MM.YYYY') updated.dateFormat = 'MM/DD/YYYY';
        if (updated.numberFormat === 'DE') updated.numberFormat = 'EN_US';
      }
      
      return updated;
    });
  }, [i18n.language]);

  /**
   * Update user preferences and persist to localStorage
   *
   * Merges the new preferences with existing ones (partial update)
   * and automatically saves to localStorage.
   *
   * @param prefs - Partial preferences to update
   *
   * @example
   * ```tsx
   * // Only updates dateFormat, preserves other settings
   * setUserPreferences({ dateFormat: 'YYYY-MM-DD' });
   * ```
   */
  const setUserPreferences = (prefs: Partial<UserPreferences>) => {
    setUserPreferencesState((prev) => {
      // Merge new preferences with existing ones
      const updated = { ...prev, ...prefs };
      
      // Persist to localStorage (logs warning on failure, non-blocking)
      savePreferencesToStorage(updated);
      
      return updated;
    });
  };

  /**
   * Reset all preferences to language-appropriate defaults
   *
   * Clears localStorage entirely and resets preferences to defaults
   * for the current i18n language.
   *
   * Useful for troubleshooting and user-facing "Reset" buttons.
   */
  const resetToDefaults = () => {
    // Clear entire localStorage entry
    clearPreferencesFromStorage();
    
    // Reset state to fresh defaults for current language
    setUserPreferencesState(getDefaultPreferences(i18n.language));
  };

  /**
   * Construct the context value object
   *
   * This is passed to all consumers via useSettings() hook.
   * Contains current state and all control functions.
   */
  const value: SettingsContextType = {
    userPreferences,    // Current date/number formats, table density
    systemInfo,         // Backend system info or fallback values
    setUserPreferences, // Update and persist preferences
    resetToDefaults,    // Clear storage and restore defaults
    isLoading,          // Whether systemInfo fetch is in progress
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export default SettingsProvider;
