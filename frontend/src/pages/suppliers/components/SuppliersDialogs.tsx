/**
 * @file SuppliersDialogs.tsx
 * @module pages/suppliers/components/SuppliersDialogs
 *
 * @summary
 * Dialog container component for suppliers board.
 * Renders all supplier-related dialogs (Create, Edit, Delete).
 *
 * @enterprise
 * - Pure presentational component for dialog composition
 * - Centralizes all dialog rendering
 * - Delegates logic to dialog components
 * - Keeps orchestrator clean and focused
 */

import * as React from 'react';
import { CreateSupplierDialog } from '../dialogs/CreateSupplierDialog';
import { EditSupplierDialog } from '../dialogs/EditSupplierDialog';
import { DeleteSupplierDialog } from '../dialogs/DeleteSupplierDialog';

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
}) => {
  return (
    <>
      {/* Create Supplier Dialog */}
      <CreateSupplierDialog
        open={openCreate}
        onClose={onCloseCreate}
        onCreated={onCreated}
      />

      {/* Edit Supplier Dialog */}
      <EditSupplierDialog
        open={openEdit}
        onClose={onCloseEdit}
        onSupplierUpdated={onUpdated}
      />

      {/* Delete Supplier Dialog */}
      <DeleteSupplierDialog
        open={openDelete}
        onClose={onCloseDelete}
        onSupplierDeleted={onDeleted}
      />
    </>
  );
};
