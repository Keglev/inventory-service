/**
 * @file InventoryToolbar.tsx
 * @module pages/inventory/components/InventoryToolbar
 *
 * @summary
 * Action buttons row above the inventory table: Add new item, Edit,
 * Delete, Adjust quantity, Change price.
 *
 * @enterprise
 * - Pure presentation. Each button is a plain opener callback from the
 *   parent; no action depends on a selection and none is disabled here.
 * - "Edit" opens the rename dialog (openEditName) -- intentional, per
 *   the rule documented in useToolbarHandlers: the name is the only field
 *   without a button of its own. Every other
 *   mutation dialog selects its own target internally.
 */

import * as React from 'react';
import { Stack, Button } from '@mui/material';
import { useTranslation } from 'react-i18next';

export interface InventoryToolbarProps {
  onAddNew: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAdjustQty: () => void;
  onChangePrice: () => void;
}

export const InventoryToolbar: React.FC<InventoryToolbarProps> = ({
  onAddNew,
  onEdit,
  onDelete,
  onAdjustQty,
  onChangePrice,
}) => {
  const { t } = useTranslation(['inventory']);

  return (
    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', justifyContent: 'flex-end' }}>
      <Button variant="contained" onClick={onAddNew}>
        {t('inventory:toolbar.newItem')}
      </Button>
      <Button onClick={onEdit}>
        {t('inventory:toolbar.edit')}
      </Button>
      <Button onClick={onDelete}>
        {t('inventory:toolbar.delete')}
      </Button>
      <Button onClick={onAdjustQty}>
        {t('inventory:toolbar.adjustQty')}
      </Button>
      <Button onClick={onChangePrice}>
        {t('inventory:toolbar.changePrice')}
      </Button>
    </Stack>
  );
};
