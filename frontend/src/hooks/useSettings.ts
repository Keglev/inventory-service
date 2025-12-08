/**
 * @file useSettings.ts
 * @description
 * Custom hook for accessing global settings context.
 * Provides type-safe access to user preferences and system info throughout the app.
 *
 * @usage
 * import { useSettings } from '../hooks/useSettings'
 * const { userPreferences, systemInfo } = useSettings()
 */

import { SettingsContext, type SettingsContextType } from '../context/SettingsContext';
import { createContextHook } from './createContextHook';

/**
 * Access global settings context from anywhere in the component tree.
 * Must be used within a component wrapped by SettingsProvider.
 * @returns Settings context with preferences, system info, and utility functions
 * @throws Error if used outside SettingsProvider
 * @example
 * const { userPreferences, systemInfo, setUserPreferences } = useSettings()
 * console.log(userPreferences.dateFormat)  // → 'DD.MM.YYYY'
 * console.log(systemInfo.database)         // → 'Oracle ADB'
 */
export const useSettings = createContextHook<SettingsContextType>(SettingsContext, 'useSettings');
