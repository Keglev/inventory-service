/**
 * @file DeleteSupplierDialog.types.ts
 * @module dialogs/DeleteSupplierDialog/DeleteSupplierDialog.types
 *
 * @summary
 * Type definitions for DeleteSupplierDialog component.
 * Defines props interface and related types.
 */

/**
 * Props for DeleteSupplierDialog component.
 *
 * @interface DeleteSupplierDialogProps
 */
export interface DeleteSupplierDialogProps {
  /** Whether dialog is open */
  open: boolean;
  /** Called when dialog is closed (cancel or completion) */
  onClose: () => void;
  /** Called after successful deletion to reload supplier list */
  onSupplierDeleted: () => void;
}
