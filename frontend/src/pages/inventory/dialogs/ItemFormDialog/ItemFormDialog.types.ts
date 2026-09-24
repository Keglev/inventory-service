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

  /** Demo mode: the form stays usable, but submission sends nothing */
  readOnly?: boolean;
}
