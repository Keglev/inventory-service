/**
 * @file settings/index.ts
 * @module context/settings
 * @summary Barrel re-export for the settings context module: Provider,
 * Context, useSettings (twin — see ST-APP9), all types, and storage helpers.
 * @enterprise
 * - Re-exports the context-twin useSettings (./useSettings). Verified by
 *   grep: NO production file imports useSettings via this barrel. The
 *   re-export survives only because the twin survives. Will be cleaned up
 *   when ST-APP9 closes.
 * - Storage helpers are exported for tests + the AppSettings dialog advanced
 *   features.
 */
export { SettingsProvider, SettingsContext } from './SettingsContext';
export type { DateFormat, NumberFormat, TableDensity, UserPreferences, SystemInfo, SettingsContextType } from './SettingsContext.types';
export { getDefaultPreferences, loadPreferencesFromStorage, savePreferencesToStorage, clearPreferencesFromStorage } from './SettingsStorage';
