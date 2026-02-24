/**
 * @file useSettings.test.ts
 * @module __tests__/context/settings/useSettings
 * @description Contract tests for the `useSettings` hook.
 *
 * Contract under test:
 * - Throws a helpful error when used outside of `SettingsProvider`.
 * - Returns the exact context object when a provider is present.
 *
 * Out of scope:
 * - Provider initialization logic (system info fetch, persistence, i18n sync).
 *
 * Test strategy:
 * - Use `renderHook` and a minimal Provider wrapper.
 * - Keep this file `.ts` (no JSX) to align with strict TS configs.
 */

import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';

import { SettingsContext } from '@/context/settings/SettingsContext.types';
import { useSettings } from '@/context/settings/useSettings';
import type { SettingsContextType } from '@/context/settings/SettingsContext.types';

const providerValue: SettingsContextType = {
  userPreferences: { dateFormat: 'MM/DD/YYYY', numberFormat: 'EN_US', tableDensity: 'comfortable' },
  systemInfo: {
    database: 'Oracle',
    version: '1.2.3',
    environment: 'prod',
    apiVersion: 'v1',
    buildDate: '2024-01-01',
    uptime: '12h',
    status: 'ONLINE',
  },
  setUserPreferences: () => undefined,
  resetToDefaults: () => undefined,
  isLoading: false,
};

describe('useSettings', () => {
  it('throws when used outside SettingsProvider (src/context/settings)', () => {
    expect(() => renderHook(() => useSettings())).toThrowError(
      'useSettings must be used within a SettingsProvider',
    );
  });

  it('returns SettingsContext value when wrapped by provider (src/context/settings)', () => {
    const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) =>
      React.createElement(SettingsContext.Provider, { value: providerValue, children });

    const { result } = renderHook(() => useSettings(), { wrapper });

    expect(result.current).toBe(providerValue);
  });
});
