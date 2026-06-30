/**
 * @file InventoryFilters.tsx
 * @module pages/inventory/InventoryFilters
 *
 * @summary
 * Reusable supplier + search filter component. Renders a supplier
 * dropdown (with All Suppliers option) and a search text field, with
 * an optional gate disabling search until a supplier is chosen.
 *
 * @enterprise
 * - Appears to be a parallel filter component to
 *   components/InventoryFilterPanel. The page-level board
 *   (InventoryBoard) wires InventoryFilterPanel, not this file --
 *   making this a dead-code candidate. Tracked under ST-APP18:
 *   verify zero production callers across the frontend; if confirmed,
 *   delete in the refactor phase. The supplier+search interface here
 *   diverges from InventoryFilterPanel (no below-min toggle, different
 *   "all suppliers" encoding via empty-string value), so the two
 *   files have actually drifted -- not pure duplicates.
 * - SupplierOption is re-exported for "backward compatibility" with
 *   callers that import from this file. If ST-APP18 confirms dead
 *   code, the re-export and any backward-compat assumption can go
 *   together.
 * - disableSearchUntilSupplier toggle exists to model the "must pick
 *   a supplier first" UX explicitly, rather than relying on the
 *   parent to coordinate the gate. The current consumer (if any)
 *   would dictate whether the gate is useful.
 */

import * as React from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  CircularProgress,
  Stack,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { SupplierOption } from '../../api/analytics/types';

// BUCKET: ST-APP18 -- file appears to be a dead/parallel filter component (InventoryBoard uses InventoryFilterPanel instead). Verify zero production callers, then delete.
// Re-export for backward compatibility
export type { SupplierOption };

export interface InventoryFiltersProps {
  /** Current search query */
  q: string;
  /** Callback when search query changes */
  onQChange: (q: string) => void;
  /** Currently selected supplier ID */
  supplierId: string | number;
  /** Callback when supplier selection changes */
  onSupplierChange: (supplierId: string | number) => void;
  /** Available supplier options */
  supplierOptions: SupplierOption[];
  /** Whether suppliers are loading */
  supplierLoading: boolean;
  /** Whether to disable search until supplier is selected */
  disableSearchUntilSupplier?: boolean;
}

export const InventoryFilters: React.FC<InventoryFiltersProps> = ({
  q,
  onQChange,
  supplierId,
  onSupplierChange,
  supplierOptions,
  supplierLoading,
  disableSearchUntilSupplier = false,
}) => {
  const { t } = useTranslation(['inventory']);

  return (
    <Stack direction="row" spacing={2} alignItems="center">
      {/* Supplier Selection */}
      <FormControl size="small" sx={{ minWidth: 200 }}>
        <InputLabel>{t('inventory:table.supplier', 'Supplier')}</InputLabel>
        <Select
          value={supplierId}
          label={t('inventory:table.supplier', 'Supplier')}
          onChange={(e) => onSupplierChange(e.target.value)}
          disabled={supplierLoading}
        >
          <MenuItem value="">
            <em>{t('inventory:search.allSuppliers', 'All Suppliers')}</em>
          </MenuItem>
          {supplierOptions.map((supplier) => (
            <MenuItem key={supplier.id} value={supplier.id}>
              {supplier.label}
            </MenuItem>
          ))}
        </Select>
        {supplierLoading && (
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
            <CircularProgress size={12} sx={{ mr: 0.5 }} />
          </Box>
        )}
      </FormControl>

      {/* Search Field */}
      <TextField
        size="small"
        label={t('inventory:search.searchItems', 'Search items...')}
        value={q}
        onChange={(e) => onQChange(e.target.value)}
        disabled={disableSearchUntilSupplier && !supplierId}
        placeholder={
          disableSearchUntilSupplier && !supplierId
            ? t('inventory:search.selectSupplierFirst', 'Select supplier first')
            : undefined
        }
        sx={{ flexGrow: 1 }}
      />
    </Stack>
  );
};