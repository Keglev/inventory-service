/**
 * @file InventoryFilters.tsx
 * @module pages/inventory/InventoryFilters
 *
 * @summary
 * Compact filter row for the Inventory list: search + supplier filter.
 * Emits controlled values upward; does not own data fetching.
 *
 * @enterprise
 * - Keep this component "dumb" (no API calls): easier to test and reuse.
 * - Debounce happens in the parent, so typing stays snappy.
 */

import * as React from 'react';
import { Box, TextField, Autocomplete } from '@mui/material';
import { useTranslation } from 'react-i18next';

export interface SupplierOption {
  id: string | number;
  label: string;
}

export interface InventoryFiltersProps {
  /** Current search text. */
  q: string;
  /** Called when search text changes. */
  onQChange: (next: string) => void;
  /** Selected supplier id (nullable). */
  supplierId: string | number | null;
  /** Called when supplier changes. */
  onSupplierChange: (next: string | number | null) => void;
  /** Supplier options to render (parent owns querying). */
  supplierOptions: SupplierOption[];
  /** Loading flag for supplier options (optional). */
  supplierLoading?: boolean;
}

export const InventoryFilters: React.FC<InventoryFiltersProps> = ({
  q,
  onQChange,
  supplierId,
  onSupplierChange,
  supplierOptions,
  supplierLoading,
}) => {
  const { t } = useTranslation(['common', 'analytics', 'auth']);

  const selected =
    supplierOptions.find((o) => String(o.id) === String(supplierId)) ?? null;

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 320px' }, gap: 1 }}>
      <TextField
        size="small"
        label={t('filters.search', 'Search')}
        placeholder={t('filters.searchPlaceholder', 'Name or code')}
        value={q}
        onChange={(e) => onQChange(e.target.value)}
        inputProps={{ 'aria-label': t('filters.search', 'Search') }}
      />

      <Autocomplete
        size="small"
        options={supplierOptions}
        loading={supplierLoading}
        value={selected}
        onChange={(_, opt) => onSupplierChange(opt ? opt.id : null)}
        getOptionLabel={(o) => o.label}
        isOptionEqualToValue={(a, b) => String(a.id) === String(b.id)}
        renderInput={(params) => (
          <TextField {...params} label={t('filters.supplier', 'Supplier')} />
        )}
      />
    </Box>
  );
};
