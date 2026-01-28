/**
 * @file useAppSettingsForm.test.ts
 * @module __tests__/app/settings/hooks/useAppSettingsForm
 * @description
 * Tests for useAppSettingsForm.
 *
 * Scope:
 * - Derives initial form state from SettingsContext.userPreferences
 * - Delegates user changes to SettingsContext.setUserPreferences with partial updates
 * - Delegates reset action to SettingsContext.resetToDefaults
 * - Passes through systemInfo and isLoading from SettingsContext
 *
 * Out of scope:
 * - Validation rules and UI rendering of settings sections
 * - Persistence implementation of settings (storage/backend)
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, type MockedFunction } from 'vitest';
import { useAppSettingsForm } from '@/app/settings/hooks/useAppSettingsForm';
import type {
  DateFormat,
  NumberFormat,
  TableDensity,
  SystemInfo,
  UserPreferences,
} from '@/context/settings/SettingsContext.types';
import { useSettings } from '@/hooks/useSettings';

vi.mock('@/hooks/useSettings', () => ({
  useSettings: vi.fn(),
}));

const mockUseSettings = useSettings as MockedFunction<typeof useSettings>;

/**
 * Stable defaults used across tests to avoid repeating fixtures.
 */
const basePreferences: UserPreferences = {
  dateFormat: 'DD.MM.YYYY',
  numberFormat: 'DE',
  tableDensity: 'comfortable',
};

const baseSystemInfo: SystemInfo = {
  database: 'Oracle ADB',
  version: '1.0.0',
  environment: 'production',
  apiVersion: 'v1',
  buildDate: '2024-01-01',
  uptime: '24h',
  status: 'ONLINE',
};

/**
 * Helper: configures SettingsContext values returned from useSettings().
 * Returning spies allows each test to assert correct delegation.
 */
function setupMock(params?: { overrides?: Partial<UserPreferences>; isLoading?: boolean }) {
  const setUserPreferences = vi.fn();
  const resetToDefaults = vi.fn();

  const overrides = params?.overrides ?? {};
  const isLoading = params?.isLoading ?? false;

  mockUseSettings.mockReturnValue({
    userPreferences: { ...basePreferences, ...overrides },
    systemInfo: baseSystemInfo,
    setUserPreferences,
    resetToDefaults,
    isLoading,
  });

  return { setUserPreferences, resetToDefaults };
}

describe('useAppSettingsForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exposes formState derived from userPreferences', () => {
    // Contract: hook mirrors settings context into a UI-friendly formState object.
    setupMock();

    const { result } = renderHook(() => useAppSettingsForm());

    expect(result.current.formState).toStrictEqual(basePreferences);
  });

  it('delegates date format changes via setUserPreferences', () => {
    // Contract: only the updated field is sent (partial update).
    const { setUserPreferences } = setupMock();

    const { result } = renderHook(() => useAppSettingsForm());

    act(() => {
      result.current.handleDateFormatChange('MM/DD/YYYY');
    });

    expect(setUserPreferences).toHaveBeenCalledWith({
      dateFormat: 'MM/DD/YYYY' as DateFormat,
    });
  });

  it('delegates number format changes via setUserPreferences', () => {
    const { setUserPreferences } = setupMock();

    const { result } = renderHook(() => useAppSettingsForm());

    act(() => {
      result.current.handleNumberFormatChange('EN_US');
    });

    expect(setUserPreferences).toHaveBeenCalledWith({
      numberFormat: 'EN_US' as NumberFormat,
    });
  });

  it('delegates table density changes via setUserPreferences', () => {
    const { setUserPreferences } = setupMock();

    const { result } = renderHook(() => useAppSettingsForm());

    act(() => {
      result.current.handleTableDensityChange('compact');
    });

    expect(setUserPreferences).toHaveBeenCalledWith({
      tableDensity: 'compact' as TableDensity,
    });
  });

  it('resets preferences to defaults via resetToDefaults', () => {
    // Contract: reset action is delegated to the context-level reset implementation.
    const { resetToDefaults } = setupMock();

    const { result } = renderHook(() => useAppSettingsForm());

    act(() => {
      result.current.handleResetDefaults();
    });

    expect(resetToDefaults).toHaveBeenCalledTimes(1);
  });

  it('passes through systemInfo and loading state', () => {
    // Contract: UI can show read-only system info and loading spinners based on context values.
    setupMock({ isLoading: true });

    const { result } = renderHook(() => useAppSettingsForm());

    expect(result.current.systemInfo).toBe(baseSystemInfo);
    expect(result.current.isLoading).toBe(true);
  });
});
