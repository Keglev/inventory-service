/**
 * @file SettingsContext.types.ts
 * @description Type definitions and context object for application settings
 * 
 * Centralizes all types related to user preferences (date/number formats, table density)
 * and system information fetched from backend.
 */

import * as React from 'react';

/**
 * Supported date format options
 * - DD.MM.YYYY: German/European format (day first)
 * - YYYY-MM-DD: ISO 8601 format (year first)
 * - MM/DD/YYYY: US format (month first)
 */
export type DateFormat = 'DD.MM.YYYY' | 'YYYY-MM-DD' | 'MM/DD/YYYY';

/**
 * Supported number format options
 * - DE: German format (comma for decimals, period for thousands)
 * - EN_US: US format (period for decimals, comma for thousands)
 */
export type NumberFormat = 'DE' | 'EN_US';

/**
 * Table display density options
 * - comfortable: Generous spacing, easier to read
 * - compact: Minimal spacing, more rows visible
 */
export type TableDensity = 'comfortable' | 'compact';

/**
 * User preferences persisted to localStorage
 * These are user-customizable settings synced with language changes
 */
export interface UserPreferences {
  dateFormat: DateFormat;
  numberFormat: NumberFormat;
  tableDensity: TableDensity;
}

/**
 * System information fetched from backend
 * Provides deployment context, versions, and health status
 */
export interface SystemInfo {
  database: string;              // e.g., 'Oracle ADB', 'PostgreSQL'
  version: string;               // Application semantic version (e.g., '1.0.0')
  environment: string;           // e.g., 'production', 'staging', 'development'
  apiVersion: string;            // Backend API version for compatibility
  buildDate: string;             // ISO 8601 timestamp of build
  uptime: string;                // Duration string (e.g., '24h 30m')
  status: 'ONLINE' | 'DEGRADED' | 'OFFLINE' | 'UNKNOWN'; // System health status
}

/**
 * Settings context value type
 * Provides access to preferences and system info, plus control functions
 */
export interface SettingsContextType {
  userPreferences: UserPreferences;      // Current user settings
  systemInfo: SystemInfo | null;         // Backend system info (null while loading)
  setUserPreferences: (prefs: Partial<UserPreferences>) => void; // Update & persist
  resetToDefaults: () => void;           // Clear storage and restore defaults
  isLoading: boolean;                    // Whether systemInfo is being fetched
}

/**
 * Settings context React Context object
 * Initialized with undefined for strict type-checking with hooks
 */
export const SettingsContext = React.createContext<SettingsContextType | undefined>(undefined);
