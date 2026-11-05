/**
 * @file CreateSupplierDialog.types.ts
 * @module pages/suppliers/dialogs/CreateSupplierDialog/CreateSupplierDialog.types
 *
 * @summary
 * Type definitions for CreateSupplierDialog component.
 *
 * @enterprise
 * - Kept apart from the component, so the props contract has one home.
 */

/** Props for CreateSupplierDialog component. */
export interface CreateSupplierDialogProps {
  /** Whether the dialog is visible. */
  open: boolean;
  /** Called when the user cancels or after a successful save. */
  onClose: () => void;
  /**
   * Called after a successful save.
   * Parent typically reloads the list and shows a toast.
   */
  onCreated: () => void;
}
