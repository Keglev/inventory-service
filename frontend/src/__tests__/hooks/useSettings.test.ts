/**
 * @file useSettings.test.ts
 * @module __tests__/hooks/useSettings
 * @description Enterprise contract tests for the `@/hooks/useSettings` convenience hook.
 *
 * Contract under test:
 * - When called outside `SettingsContext.Provider`, `useSettings()` throws a clear error.
 * - When a provider is present, `useSettings()` returns the exact context value.
 *
 * Out of scope:
 * - `SettingsProvider` behavior (system info fetch, localStorage persistence, i18n sync).
 * - Consumer logic (components that read settings values).
 *
 * Test strategy:
 * - Use `renderHook` for direct hook execution.
 * - Wrap in a minimal `SettingsContext.Provider` to avoid provider side effects.
 * - Keep assertions strict and deterministic.
 */

import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

import { SettingsContext } from '@/context/settings/SettingsContext';
import type { SettingsContextType } from '@/context/settings/SettingsContext.types';
import { useSettings } from '@/hooks/useSettings';

// Minimal context value to satisfy `SettingsContextType`.
// Maintenance note: keep this object in sync with `SettingsContextType`.
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
  setUserPreferences: vi.fn(),
  resetToDefaults: vi.fn(),
  isLoading: false,
};

describe('useSettings (src/hooks/useSettings)', () => {
  it('throws when used outside SettingsProvider (src/hooks)', () => {
    // The thrown message is part of the integration contract for this convenience hook.
    expect(() => renderHook(() => useSettings())).toThrowError(
      'useSettings must be used within the corresponding provider',
    );
  });

  it('returns SettingsContext value when wrapped by provider (src/hooks)', () => {
    // Use a provider wrapper (not SettingsProvider) to keep this test isolated from effects.
    const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) =>
      React.createElement(SettingsContext.Provider, { value: providerValue, children });

    const { result } = renderHook(() => useSettings(), { wrapper });

    // Identity equality ensures we didn't clone/transform the context value.
    expect(result.current).toBe(providerValue);
  });
});
