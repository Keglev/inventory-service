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

// Ensures form state and callbacks delegate correctly to settings context.

const mockUseSettings = useSettings as MockedFunction<typeof useSettings>;

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

const setupMock = (overrides: Partial<UserPreferences> = {}, isLoading = false) => {
  const setUserPreferences = vi.fn();
  const resetToDefaults = vi.fn();
  mockUseSettings.mockReturnValue({
    userPreferences: { ...basePreferences, ...overrides },
    systemInfo: baseSystemInfo,
    setUserPreferences,
    resetToDefaults,
    isLoading,
  });
  return { setUserPreferences, resetToDefaults };
};

describe('useAppSettingsForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exposes form state derived from user preferences', () => {
    setupMock();

    const { result } = renderHook(() => useAppSettingsForm());

    expect(result.current.formState).toStrictEqual(basePreferences);
  });

  it('handles date format changes by delegating to setUserPreferences', () => {
    const { setUserPreferences } = setupMock();

    const { result } = renderHook(() => useAppSettingsForm());

    act(() => {
      result.current.handleDateFormatChange('MM/DD/YYYY');
    });

    expect(setUserPreferences).toHaveBeenCalledWith({ dateFormat: 'MM/DD/YYYY' as DateFormat });
  });

  it('handles number format changes', () => {
    const { setUserPreferences } = setupMock();

    const { result } = renderHook(() => useAppSettingsForm());

    act(() => {
      result.current.handleNumberFormatChange('EN_US');
    });

    expect(setUserPreferences).toHaveBeenCalledWith({ numberFormat: 'EN_US' as NumberFormat });
  });

  it('handles table density changes', () => {
    const { setUserPreferences } = setupMock();

    const { result } = renderHook(() => useAppSettingsForm());

    act(() => {
      result.current.handleTableDensityChange('compact');
    });

    expect(setUserPreferences).toHaveBeenCalledWith({ tableDensity: 'compact' as TableDensity });
  });

  it('resets preferences to defaults via resetToDefaults', () => {
    const { resetToDefaults } = setupMock();

    const { result } = renderHook(() => useAppSettingsForm());

    act(() => {
      result.current.handleResetDefaults();
    });

    expect(resetToDefaults).toHaveBeenCalledTimes(1);
  });

  it('passes through system info and loading state', () => {
    setupMock({}, true);

    const { result } = renderHook(() => useAppSettingsForm());

    expect(result.current.systemInfo).toBe(baseSystemInfo);
    expect(result.current.isLoading).toBe(true);
  });
});
