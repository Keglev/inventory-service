/**
 * @file DeleteSupplierDialog.types.ts
 * @module pages/suppliers/dialogs/DeleteSupplierDialog/DeleteSupplierDialog.types
 *
 * @summary
 * Type definitions for DeleteSupplierDialog component.
 *
 * @enterprise
 * - Types live in a sibling file so the component file stays free of large interface blocks
 * - onSupplierDeleted is fired AFTER the backend returns 204; the parent shows the success toast and refreshes the list
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
  /** Demo session: the dialog stays usable, a valid submit sends no request (frontend ADR-0013). */
  readOnly?: boolean;
}
