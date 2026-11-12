/**
 * @file EditSupplierDialog.types.ts
 * @module pages/suppliers/dialogs/EditSupplierDialog/EditSupplierDialog.types
 *
 * @summary
 * Type definitions for EditSupplierDialog component.
 *
 * @enterprise
 * - Types live in a sibling file so the component file stays free of large interface blocks
 * - onSupplierUpdated is fired AFTER the backend returns 200; the parent shows the success toast and refreshes the list
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
  /** Demo session: the dialog stays usable, a valid submit sends no request (frontend ADR-0013). */
  readOnly?: boolean;
}
