/**
 * @file QuantityAdjustSupplierSelect.tsx
 * @module pages/inventory/dialogs/QuantityAdjustDialog/QuantityAdjustSupplierSelect
 *
 * @summary
 * Step 1 of the quantity-adjust form: supplier dropdown, disabled
 * while suppliers are loading.
 *
 * @enterprise
 * - Pure presentation. Selecting a supplier triggers the upstream
 *   useEffect that resets the item selection and search query, so a
 *   supplier switch starts a clean flow.
 * - The placeholder option (empty value) renders 'Select an option'
 *   from common.json so the dropdown has a deliberate empty state.
 */

import * as React from 'react';
import { FormControl, InputLabel, Select, MenuItem, Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { SupplierOption } from '../../../../api/analytics/types';

interface QuantityAdjustSupplierSelectProps {
  selectedSupplier: SupplierOption | null;
  onSupplierChange: (supplier: SupplierOption | null) => void;
  suppliers: SupplierOption[] | undefined;
  loading: boolean;
}

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
