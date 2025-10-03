/**
 * @file InventoryFilters.tsx
 * @module pages/inventory/InventoryFilters
 *
 * @summary
 * Reusable filter component for inventory list view.
 * Handles supplier selection and item search with proper UX.
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

export interface SupplierOption {
  id: string | number;
  label: string;
}

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
  const { t } = useTranslation();

  return (
    <Stack direction="row" spacing={2} alignItems="center">
      {/* Supplier Selection */}
      <FormControl size="small" sx={{ minWidth: 200 }}>
        <InputLabel>{t('inventory:supplier', 'Supplier')}</InputLabel>
        <Select
          value={supplierId}
          label={t('inventory:supplier', 'Supplier')}
          onChange={(e) => onSupplierChange(e.target.value)}
          disabled={supplierLoading}
        >
          <MenuItem value="">
            <em>{t('inventory:allSuppliers', 'All Suppliers')}</em>
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
        label={t('inventory:searchItems', 'Search items...')}
        value={q}
        onChange={(e) => onQChange(e.target.value)}
        disabled={disableSearchUntilSupplier && !supplierId}
        placeholder={
          disableSearchUntilSupplier && !supplierId
            ? t('inventory:selectSupplierFirst', 'Select supplier first')
            : undefined
        }
        sx={{ flexGrow: 1 }}
      />
    </Stack>
  );
};