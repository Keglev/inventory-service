/**
 * @file useAppSettingsForm.ts
 * @module app/settings/hooks/useAppSettingsForm
 *
 * @summary
 * Custom hook for managing application settings form state and submission.
 * Encapsulates user preferences and system info state management.
 *
 * @enterprise
 * - Separates form logic from UI components
 * - Integrates with useSettings hook for data persistence
 * - Provides callbacks for form submission and defaults reset
 * - Type-safe form state management
 * - Full TypeDoc coverage for all exported functions
 */

import { useSettings } from '../../../hooks/useSettings';
import type { DateFormat, NumberFormat, TableDensity } from '../../../context/SettingsContext';

interface FormState {
  dateFormat: DateFormat;
  numberFormat: NumberFormat;
  tableDensity: TableDensity;
}

/**
 * Hook for managing application settings form state and submission.
 *
 * Provides form state, callbacks for updating preferences, and system info loading.
 * Handles persistence through useSettings hook integration.
 *
 * @returns Object containing form state, callbacks, and loading state
 *
 * @example
 * ```tsx
 * const { formState, handleDateFormatChange, isLoading } = useAppSettingsForm();
 * ```
 */
export function useAppSettingsForm() {
  const { userPreferences, systemInfo, setUserPreferences, resetToDefaults, isLoading } =
    useSettings();

  /**
   * Current form state derived from user preferences.
   */
  const formState: FormState = {
    dateFormat: userPreferences.dateFormat,
    numberFormat: userPreferences.numberFormat,
    tableDensity: userPreferences.tableDensity,
  };

  /**
   * Handle date format change.
   * Updates user preferences and persists to storage.
   *
   * @param newFormat - New date format value
   */
  const handleDateFormatChange = (newFormat: DateFormat) => {
    setUserPreferences({ dateFormat: newFormat });
  };

  /**
   * Handle number format change.
   * Updates user preferences and persists to storage.
   *
   * @param newFormat - New number format value
   */
  const handleNumberFormatChange = (newFormat: NumberFormat) => {
    setUserPreferences({ numberFormat: newFormat });
  };

  /**
   * Handle table density change.
   * Updates user preferences and persists to storage.
   *
   * @param newDensity - New table density value
   */
  const handleTableDensityChange = (newDensity: TableDensity) => {
    setUserPreferences({ tableDensity: newDensity });
  };

  /**
   * Reset all settings to default values.
   * Clears user preferences and resets to application defaults.
   */
  const handleResetDefaults = () => {
    resetToDefaults();
  };

  return {
    formState,
    systemInfo,
    isLoading,
    handleDateFormatChange,
    handleNumberFormatChange,
    handleTableDensityChange,
    handleResetDefaults,
  };
}
