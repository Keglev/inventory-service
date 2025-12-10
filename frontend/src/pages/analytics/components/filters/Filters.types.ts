/**
 * @file Filters.types.ts
 * @description
 * Type definitions for analytics filters
 */

import type { SupplierRef } from '../../../../api/analytics/types';

/**
 * Serializable filter state synced to URL
 * Dates are ISO YYYY-MM-DD format
 */
export interface AnalyticsFilters {
  /** ISO date (YYYY-MM-DD) lower bound */
  from?: string;
  /** ISO date (YYYY-MM-DD) upper bound */
  to?: string;
  /** Selected supplier ID */
  supplierId?: string;
  /** Quick range selector: 30/90/180 days or custom */
  quick?: '30' | '90' | '180' | 'custom';
}

/**
 * Props for Filters component
 */
export interface FiltersProps {
  /** Current filter state (controlled) */
  value: AnalyticsFilters;
  /** Supplier options for dropdown */
  suppliers: SupplierRef[];
  /** Called when any filter changes */
  onChange: (next: AnalyticsFilters) => void;
  /** Whether inputs are disabled (e.g., loading) */
  disabled?: boolean;
}
