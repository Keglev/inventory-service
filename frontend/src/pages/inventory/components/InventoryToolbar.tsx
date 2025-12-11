/**
 * @file InventoryToolbar.tsx
 * @module pages/inventory/components/InventoryToolbar
 *
 * @summary
 * Toolbar component with action buttons for inventory management.
 * Renders: Add New, Edit, Delete, Adjust Quantity, Change Price buttons.
 *
 * @enterprise
 * - Pure presentation component with callback props
 * - No internal state or business logic
 * - Accessible button layout with proper spacing
 */

import * as React from 'react';
import { Stack, Button } from '@mui/material';
import { useTranslation } from 'react-i18next';

/**
 * Props for InventoryToolbar component.
 * 
 * @interface InventoryToolbarProps
 * @property {() => void} onAddNew - Callback when "Add new item" button clicked
 * @property {() => void} onEdit - Callback when "Edit" button clicked
 * @property {() => void} onDelete - Callback when "Delete" button clicked
 * @property {() => void} onAdjustQty - Callback when "Adjust quantity" button clicked
 * @property {() => void} onChangePrice - Callback when "Change price" button clicked
 */
interface InventoryToolbarProps {
  onAddNew: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAdjustQty: () => void;
  onChangePrice: () => void;
}

/**
 * Action buttons toolbar for inventory management.
 * 
 * Renders buttons for:
 * - Add new item (primary variant)
 * - Edit item name
 * - Delete item
 * - Adjust quantity
 * - Change price
 * 
 * @component
 * @param props - Component props
 * @returns JSX element with action buttons
 * 
 * @example
 * ```tsx
 * <InventoryToolbar
 *   onAddNew={() => setOpenNew(true)}
 *   onEdit={() => setOpenEdit(true)}
 *   onDelete={() => setOpenDelete(true)}
 *   onAdjustQty={() => setOpenAdjust(true)}
 *   onChangePrice={() => setOpenPrice(true)}
 * />
 * ```
 */
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
