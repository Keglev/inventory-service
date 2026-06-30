/**
 * @file InventoryDialogs.tsx
 * @module pages/inventory/components/InventoryDialogs
 *
 * @summary
 * Collection of inventory mutation dialogs (create, rename, delete,
 * edit, quantity-adjust, price-change), all controlled by visibility
 * flags and a single shared onReload callback.
 *
 * @enterprise
 * - Stateless dialog host. Every flag and selection is provided by
 *   the parent (InventoryBoard via useInventoryState), so this file
 *   carries no useState/useEffect.
 * - Renders TWO <ItemFormDialog> instances: one for create (openNew),
 *   one for edit (openEdit, gated on selectedRow). The component
 *   itself supports both modes via the `initial` prop, so mounting
 *   two instances is redundant. Tracked under CB-APP64 -- collapse to
 *   one instance with mode keyed off `initial` in the refactor phase.
 * - onReload is the single refresh path used by all six dialogs. It
 *   wires to useRefreshHandler in the parent, which triggers a refetch
 *   by resetting paginationModel -- and is a no-op when the user is
 *   already on page 0 (CB-APP46). Every successful inventory mutation
 *   currently exhibits this silent-no-refresh edge case on page 0.
 * - isDemo flows through to readOnly on the three dialogs that
 *   support it (delete, quantity-adjust, price-change). Edit and
 *   rename do not currently honor demo mode -- the dialog props
 *   omit readOnly.
 */

import * as React from 'react';
import { ItemFormDialog } from '../dialogs/ItemFormDialog';
import { EditItemDialog } from '../dialogs/EditItemDialog';
import DeleteItemDialog from '../dialogs/DeleteItemDialog/DeleteItemDialog';
import { QuantityAdjustDialog } from '../dialogs/QuantityAdjustDialog';
import { PriceChangeDialog } from '../dialogs/PriceChangeDialog';
import type { InventoryRow } from '../../../api/inventory/types';

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

      {/* BUCKET: CB-APP64 -- two ItemFormDialog instances (create + edit). Collapse to one instance keyed off `initial` prop in refactor. */}
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
