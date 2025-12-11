/**
 * @file InventoryDialogs.tsx
 * @module pages/inventory/components/InventoryDialogs
 *
 * @summary
 * Dialog components for inventory management operations.
 * Extracted from InventoryBoard for cleaner orchestration.
 *
 * @enterprise
 * - Pure presentation component for dialogs
 * - No internal state, all controlled via props
 * - Single responsibility: render dialog collection
 */

import * as React from 'react';
import { ItemFormDialog } from '../dialogs/ItemFormDialog';
import { EditItemDialog } from '../dialogs/EditItemDialog';
import DeleteItemDialog from '../dialogs/DeleteItemDialog/DeleteItemDialog';
import { QuantityAdjustDialog } from '../dialogs/QuantityAdjustDialog';
import { PriceChangeDialog } from '../dialogs/PriceChangeDialog';
import type { InventoryRow } from '../../../api/inventory/types';

/**
 * Props for InventoryDialogs component.
 * 
 * @interface InventoryDialogsProps
 * @property {boolean} openNew - ItemFormDialog visibility for new item
 * @property {() => void} setOpenNew - Callback to toggle new item dialog
 * @property {boolean} openEditName - EditItemDialog visibility
 * @property {() => void} setOpenEditName - Callback to toggle edit name dialog
 * @property {boolean} openDelete - DeleteItemDialog visibility
 * @property {() => void} setOpenDelete - Callback to toggle delete dialog
 * @property {boolean} openEdit - ItemFormDialog visibility for edit existing
 * @property {() => void} setOpenEdit - Callback to toggle edit item dialog
 * @property {boolean} openAdjust - QuantityAdjustDialog visibility
 * @property {() => void} setOpenAdjust - Callback to toggle adjust quantity dialog
 * @property {boolean} openPrice - PriceChangeDialog visibility
 * @property {() => void} setOpenPrice - Callback to toggle price change dialog
 * @property {InventoryRow | null} selectedRow - Currently selected inventory item
 * @property {() => void} onReload - Callback when dialog mutation completes
 * @property {boolean} isDemo - Whether user is in demo mode (read-only)
 */
interface InventoryDialogsProps {
  openNew: boolean;
  setOpenNew: (open: boolean) => void;
  openEditName: boolean;
  setOpenEditName: (open: boolean) => void;
  openDelete: boolean;
  setOpenDelete: (open: boolean) => void;
  openEdit: boolean;
  setOpenEdit: (open: boolean) => void;
  openAdjust: boolean;
  setOpenAdjust: (open: boolean) => void;
  openPrice: boolean;
  setOpenPrice: (open: boolean) => void;
  selectedRow: InventoryRow | null;
  onReload: () => void;
  isDemo: boolean;
}

/**
 * Inventory dialog collection component.
 * 
 * Renders all 5 inventory management dialogs:
 * - ItemForm (create new item)
 * - EditItemDialog (rename item)
 * - DeleteItemDialog (delete item)
 * - ItemForm (edit existing item)
 * - QuantityAdjustDialog
 * - PriceChangeDialog
 * 
 * @component
 * @param props - Component props
 * @returns JSX element with all dialogs
 * 
 * @example
 * ```tsx
 * <InventoryDialogs
 *   openNew={state.openNew}
 *   setOpenNew={state.setOpenNew}
 *   selectedRow={selectedRow}
 *   onReload={handleReload}
 *   isDemo={isDemo}
 *   {...otherDialogProps}
 * />
 * ```
 */
export const InventoryDialogs: React.FC<InventoryDialogsProps> = ({
  openNew,
  setOpenNew,
  openEditName,
  setOpenEditName,
  openDelete,
  setOpenDelete,
  openEdit,
  setOpenEdit,
  openAdjust,
  setOpenAdjust,
  openPrice,
  setOpenPrice,
  selectedRow,
  onReload,
  isDemo,
}) => {
  return (
    <>
      <ItemFormDialog
        isOpen={openNew}
        onClose={() => setOpenNew(false)}
        onSaved={onReload}
      />

      <EditItemDialog
        open={openEditName}
        onClose={() => setOpenEditName(false)}
        onItemRenamed={onReload}
      />

      <DeleteItemDialog
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        onItemDeleted={onReload}
        readOnly={isDemo}
      />

      {selectedRow && (
        <ItemFormDialog
          isOpen={openEdit}
          initial={{
            id: selectedRow.id,
            name: selectedRow.name,
            code: selectedRow.code ?? '',
            supplierId: selectedRow.supplierId,
            onHand: selectedRow.onHand,
          }}
          onClose={() => setOpenEdit(false)}
          onSaved={onReload}
        />
      )}

      <QuantityAdjustDialog
        open={openAdjust}
        onClose={() => setOpenAdjust(false)}
        onAdjusted={onReload}
        readOnly={isDemo}
      />

      <PriceChangeDialog
        open={openPrice}
        onClose={() => setOpenPrice(false)}
        onPriceChanged={onReload}
        readOnly={isDemo}
      />
    </>
  );
};
