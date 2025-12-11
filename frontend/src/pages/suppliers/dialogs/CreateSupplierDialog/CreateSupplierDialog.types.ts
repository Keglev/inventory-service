/**
 * @file CreateSupplierDialog.types.ts
 * @module dialogs/CreateSupplierDialog/CreateSupplierDialog.types
 *
 * @summary
 * Type definitions for CreateSupplierDialog component.
 *
 * @enterprise
 * - Centralized type definitions for easy reuse
 * - Clear documentation of props contract
 */

/**
 * Props for CreateSupplierDialog component.
 * 
 * @interface CreateSupplierDialogProps
 * @property {boolean} open - Whether dialog is visible
 * @property {() => void} onClose - Callback when dialog should close
 * @property {() => void} onCreated - Callback after successful creation
 */
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
