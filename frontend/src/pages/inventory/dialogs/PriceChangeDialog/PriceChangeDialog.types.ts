/**
 * @file PriceChangeDialog.types.ts
 * @module pages/inventory/dialogs/PriceChangeDialog/PriceChangeDialog.types
 *
 * @summary
 * Props type for the PriceChangeDialog component.
 *
 * @enterprise
 * - readOnly enables demo mode: form is interactive but submission is
 *   short-circuited inside usePriceChangeForm.onSubmit.
 * - onPriceChanged is a refresh signal, not a value-carrying callback;
 *   the parent reloads its inventory data on success.
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
