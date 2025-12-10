/**
 * @file SupplierFilter.tsx
 * @description
 * Supplier dropdown filter component
 */

import type { SupplierRef } from '../../../../api/analytics/types';
import type { AnalyticsFilters } from './Filters.types';

interface SupplierFilterProps {
  /** Current filter state */
  value: AnalyticsFilters;
  /** Supplier options */
  suppliers: SupplierRef[];
  /** Called when supplier selection changes */
  onChange: (filters: AnalyticsFilters) => void;
  disabled?: boolean;
}

/**
 * SupplierFilter - dropdown for selecting a single supplier
 */
export function SupplierFilter({
  value,
  suppliers,
  onChange,
  disabled = false,
}: SupplierFilterProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const supplierId = e.target.value || undefined;
    onChange({
      ...value,
      supplierId,
    });
  };

  return (
    <div>
      <label htmlFor="supplier-select" style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>
        Supplier
      </label>
      <select
        id="supplier-select"
        value={value.supplierId || ''}
        onChange={handleChange}
        disabled={disabled}
        style={{ width: '100%', padding: '8px 12px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }}
      >
        <option value="">All Suppliers</option>
        {suppliers.map((supplier) => (
          <option key={supplier.id} value={supplier.id}>
            {supplier.name}
          </option>
        ))}
      </select>
    </div>
  );
}
