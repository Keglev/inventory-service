/**
 * @file Filters.types.ts
 * @module pages/analytics/components/filters/Filters.types
 *
 * @summary
 * Shared type contracts for the analytics filter panel — the serializable
 * filter state plus the props of the orchestrating `Filters` component.
 *
 * @enterprise
 * - Every field is optional; an empty object means "no filter applied".
 * - `quick` is a string literal union so URL-deserialized values are
 *   validated at compile time and at the boundary.
 * - Dates stay as ISO YYYY-MM-DD strings (not `Date` objects) so the state
 *   round-trips through URL query params without conversion.
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
