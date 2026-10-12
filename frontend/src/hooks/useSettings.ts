/**
 * @file useSettings.ts
 * @module hooks/useSettings
 * @summary Convenience hook bridging SettingsContext (user preferences +
 *   runtime system info) to the component tree.
 * @enterprise
 * - Built via createContextHook (shared factory with useAuth, useHelp).
 * - Heaviest consumer of SettingsContext: 21 production call sites (measured
 *   2026-10-12) spanning the app/settings form, the analytics blocks and
 *   sections, the dashboard blocks, inventory dialogs and hooks, and the
 *   suppliers table — most read format preferences (date/number) for display.
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
