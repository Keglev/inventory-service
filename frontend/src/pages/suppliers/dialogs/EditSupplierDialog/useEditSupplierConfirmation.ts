/**
 * @file useEditSupplierConfirmation.ts
 * @module dialogs/EditSupplierDialog/useEditSupplierConfirmation
 *
 * @summary
 * Hook for managing supplier edit confirmation state.
 * Handles confirmation dialog visibility and pending changes.
 *
 * @enterprise
 * - Focused confirmation state management
 * - Reusable for other edit dialogs
 * - Clean API for confirmation flow
 */

import * as React from 'react';
import type { EditSupplierForm } from '../../../../api/suppliers';

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
