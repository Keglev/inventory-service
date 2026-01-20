/**
 * @file useSettings.test.ts
 * @module tests/context/settings/useSettings
 *
 * @summary
 * Verifies the defensive behaviour of the useSettings hook.
 * Confirms provider presence requirement and proper context passthrough.
 *
 * @enterprise
 * - Prevents silent failures when developers forget the provider wrapper
 * - Guarantees downstream consumers receive the exact context object
 * - Protects against regressions during refactors of the settings provider
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
  it('throws helpful error when provider is missing', () => {
    expect(() => renderHook(() => useSettings())).toThrowError(
      'useSettings must be used within a SettingsProvider',
    );
  });

  it('returns context value when wrapped by provider', () => {
    const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) =>
      React.createElement(SettingsContext.Provider, { value: providerValue, children });

    const { result } = renderHook(() => useSettings(), { wrapper });

    expect(result.current).toBe(providerValue);
  });
});
