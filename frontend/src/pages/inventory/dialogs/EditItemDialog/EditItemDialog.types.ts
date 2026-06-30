/**
 * @file EditItemDialog.types.ts
 * @module pages/inventory/dialogs/EditItemDialog/EditItemDialog.types
 *
 * @summary
 * Props type for the EditItemDialog component.
 *
 * @enterprise
 * - Kept as a separate file so the dialog component and any future
 *   sub-hooks share the same prop contract without circular imports.
 * - onItemRenamed is a refresh callback, not a value-carrying signal --
 *   the parent reloads its inventory data instead of relying on the
 *   renamed payload, which keeps this contract independent of the
 *   backend response shape.
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
