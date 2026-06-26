/**
 * @file useSettings.ts
 * @module hooks/useSettings
 * @summary Convenience hook bridging SettingsContext (user preferences +
 *   runtime system info) to the component tree.
 * @enterprise
 * - Built via createContextHook (shared factory with useAuth, useHelp).
 * - Heaviest consumer of SettingsContext: 17 production call sites spanning
 *   HamburgerMenu (Appearance, LanguageRegion), app/settings form, all
 *   analytics blocks, inventory columns hook, and the suppliers table — most
 *   read format preferences (date/number) for display rendering.
 * - Bridges TWO concerns that the SettingsContext combines: user preferences
 *   (locale, formats) and runtime system info (DB flavor via getSystemInfo()).
 *   See CB-APP1 (re-scoped) for the open question of splitting build-time vs
 *   runtime metadata sources — not actioned here.
 */

import { SettingsContext, type SettingsContextType } from '../context/settings/SettingsContext';
import { createContextHook } from './createContextHook';

/**
 * Access global settings context from anywhere in the component tree.
 * @returns Settings context with preferences, system info, and utility functions
 * @throws Error if used outside SettingsProvider
 */
export const useSettings = createContextHook<SettingsContextType>(SettingsContext, 'useSettings');
