/**
 * @file QuantityAdjustSupplierSelect.tsx
 * @module pages/inventory/dialogs/QuantityAdjustDialog/QuantityAdjustSupplierSelect
 *
 * @summary
 * Step 1 of the quantity-adjust form: the shared supplier search field
 * (SupplierPickerField, two letters; S2-9).
 *
 * @enterprise
 * - Pure presentation. Selecting a supplier triggers the upstream
 *   useEffect that resets the item selection and search query, so a
 *   supplier switch starts a clean flow.
 * - The field stays enabled while suppliers load (ListSearchField: a
 *   disabled field drops focus and loses what the user types).
 */

import * as React from 'react';
import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { SupplierOption } from '../../../../api/analytics/types';
import { SupplierPickerField } from '../../../../components/search/SupplierPickerField';

export interface QuantityAdjustSupplierSelectProps {
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
        {t('inventory:steps.selectSupplier')}
      </Typography>

      <SupplierPickerField
        suppliers={suppliers ?? []}
        loading={loading}
        value={selectedSupplier}
        onSelect={onSupplierChange}
        label={t('inventory:table.supplier')}
      />
    </Box>
  );
};
