/**
 * @file QuantityAdjustDialog.types.ts
 * @module pages/inventory/dialogs/QuantityAdjustDialog/QuantityAdjustDialog.types
 *
 * @summary
 * Props type for the QuantityAdjustDialog component.
 *
 * @enterprise
 * - readOnly enables demo mode: the user can walk every form step but
 *   the actual mutation is short-circuited inside
 *   useQuantityAdjustForm.onSubmit.
 * - onAdjusted is a refresh signal, not a value-carrying callback.
 */

export interface QuantityAdjustDialogProps {
  /** Controls dialog visibility state */
  open: boolean;
  /** Callback invoked when dialog should be closed */
  onClose: () => void;
  /** Callback invoked after successful quantity adjustment */
  onAdjusted: () => void;
  /**
   * When true, dialog behaves as demo-readonly:
   * user can explore the workflow but cannot commit changes.
   */
  readOnly?: boolean;
}
