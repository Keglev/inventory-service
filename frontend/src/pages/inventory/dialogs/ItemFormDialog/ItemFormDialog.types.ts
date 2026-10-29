/**
 * @file ItemFormDialog.types.ts
 * @module pages/inventory/dialogs/ItemFormDialog/ItemFormDialog.types
 *
 * @summary
 * Props of the item form dialog.
 *
 * @enterprise
 * Kept apart from the component so the dialog's hook and its tests import the
 * contract without importing the component.
 */
export interface ItemFormDialogProps {
  /** Whether dialog is visible */
  isOpen: boolean;

  /** Called when dialog should close (cancel or save) */
  onClose: () => void;

  /** Optional callback after successful save */
  onSaved?: () => void;

  /** Demo mode: the form stays usable, but submission sends nothing */
  readOnly?: boolean;
}
