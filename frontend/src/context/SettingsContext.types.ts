/**
 * @file SettingsContext.types.ts
 * @description
 * Type definitions and context object for the settings system.
 * Separated into its own file to comply with Vite's fast refresh requirements.
 */
import * as React from 'react';

export type DateFormat = 'DD.MM.YYYY' | 'YYYY-MM-DD' | 'MM/DD/YYYY';
export type NumberFormat = 'DE' | 'EN_US';
export type TableDensity = 'comfortable' | 'compact';

export interface UserPreferences {
  dateFormat: DateFormat;
  numberFormat: NumberFormat;
  tableDensity: TableDensity;
}

export interface SystemInfo {
  database: string;
  version: string;
  environment: string;
  apiVersion: string;
  buildDate: string;
  uptime: string;
  status: string;
}

export interface SettingsContextType {
  userPreferences: UserPreferences;
  systemInfo: SystemInfo | null;
  setUserPreferences: (prefs: Partial<UserPreferences>) => void;
  resetToDefaults: () => void;
  isLoading: boolean;
}

export const SettingsContext = React.createContext<SettingsContextType | undefined>(undefined);
