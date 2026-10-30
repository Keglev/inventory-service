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
 * - The supplier is picked by typing (SupplierPickerField, two letters,
 *   S2-9); an empty field means all suppliers, and the parent setter
 *   receives null. Different from the AnalyticsFilters convention
 *   (supplierId === undefined for "all"); both encode "no filter" but
 *   the wire shape differs.
 * - belowMinOnly is sent to the server (belowMinimumOnly; S2-1 said
 *   "client-side"). It is NOT the same as the analytics LowStockTable
 *   view: this one filters the board's rows; LowStockTable shows a curated descending-deficit
 *   list, coloured by the shared severity rule (config/inventoryPolicy).
 */

import * as React from 'react';
import {
  Stack,
  Box,
  TextField,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { SupplierOption } from '../../../api/analytics/types';
import { SupplierPickerField } from '../../../components/search/SupplierPickerField';

export interface InventoryFilterPanelProps {
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
      sx={{
        alignItems: { xs: 'stretch', md: 'flex-end' }
      }}
    >
      {/* Supplier search on the left; empty = all suppliers */}
      <Box sx={{ flex: 1, minWidth: 220 }}>
        <SupplierPickerField
          suppliers={suppliers ?? []}
          loading={supplierLoading}
          value={(suppliers ?? []).find((supplier) => String(supplier.id) === String(supplierId)) ?? null}
          onSelect={(supplier) => setSupplierId(supplier ? supplier.id : null)}
          label={t('inventory:filter.supplier')}
          placeholder={t('inventory:filter.allSuppliers')}
        />
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
