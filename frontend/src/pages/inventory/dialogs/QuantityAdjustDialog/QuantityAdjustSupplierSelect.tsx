/**
 * @file QuantityAdjustSupplierSelect.tsx
 * @module dialogs/QuantityAdjustDialog/QuantityAdjustSupplierSelect
 *
 * @summary
 * Specialized component for supplier selection step.
 * Pure presentation component with no business logic.
 *
 * @enterprise
 * - Single responsibility: render supplier dropdown only
 * - Accepts supplier options and callbacks as props
 * - Handles loading state gracefully
 */

import * as React from 'react';
import { FormControl, InputLabel, Select, MenuItem, Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { SupplierOption } from '../../../../api/analytics/types';

/**
 * Props for QuantityAdjustSupplierSelect component.
 * 
 * @interface QuantityAdjustSupplierSelectProps
 * @property {SupplierOption | null} selectedSupplier - Currently selected supplier
 * @property {(supplier: SupplierOption | null) => void} onSupplierChange - Supplier selection handler
 * @property {SupplierOption[] | undefined} suppliers - Available suppliers
 * @property {boolean} loading - Whether suppliers are loading
 */
interface QuantityAdjustSupplierSelectProps {
  selectedSupplier: SupplierOption | null;
  onSupplierChange: (supplier: SupplierOption | null) => void;
  suppliers: SupplierOption[] | undefined;
  loading: boolean;
}

/**
 * Step 1: Supplier selection component.
 * 
 * Renders a dropdown for selecting the supplier to filter items.
 * Disables selection while suppliers are loading.
 * 
 * @component
 * @param props - Component props
 * @returns JSX element for supplier selection dropdown
 * 
 * @example
 * ```tsx
 * <QuantityAdjustSupplierSelect
 *   selectedSupplier={form.selectedSupplier}
 *   onSupplierChange={form.setSelectedSupplier}
 *   suppliers={form.suppliers}
 *   loading={form.suppliersLoading}
 * />
 * ```
 */
export const QuantityAdjustSupplierSelect: React.FC<QuantityAdjustSupplierSelectProps> = ({
  selectedSupplier,
  onSupplierChange,
  suppliers,
  loading,
}) => {
  const { t } = useTranslation(['common', 'inventory']);

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom color="primary">
        {t('inventory:steps.selectSupplier', 'Step 1: Select Supplier')}
      </Typography>

      <FormControl fullWidth size="small">
        <InputLabel>{t('inventory:table.supplier', 'Supplier')}</InputLabel>
        <Select
          value={selectedSupplier?.id || ''}
          label={t('inventory:table.supplier', 'Supplier')}
          onChange={(e) => {
            const supplierId = e.target.value;
            const supplier = suppliers?.find((s) => String(s.id) === String(supplierId)) || null;
            onSupplierChange(supplier);
          }}
          disabled={loading}
        >
          <MenuItem value="">
            <em>{t('common:selectOption', 'Select an option')}</em>
          </MenuItem>
          {suppliers?.map((supplier) => (
            <MenuItem key={supplier.id} value={supplier.id}>
              {supplier.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};
