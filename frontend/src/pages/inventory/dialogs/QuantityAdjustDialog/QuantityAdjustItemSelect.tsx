/**
 * @file QuantityAdjustItemSelect.tsx
 * @module pages/inventory/dialogs/QuantityAdjustDialog/QuantityAdjustItemSelect
 *
 * @summary
 * Step 2 of the quantity-adjust form: the shared item picker
 * (ItemSearchField), gated by a selected supplier.
 *
 * @enterprise
 * - A standalone component, not part of a multi-field file: more files,
 *   but each step has its own unit tests.
 * - Disabled when no supplier is selected, with a placeholder hint that
 *   tells the user why. Matching (name or SKU, two characters) happens
 *   upstream in useItemSearchQuery; this component only shows it.
 */

import * as React from 'react';
import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { ItemOption, SupplierOption } from '../../../../api/analytics/types';
import { ItemSearchField } from '../../components/ItemSearchField';

export interface QuantityAdjustItemSelectProps {
  selectedItem: ItemOption | null;
  onItemChange: (item: ItemOption | null) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  items: ItemOption[] | undefined;
  loading: boolean;
  selectedSupplier: SupplierOption | null;
}

export const QuantityAdjustItemSelect: React.FC<QuantityAdjustItemSelectProps> = ({
  selectedItem,
  onItemChange,
  searchQuery,
  onSearchChange,
  items,
  loading,
  selectedSupplier,
}) => {
  const { t } = useTranslation(['common', 'inventory']);

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom color="primary">
        {t('inventory:steps.selectItem')}
      </Typography>

      <ItemSearchField
        query={searchQuery}
        onQueryChange={onSearchChange}
        results={items ?? []}
        loading={loading}
        value={selectedItem}
        onSelect={onItemChange}
        disabled={!selectedSupplier}
      />
    </Box>
  );
};
