/**
 * @file InventoryFilterPanel.tsx
 * @module pages/inventory/components/InventoryFilterPanel
 *
 * @summary
 * Filter controls for inventory filtering and search.
 * Includes: supplier dropdown, search field, below-minimum-quantity checkbox.
 *
 * @enterprise
 * - Pure presentation component with callback props
 * - No internal state or business logic
 * - Accessible form controls with proper labels
 */

import * as React from 'react';
import {
  Stack,
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

/**
 * Props for InventoryFilterPanel component.
 * 
 * @interface InventoryFilterPanelProps
 * @property {string} q - Current search query
 * @property {(q: string) => void} setQ - Callback to update search query
 * @property {string | null} supplierId - Currently selected supplier ID (null = all)
 * @property {(supplierId: string | null) => void} setSupplierId - Callback to update supplier filter
 * @property {boolean} belowMinOnly - Whether to show only items below minimum quantity
 * @property {(belowMinOnly: boolean) => void} setBelowMinOnly - Callback to toggle below-min filter
 * @property {InventorySupplier[]} suppliers - Available suppliers for dropdown
 * @property {boolean} supplierLoading - Whether supplier list is loading
 */
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

/**
 * Filter panel for inventory search and filtering.
 * 
 * Provides:
 * - Text search field for item name/code
 * - Supplier dropdown selector
 * - Below-minimum-quantity toggle checkbox
 * 
 * @component
 * @param props - Component props
 * @returns JSX element with filter controls
 * 
 * @example
 * ```tsx
 * <InventoryFilterPanel
 *   q={searchQuery}
 *   setQ={setSearchQuery}
 *   supplierId={selectedSupplierId}
 *   setSupplierId={setSelectedSupplierId}
 *   belowMinOnly={showOnlyBelowMin}
 *   setBelowMinOnly={setShowOnlyBelowMin}
 *   suppliers={supplierList}
 *   supplierLoading={isLoading}
 * />
 * ```
 */
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
    <Stack spacing={2}>
      <TextField
        label={t('inventory:filter.search', 'Search')}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        size="small"
        fullWidth
        placeholder={t('inventory:filter.searchPlaceholder', 'Item name or code')}
      />

      <FormControl size="small" fullWidth>
        <InputLabel>
          {t('inventory:filter.supplier', 'Supplier')}
        </InputLabel>
        <Select
          value={String(supplierId ?? '')}
          label={t('inventory:filter.supplier', 'Supplier')}
          onChange={(e) => setSupplierId(e.target.value || null)}
          disabled={supplierLoading}
        >
          <MenuItem value="">
            {t('inventory:filter.allSuppliers', 'All suppliers')}
          </MenuItem>
          {(suppliers ?? []).map((supplier) => (
            <MenuItem key={supplier.id} value={String(supplier.id)}>
              {supplier.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControlLabel
        control={
          <Checkbox
            checked={belowMinOnly}
            onChange={(e) => setBelowMinOnly(e.target.checked)}
          />
        }
        label={t('inventory:filter.belowMinOnly', 'Below minimum quantity only')}
      />
    </Stack>
  );
};
