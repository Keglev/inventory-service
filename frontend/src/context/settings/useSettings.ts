/**
 * @file useSettings.ts
 * @description Hook to access settings context anywhere in the application
 * 
 * Separated from provider to satisfy react-refresh fast refresh requirements
 * (providers should not export hooks to avoid fast refresh issues).
 */

import * as React from 'react';
import { SettingsContext } from './SettingsContext.types';
import type { SettingsContextType } from './SettingsContext.types';

/**
 * Access settings context from any component
 * 
 * Provides user preferences (date/number formats, table density) and system info.
 * Allows updating preferences with automatic localStorage persistence.
 * 
 * Must be called within a component tree wrapped with <SettingsProvider>.
 * 
 * @throws Error if called outside of SettingsProvider
 * @returns Settings context with preferences, system info, and control functions
 * 
 * @example
 * ```tsx
 * const { userPreferences, setUserPreferences } = useSettings();
 * setUserPreferences({ dateFormat: 'YYYY-MM-DD' });
 * ```
 */
export const useSettings = (): SettingsContextType => {
  const context = React.useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
