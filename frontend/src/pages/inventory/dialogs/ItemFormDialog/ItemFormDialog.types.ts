import type { InventoryRow } from '../../../../api/inventory/types';

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
