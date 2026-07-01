/**
 * @file InventoryDialogs.tsx
 * @module pages/inventory/components/InventoryDialogs
 *
 * @summary
 * Collection of inventory mutation dialogs (create, rename, delete,
 * quantity-adjust, price-change), all controlled by visibility flags and
 * a single shared onReload callback.
 *
 * @enterprise
 * - Stateless dialog host. Every flag is provided by the parent
 *   (InventoryBoard via useInventoryState), so this file carries no
 *   useState/useEffect.
 * - Each mutation dialog selects its own target internally (supplier ->
 *   product), so the host passes no selected-row data. The board's row
 *   selection drives grid highlighting only, not the dialogs.
 * - onReload is the single refresh path used by all five dialogs. It
 *   wires to useRefreshHandler in the parent, which re-runs the current
 *   inventory query directly via the data hook's reload rather than
 *   resetting paginationModel, so refresh works on page 0 as well as
 *   any other page.
 * - isDemo flows through to readOnly on the three dialogs that support
 *   it (delete, quantity-adjust, price-change). Rename does not
 *   currently honor demo mode -- the dialog props omit readOnly.
 */

import * as React from 'react';
import { ItemFormDialog } from '../dialogs/ItemFormDialog';
import { EditItemDialog } from '../dialogs/EditItemDialog';
import DeleteItemDialog from '../dialogs/DeleteItemDialog/DeleteItemDialog';
import { QuantityAdjustDialog } from '../dialogs/QuantityAdjustDialog';
import { PriceChangeDialog } from '../dialogs/PriceChangeDialog';

interface InventoryDialogsProps {
  openNew: boolean;
  setOpenNew: (open: boolean) => void;
  openEditName: boolean;
  setOpenEditName: (open: boolean) => void;
  openDelete: boolean;
  setOpenDelete: (open: boolean) => void;
  openAdjust: boolean;
  setOpenAdjust: (open: boolean) => void;
  openPrice: boolean;
  setOpenPrice: (open: boolean) => void;
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
  openAdjust,
  setOpenAdjust,
  openPrice,
  setOpenPrice,
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
