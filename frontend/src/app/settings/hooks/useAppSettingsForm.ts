/**
 * @file useAppSettingsForm.ts
 * @module app/settings/hooks/useAppSettingsForm
 *
 * @summary
 * Custom hook for the settings form: the preference values and their change handlers.
 *
 * @enterprise
 * - Separates form logic from UI, keeping form components stateless
 * - Delegates read/write to useSettings; this hook does not own persistence — the settings context does
 */

import { useSettings } from '../../../hooks/useSettings';
import type { DateFormat, NumberFormat, TableDensity } from '../../../context/settings/SettingsContext.types';

interface FormState {
  dateFormat: DateFormat;
  numberFormat: NumberFormat;
  tableDensity: TableDensity;
}

/**
 * Hook for the settings form state; every change goes through useSettings, whose
 * context owns persistence.
 *
 * @returns Object containing form state and callbacks
 *
 * @example
 * ```tsx
 * const { formState, handleDateFormatChange } = useAppSettingsForm();
 * ```
 */
export function useAppSettingsForm() {
  const { userPreferences, setUserPreferences, resetToDefaults } = useSettings();

  const formState: FormState = {
    dateFormat: userPreferences.dateFormat,
    numberFormat: userPreferences.numberFormat,
    tableDensity: userPreferences.tableDensity,
  };

  const handleDateFormatChange = (newFormat: DateFormat) => {
    setUserPreferences({ dateFormat: newFormat });
  };

  const handleNumberFormatChange = (newFormat: NumberFormat) => {
    setUserPreferences({ numberFormat: newFormat });
  };

  const handleTableDensityChange = (newDensity: TableDensity) => {
    setUserPreferences({ tableDensity: newDensity });
  };

  const handleResetDefaults = () => {
    resetToDefaults();
  };

  return {
    formState,
    handleDateFormatChange,
    handleNumberFormatChange,
    handleTableDensityChange,
    handleResetDefaults,
  };
}
