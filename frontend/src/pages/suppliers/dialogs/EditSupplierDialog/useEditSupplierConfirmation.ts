/**
 * @file useEditSupplierConfirmation.ts
 * @module pages/suppliers/dialogs/EditSupplierDialog/useEditSupplierConfirmation
 *
 * @summary
 * Hook for the supplier edit confirmation state: dialog visibility and pending changes.
 *
 * @enterprise
 * - Kept apart from useEditSupplierForm, so the confirmation flow has one owner.
 */

import * as React from 'react';
import type { EditSupplierForm } from '../../../../api/suppliers/validation';

/**
 * Hook return type for confirmation state.
 *
 * @interface UseEditSupplierConfirmationReturn
 */
export interface UseEditSupplierConfirmationReturn {
  /** Whether confirmation dialog is open */
  showConfirmation: boolean;
  /** Set confirmation visibility */
  setShowConfirmation: (show: boolean) => void;
  /** Pending changes to apply */
  pendingChanges: EditSupplierForm | null;
  /** Set pending changes */
  setPendingChanges: (changes: EditSupplierForm | null) => void;
  /** Reset to initial state */
  reset: () => void;
}

/**
 * Hook for managing supplier edit confirmation state.
 *
 * Manages:
 * - Confirmation dialog visibility
 * - Pending changes before confirmation
 * - State reset for next workflow
 *
 * @returns Confirmation state and handlers
 *
 * @example
 * ```ts
 * const { showConfirmation, pendingChanges, setShowConfirmation } = useEditSupplierConfirmation();
 * ```
 */
export const useEditSupplierConfirmation = (): UseEditSupplierConfirmationReturn => {
  const [showConfirmation, setShowConfirmation] = React.useState(false);
  const [pendingChanges, setPendingChanges] = React.useState<EditSupplierForm | null>(null);

  const reset = React.useCallback(() => {
    setShowConfirmation(false);
    setPendingChanges(null);
  }, []);

  return {
    showConfirmation,
    setShowConfirmation,
    pendingChanges,
    setPendingChanges,
    reset,
  };
};
