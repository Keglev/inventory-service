/**
 * @file SuppliersDialogs.tsx
 * @module pages/suppliers/components/SuppliersDialogs
 *
 * @summary
 * Dialog container for the suppliers board: the Create, Edit and Delete dialogs.
 *
 * @enterprise
 * - Pure composition: the logic lives in the dialogs, so the board stays an orchestrator.
 * - isDemo reaches all three dialogs as readOnly (frontend ADR-0013).
 */

import * as React from 'react';
import { CreateSupplierDialog } from '../dialogs/CreateSupplierDialog/CreateSupplierDialog';
import { EditSupplierDialog } from '../dialogs/EditSupplierDialog/EditSupplierDialog';
import { DeleteSupplierDialog } from '../dialogs/DeleteSupplierDialog/DeleteSupplierDialog';

/**
 * Suppliers Dialogs component props.
 *
 * @interface SuppliersDialogsProps
 */
export interface SuppliersDialogsProps {
  // Create dialog
  openCreate: boolean;
  onCloseCreate: () => void;
  onCreated: () => void;

  // Edit dialog
  openEdit: boolean;
  onCloseEdit: () => void;
  onUpdated: () => void;

  // Delete dialog
  openDelete: boolean;
  onCloseDelete: () => void;
  onDeleted: () => void;

  /** Demo session: every dialog stays usable and sends no write */
  isDemo: boolean;
}

/**
 * Dialogs container for suppliers board.
 *
 * Renders:
 * - Create Supplier Dialog
 * - Edit Supplier Dialog
 * - Delete Supplier Dialog
 *
 * @component
 * @example
 * ```tsx
 * <SuppliersDialogs
 *   openCreate={createOpen}
 *   onCloseCreate={closeCreate}
 *   onCreated={handleCreated}
 *   openEdit={editOpen}
 *   onCloseEdit={closeEdit}
 *   onUpdated={handleUpdated}
 *   openDelete={deleteOpen}
 *   onCloseDelete={closeDelete}
 *   onDeleted={handleDeleted}
 *   isDemo={isDemo}
 * />
 * ```
 */
export const SuppliersDialogs: React.FC<SuppliersDialogsProps> = ({
  openCreate,
  onCloseCreate,
  onCreated,
  openEdit,
  onCloseEdit,
  onUpdated,
  openDelete,
  onCloseDelete,
  onDeleted,
  isDemo,
}) => {
  return (
    <>
      <CreateSupplierDialog
        open={openCreate}
        onClose={onCloseCreate}
        onCreated={onCreated}
        readOnly={isDemo}
      />

      <EditSupplierDialog
        open={openEdit}
        onClose={onCloseEdit}
        onSupplierUpdated={onUpdated}
        readOnly={isDemo}
      />

      <DeleteSupplierDialog
        open={openDelete}
        onClose={onCloseDelete}
        onSupplierDeleted={onDeleted}
        readOnly={isDemo}
      />
    </>
  );
};
