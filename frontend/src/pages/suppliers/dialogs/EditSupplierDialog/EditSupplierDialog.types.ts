/**
 * @file EditSupplierDialog.types.ts
 * @module dialogs/EditSupplierDialog/EditSupplierDialog.types
 *
 * @summary
 * Type definitions for EditSupplierDialog component.
 * Defines props interfaces and related types.
 *
 * @enterprise
 * - Types live in a sibling file so the component file stays free of large interface blocks
 * - onSupplierUpdated is fired AFTER the backend returns 200; parent uses it for cache invalidation + toast
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
