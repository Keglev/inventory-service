/**
 * @file InventoryToolbar.tsx
 * @module pages/inventory/components/InventoryToolbar
 *
 * @summary
 * Action buttons row above the inventory table: Add new item, Edit,
 * Delete, Adjust quantity, Change price.
 *
 * @enterprise
 * - Pure presentation. Each button is a callback; no disabled logic
 *   here. The parent (InventoryBoard) decides which actions are
 *   meaningful given the current selection.
 * - "Edit" opens the rename dialog (openEditName), not the broader
 *   edit form (openEdit) -- intentional, per the rule documented in
 *   useToolbarHandlers: only ADMIN can rename, and the toolbar
 *   surfaces only the rename path. The broader edit dialog is reached
 *   via other entry points.
 * - All five labels carry English fallbacks, consistent with the
 *   CM-APP9 directory-wide policy of cleaning these in a single
 *   refactor pass rather than ad hoc per file.
 */

import * as React from 'react';
import { Stack, Button } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface InventoryToolbarProps {
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
    <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="flex-end">
      <Button variant="contained" onClick={onAddNew}>
        {t('inventory:toolbar.newItem', 'Add new item')}
      </Button>
      <Button onClick={onEdit}>
        {t('inventory:toolbar.edit', 'Edit')}
      </Button>
      <Button onClick={onDelete}>
        {t('inventory:toolbar.delete', 'Delete')}
      </Button>
      <Button onClick={onAdjustQty}>
        {t('inventory:toolbar.adjustQty', 'Adjust quantity')}
      </Button>
      <Button onClick={onChangePrice}>
        {t('inventory:toolbar.changePrice', 'Change price')}
      </Button>
    </Stack>
  );
};
