/**
 * @file useShellPreferences.ts
 * @module hooks/useShellPreferences
 *
 * @summary
 * Reads the shell-wide language and theme state from ShellPreferencesProvider.
 *
 * @enterprise
 * - Throws outside the provider (createContextHook), so a missing provider fails
 *   loudly in tests instead of rendering with silent defaults.
 */

import {
  ShellPreferencesContext,
  type ShellPreferences,
} from '../context/shellPreferences/ShellPreferencesContext.types';
import { createContextHook } from './createContextHook';

/** Language, theme mode, MUI theme and their setters. */
export const useShellPreferences = createContextHook<ShellPreferences>(
  ShellPreferencesContext,
  'useShellPreferences',
);
