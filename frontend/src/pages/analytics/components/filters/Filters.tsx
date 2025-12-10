/**
 * @file Filters.tsx
 * @description
 * Main analytics filters component - orchestrates date range and supplier filters
 */

import { DateRangeFilter } from './DateRangeFilter';
import { SupplierFilter } from './SupplierFilter';
import type { FiltersProps, AnalyticsFilters } from './Filters.types';

/**
 * Filters - Main filter panel for analytics page
 *
 * Manages:
 * - Date range selection (quick presets + custom)
 * - Supplier filtering
 *
 * @example
 * ```tsx
 * <Filters
 *   value={filters}
 *   suppliers={suppliersList}
 *   onChange={setFilters}
 *   disabled={isLoading}
 * />
 * ```
 */
export function Filters({
  value,
  suppliers,
  onChange,
  disabled = false,
}: FiltersProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '16px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
      <div>
        <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Filters</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Date Range Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">Date Range</label>
            <DateRangeFilter value={value} onChange={onChange} disabled={disabled} />
          </div>

          {/* Supplier Filter */}
          <div>
            <SupplierFilter
              value={value}
              suppliers={suppliers}
              onChange={onChange}
              disabled={disabled}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export type { AnalyticsFilters, FiltersProps };
