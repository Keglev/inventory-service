/**
 * PriceChangeDialog type definitions
 * 
 * @module dialogs/PriceChangeDialog/PriceChangeDialog.types
 */

/**
 * PriceChangeDialogProps - Main dialog component props
 */
export interface PriceChangeDialogProps {
  /** Whether dialog is visible */
  open: boolean;

  /** Called when dialog should close (cancel or save) */
  onClose: () => void;

  /** Called after successful price change to refresh parent data */
  onPriceChanged: () => void;

  /** Demo mode flag: when true, disables actual API submission */
  readOnly?: boolean;
}
