/**
 * @file settings/index.ts
 * @description Barrel export for settings context and utilities
 * 
 * Exports all public APIs from the settings context module:
 * - SettingsProvider: Component to wrap app with settings context
 * - useSettings: Hook to access settings anywhere
 * - SettingsContext: Raw context object (rarely needed directly)
 * - Types: DateFormat, NumberFormat, TableDensity, UserPreferences, SystemInfo
 * - Utilities: Storage functions for testing/advanced usage
 */
export { SettingsProvider, SettingsContext } from './SettingsContext';
export { useSettings } from './useSettings';
export type { DateFormat, NumberFormat, TableDensity, UserPreferences, SystemInfo, SettingsContextType } from './SettingsContext.types';
export { getDefaultPreferences, loadPreferencesFromStorage, savePreferencesToStorage, clearPreferencesFromStorage } from './SettingsStorage';
