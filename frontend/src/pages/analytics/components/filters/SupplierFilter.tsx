/**
 * @file SupplierFilter.tsx
 * @module pages/analytics/components/filters/SupplierFilter
 *
 * @summary
 * Single-supplier dropdown for the analytics filter panel. Empty value
 * means "all suppliers" — encoded as `supplierId === undefined`.
 *
 * @enterprise
 * - Caller passes the supplier list; this component does not fetch. The
 *   parent reuses the same list for filtering price-trend item lookups
 *   and for the supplier dropdown here.
 * - "All suppliers" is represented as `undefined` (not empty string) so
 *   the serialized URL omits the parameter entirely.
 * - Rendered with a native `<select>` rather than MUI Select; visual
 *   divergence from sibling filter components is tracked separately.
 */

import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation(['analytics']);
  
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
        {t('analytics:filters.supplier', 'Supplier')}
      </label>
      <select
        id="supplier-select"
        value={value.supplierId || ''}
        onChange={handleChange}
        disabled={disabled}
        style={{ width: '100%', padding: '8px 12px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }}
      >
        <option value="">{t('analytics:filters.allSuppliers', 'All Suppliers')}</option>
        {suppliers.map((supplier) => (
          <option key={supplier.id} value={supplier.id}>
            {supplier.name}
          </option>
        ))}
      </select>
    </div>
  );
}
