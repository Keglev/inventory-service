/**
 * @file useSettings.ts
 * @module context/settings/useSettings
 * @summary useSettings hook: useContext + null-check + throw access to
 * SettingsContext. ALSO EXISTS as a factory-built twin in
 * hooks/useSettings.ts — see ST-APP9.
 * @enterprise
 * - DUPLICATE EXPORT. The canonical consumer hook is
 *   frontend/src/hooks/useSettings.ts (16 production call sites, built via
 *   createContextHook). This file has 0 production consumers — only 2 test
 *   files import it directly.
 * - Error messages diverge across twins:
 *     this file: "useSettings must be used within a SettingsProvider"
 *     factory:   "useSettings must be used within the corresponding provider"
 *   Dev-only divergence; not user-facing.
 * - Kept until ST-APP9 closes — deletion is a behavior change (the 2 test
 *   imports + the barrel re-export would break and need redirecting).
 */

import * as React from 'react';
import { SettingsContext } from './SettingsContext.types';
import type { SettingsContextType } from './SettingsContext.types';

/**
 * Provides access to SettingsContext. Must be called within a SettingsProvider.
 *
 * @throws Error if called outside of SettingsProvider
 * @returns Settings context with preferences, system info, and control functions
 */
// BUCKET: duplicate of hooks/useSettings.ts (factory-built canonical hook with 16 prod consumers); this twin has 0 prod consumers, used only by 2 tests + an unused barrel re-export; recommend deleting this file and redirecting the 2 test imports to hooks/useSettings (ST-APP9)
export const useSettings = (): SettingsContextType => {
  const context = React.useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
