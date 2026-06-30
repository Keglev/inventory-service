/**
 * @file ItemFormDialog.types.ts
 * @module pages/inventory/dialogs/ItemFormDialog/ItemFormDialog.types
 *
 * @summary
 * Props type for the ItemFormDialog component.
 *
 * @enterprise
 * - initial is the create-vs-edit switch. Omitting it (or passing null
 *   or undefined) puts the dialog in create mode; passing an
 *   InventoryRow puts it in edit mode and pre-fills the form fields.
 * - onSaved is optional and intentionally decoupled from onClose; the
 *   parent decides whether to refresh its data on close, on save, or
 *   on both.
 */

import type { InventoryRow } from '../../../../api/inventory';

/**
 * ItemFormDialogProps - Main dialog component props
 */
export interface ItemFormDialogProps {
  /** Whether dialog is visible */
  isOpen: boolean;

  /** Called when dialog should close (cancel or save) */
  onClose: () => void;

  /** Optional callback after successful save */
  onSaved?: () => void;

  /** Initial item data for edit mode; undefined for create */
  initial?: InventoryRow | null;
}
