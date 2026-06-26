/**
 * @file useAppSettingsForm.ts
 * @module app/settings/hooks/useAppSettingsForm
 *
 * @summary
 * Custom hook for managing application settings form state and submission.
 * Encapsulates user preferences and system info state management.
 *
 * @enterprise
 * - Separates form logic from UI, keeping form components stateless
 * - Delegates read/write to useSettings; this hook does not own persistence — the settings context does
 */

import { useSettings } from '../../../hooks/useSettings';
import type { DateFormat, NumberFormat, TableDensity } from '../../../context/settings';

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

  const formState: FormState = {
    dateFormat: userPreferences.dateFormat,
    numberFormat: userPreferences.numberFormat,
    tableDensity: userPreferences.tableDensity,
  };

  /**
   * Updates date format preference via the settings context; persistence is owned by the context.
   *
   * @param newFormat - New date format value
   */
  const handleDateFormatChange = (newFormat: DateFormat) => {
    setUserPreferences({ dateFormat: newFormat });
  };

  /**
   * Updates number format preference via the settings context; persistence is owned by the context.
   *
   * @param newFormat - New number format value
   */
  const handleNumberFormatChange = (newFormat: NumberFormat) => {
    setUserPreferences({ numberFormat: newFormat });
  };

  /**
   * Updates table density preference via the settings context; persistence is owned by the context.
   *
   * @param newDensity - New table density value
   */
  const handleTableDensityChange = (newDensity: TableDensity) => {
    setUserPreferences({ tableDensity: newDensity });
  };

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
