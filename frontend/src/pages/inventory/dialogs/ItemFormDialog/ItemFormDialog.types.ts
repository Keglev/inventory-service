/**
 * ItemFormDialog type definitions
 * 
 * @module dialogs/ItemFormDialog/ItemFormDialog.types
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
