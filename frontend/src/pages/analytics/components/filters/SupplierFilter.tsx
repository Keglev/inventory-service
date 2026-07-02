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
 * - Uses an external Typography label (not a floating InputLabel) so the
 *   dropdown aligns with the Date Range column label in the parent panel;
 *   the Select is theme-aware (dark mode) via MUI tokens.
 */

import { MenuItem, Select, Typography } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
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

  const handleChange = (e: SelectChangeEvent<string>) => {
    const supplierId = e.target.value || undefined;
    onChange({
      ...value,
      supplierId,
    });
  };

  return (
    <div>
      <Typography
        id="supplier-select-label"
        variant="body2"
        sx={{ mb: 0.75, fontWeight: 500 }}
      >
        {t('analytics:filters.supplier', 'Supplier')}
      </Typography>
      <Select
        labelId="supplier-select-label"
        id="supplier-select"
        value={value.supplierId || ''}
        onChange={handleChange}
        disabled={disabled}
        displayEmpty
        fullWidth
        size="small"
      >
        <MenuItem value="">{t('analytics:filters.allSuppliers', 'All Suppliers')}</MenuItem>
        {suppliers.map((supplier) => (
          <MenuItem key={supplier.id} value={supplier.id}>
            {supplier.name}
          </MenuItem>
        ))}
      </Select>
    </div>
  );
}
