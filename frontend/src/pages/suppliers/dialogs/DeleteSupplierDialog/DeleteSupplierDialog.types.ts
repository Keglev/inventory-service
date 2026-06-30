/**
 * @file DeleteSupplierDialog.types.ts
 * @module dialogs/DeleteSupplierDialog/DeleteSupplierDialog.types
 *
 * @summary
 * Type definitions for DeleteSupplierDialog component.
 * Defines props interface and related types.
 *
 * @enterprise
 * - Types live in a sibling file so the component file stays free of large interface blocks
 * - onSupplierDeleted is fired AFTER the backend returns 204; parent uses it for cache invalidation + toast
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
