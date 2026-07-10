/**
 * @file InventoryFilterPanel.tsx
 * @module pages/inventory/components/InventoryFilterPanel
 *
 * @summary
 * Filter controls for the inventory table: supplier dropdown, search
 * field, and below-minimum-quantity checkbox. Responsive column on
 * mobile, row on desktop.
 *
 * @enterprise
 * - Pure presentation, callback props only. No useState, no useEffect.
 *   Filter state lives in useInventoryState; this component just
 *   reflects and dispatches.
 * - "All suppliers" is encoded as the empty-string MenuItem value (no
 *   selection); the parent setter receives null when that option is
 *   picked. Different from the AnalyticsFilters convention
 *   (supplierId === undefined for "all"); both encode "no filter" but
 *   the wire shape differs.
 * - belowMinOnly is the client-side critical-stock filter. It is NOT
 *   the same as the analytics LowStockTable view: this one filters the
 *   visible rows; LowStockTable shows a curated descending-deficit
 *   list with its own threshold business rule (config/inventoryPolicy).
 */

import * as React from 'react';
import {
  Stack,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { SupplierOption } from '../../../api/analytics/types';

interface InventoryFilterPanelProps {
  q: string;
  setQ: (q: string) => void;
  supplierId: string | number | null;
  setSupplierId: (supplierId: string | number | null) => void;
  belowMinOnly: boolean;
  setBelowMinOnly: (belowMinOnly: boolean) => void;
  suppliers: SupplierOption[] | undefined;
  supplierLoading: boolean;
}

export const InventoryFilterPanel: React.FC<InventoryFilterPanelProps> = ({
  q,
  setQ,
  supplierId,
  setSupplierId,
  belowMinOnly,
  setBelowMinOnly,
  suppliers,
  supplierLoading,
}) => {
  const { t } = useTranslation(['inventory']);

  return (
    <Stack
      spacing={2}
      direction={{ xs: 'column', md: 'row' }}
      alignItems={{ xs: 'stretch', md: 'flex-end' }}
    >
      {/* Supplier dropdown on the left */}
      <Box sx={{ flex: 1, minWidth: 220 }}>
        <FormControl size="small" fullWidth>
          <InputLabel>
            {t('inventory:filter.supplier')}
          </InputLabel>
          <Select
            value={String(supplierId ?? '')}
            label={t('inventory:filter.supplier')}
            onChange={(e) => setSupplierId(e.target.value || null)}
            disabled={supplierLoading}
          >
            <MenuItem value="">
              {t('inventory:filter.allSuppliers')}
            </MenuItem>
            {(suppliers ?? []).map((supplier) => (
              <MenuItem key={supplier.id} value={String(supplier.id)}>
                {supplier.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Item search on the right */}
      <Box sx={{ flex: 1 }}>
        <TextField
          label={t('inventory:filter.search')}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          size="small"
          fullWidth
          placeholder={t('inventory:filter.searchPlaceholder')}
        />
      </Box>

      {/* Below minimum toggle */}
      <Box sx={{ minWidth: { xs: '100%', md: 260 } }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={belowMinOnly}
              onChange={(e) => setBelowMinOnly(e.target.checked)}
            />
          }
          label={t('inventory:filter.belowMinOnly')}
        />
      </Box>
    </Stack>
  );
};
