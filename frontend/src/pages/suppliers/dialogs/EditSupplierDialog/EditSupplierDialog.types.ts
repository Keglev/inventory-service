/**
 * @file EditSupplierDialog.types.ts
 * @module dialogs/EditSupplierDialog/EditSupplierDialog.types
 *
 * @summary
 * Type definitions for EditSupplierDialog component.
 * Defines props interfaces and related types.
 */

/**
 * Props for EditSupplierDialog component.
 *
 * @interface EditSupplierDialogProps
 */
export interface EditSupplierDialogProps {
  /** Whether dialog is open */
  open: boolean;
  /** Called when dialog is closed */
  onClose: () => void;
  /** Called after successful supplier update to reload data */
  onSupplierUpdated: () => void;
}
