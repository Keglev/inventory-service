/**
 * @file useSettings.ts
 * @module hooks/useSettings
 * @summary Convenience hook bridging SettingsContext (user preferences) to the
 *   component tree.
 * @enterprise
 * - Built via createContextHook (shared factory with useAuth, useHelp).
 * - Called from the app/settings form, the analytics blocks and sections, the
 *   dashboard blocks, inventory dialogs and hooks, and the suppliers table; most
 *   read format preferences (date/number) for display.
 */

import { SettingsContext, type SettingsContextType } from '../context/settings/SettingsContext';
import { createContextHook } from './createContextHook';

/**
 * Access global settings context from anywhere in the component tree.
 * @returns Settings context with preferences and their setters
 * @throws Error if used outside SettingsProvider
 */
export const useSettings = createContextHook<SettingsContextType>(SettingsContext, 'useSettings');
