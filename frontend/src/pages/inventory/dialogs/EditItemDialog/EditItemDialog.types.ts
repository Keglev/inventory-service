/**
 * EditItemDialog type definitions
 * 
 * @module dialogs/EditItemDialog/EditItemDialog.types
 * @description
 * Centralized type definitions for edit item dialog module.
 * Ensures type safety across form, hook, and component boundaries.
 */

/**
 * Props for EditItemDialog component
 */
export interface EditItemDialogProps {
  /** Whether dialog is currently visible */
  open: boolean;
  /** Callback when dialog should close */
  onClose: () => void;
  /** Callback after successful item rename (for parent refresh) */
  onItemRenamed: () => void;
}
