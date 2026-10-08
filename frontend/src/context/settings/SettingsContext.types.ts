/**
 * @file SettingsContext.types.ts
 * @module context/settings/SettingsContext.types
 * @summary Type definitions and the SettingsContext object — split from the
 * Provider component to comply with Vite fast refresh constraints.
 * @enterprise
 * - File hosts non-component exports (interfaces + the SettingsContext object)
 *   so SettingsContext.tsx exports component values only and preserves fast-
 *   refresh HMR. Same pattern as HelpContext.types.ts.
 * - Preferences only: runtime system facts come from the shared health query
 *   (features/health/useHealthCheck) and build metadata from config/appMeta.
 * - DateFormat / NumberFormat values are APP-INTERNAL codes, NOT BCP-47 locale
 *   tags. 'DE' and 'EN_US' map to actual locales in the formatter layer
 *   (utils/formatters.ts).
 * - SettingsContext defaults to `undefined`. The consumer hook (either
 *   hooks/useSettings.ts or this directory's useSettings.ts)
 *   throws when undefined, enforcing provider-wrapped usage.
 */

import * as React from 'react';

/**
 * Supported date format options
 * - DD.MM.YYYY: German/European format (day first)
 * - YYYY-MM-DD: ISO 8601 format (year first)
 * - MM/DD/YYYY: US format (month first)
 */
export type DateFormat = 'DD.MM.YYYY' | 'YYYY-MM-DD' | 'MM/DD/YYYY';

/**
 * Supported number format options
 * - DE: German format (comma for decimals, period for thousands)
 * - EN_US: US format (period for decimals, comma for thousands)
 */
export type NumberFormat = 'DE' | 'EN_US';

/**
 * Table display density options
 * - comfortable: Generous spacing, easier to read
 * - compact: Minimal spacing, more rows visible
 */
export type TableDensity = 'comfortable' | 'compact';

/**
 * User preferences persisted to localStorage.
 * Language-independent once set; the i18n language only seeds initial defaults.
 */
export interface UserPreferences {
  dateFormat: DateFormat;
  numberFormat: NumberFormat;
  tableDensity: TableDensity;
}

/**
 * Settings context value type
 * Provides access to preferences, plus control functions
 */
export interface SettingsContextType {
  userPreferences: UserPreferences;
  setUserPreferences: (prefs: Partial<UserPreferences>) => void;
  resetToDefaults: () => void;
}

/** Settings context (defaults to undefined; consumer hook throws when unwrapped). */
export const SettingsContext = React.createContext<SettingsContextType | undefined>(undefined);
