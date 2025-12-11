/**
 * @file QuantityAdjustDialog.types.ts
 * @module dialogs/QuantityAdjustDialog/QuantityAdjustDialog.types
 *
 * @summary
 * TypeScript type definitions for QuantityAdjustDialog component.
 * Defines the component's public interface and prop contracts.
 */

/**
 * Props for the QuantityAdjustDialog component.
 * 
 * @interface QuantityAdjustDialogProps
 * @property {boolean} open - Controls dialog visibility
 * @property {() => void} onClose - Callback when dialog is closed
 * @property {() => void} onAdjusted - Callback when quantity is successfully adjusted
 * @property {boolean} [readOnly=false] - When true, dialog behaves as demo-readonly
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
