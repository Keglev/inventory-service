/**
 * @file SupplierFilter.tsx
 * @module pages/analytics/components/filters/SupplierFilter
 *
 * @summary
 * Single-supplier search for the analytics filter panel (the shared
 * SupplierPickerField, two letters; S2-9). An empty field means "all
 * suppliers" — encoded as `supplierId === undefined`.
 *
 * @enterprise
 * - Caller passes the supplier list; this component does not fetch. The
 *   parent reuses the same list for filtering price-trend item lookups
 *   and for the supplier search here.
 * - "All suppliers" is represented as `undefined` (not empty string) so
 *   the serialized URL omits the parameter entirely.
 * - Uses an external label (not a floating one) so the field aligns with
 *   the Date Range column label in the parent panel; the label points at
 *   the input by id.
 */

import * as React from 'react';
import { Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { SupplierOption, SupplierRef } from '../../../../api/analytics/types';
import { SupplierPickerField } from '../../../../components/search/SupplierPickerField';
import type { AnalyticsFilters } from './Filters.types';

export interface SupplierFilterProps {
  /** Current filter state */
  value: AnalyticsFilters;
  /** Supplier options */
  suppliers: SupplierRef[];
  /** Called when supplier selection changes */
  onChange: (filters: AnalyticsFilters) => void;
  /** True while the supplier list loads; the field shows loading but stays enabled. */
  disabled?: boolean;
}

/**
 * SupplierFilter - search field for selecting a single supplier
 */
export function SupplierFilter({
  value,
  suppliers,
  onChange,
  disabled = false,
}: SupplierFilterProps) {
  const { t } = useTranslation(['analytics']);

  const options = React.useMemo<SupplierOption[]>(
    () => suppliers.map((supplier) => ({ id: supplier.id, label: supplier.name })),
    [suppliers],
  );

  return (
    <div>
      <Typography
        component="label"
        htmlFor="supplier-select"
        variant="body2"
        sx={{ display: 'block', mb: 0.75, fontWeight: 500 }}
      >
        {t('analytics:filters.supplier')}
      </Typography>
      <SupplierPickerField
        id="supplier-select"
        suppliers={options}
        loading={disabled}
        value={options.find((supplier) => supplier.id === value.supplierId) ?? null}
        onSelect={(supplier) => onChange({ ...value, supplierId: supplier ? supplier.id : undefined })}
        placeholder={t('analytics:filters.allSuppliers')}
      />
    </div>
  );
}
