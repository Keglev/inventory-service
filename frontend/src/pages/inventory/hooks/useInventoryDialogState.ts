/**
 * @file useInventoryDialogState.ts
 * @module pages/inventory/hooks/useInventoryDialogState
 *
 * @summary
 * Shared hook for managing common state across inventory dialogs.
 * Handles supplier selection, item selection, and form reset logic.
 *
 * @enterprise
 * - Consistent state management across all inventory operations
 * - Automatic cleanup when suppliers change
 * - Type safety with proper error handling
 * - Reusable across quantity and price dialogs
 */

import * as React from 'react';
import type { ItemRef } from '../../../api/analytics/types';

/**
 * Props for the inventory dialog state hook
 */
export interface UseInventoryDialogStateProps {
  /** Whether the dialog is open */
  open: boolean;
  
  /** Function to close the dialog */
  onClose: () => void;
}

/**
 * Return type for the inventory dialog state hook
 */
export interface UseInventoryDialogStateReturn {
  /** Currently selected supplier */
  selectedSupplier: { id: string; name: string } | null;
  
  /** Function to update selected supplier */
  setSelectedSupplier: (supplier: { id: string; name: string } | null) => void;
  
  /** Currently selected item */
  selectedItem: ItemRef | null;
  
  /** Function to update selected item */
  setSelectedItem: (item: ItemRef | null) => void;
  
  /** Function to reset all dialog state */
  resetDialogState: () => void;
  
  /** Whether step 2 (item selection) should be enabled */
  isStep2Enabled: boolean;
  
  /** Whether step 3 (operation) should be enabled */
  isStep3Enabled: boolean;
}

/**
 * Hook for managing common inventory dialog state.
 * Provides consistent state management patterns across quantity and price dialogs.
 * 
 * @enterprise
 * This hook ensures consistent behavior and state management across all inventory
 * operations while handling edge cases like supplier changes and dialog resets.
 */
export function useInventoryDialogState({
  open,
}: UseInventoryDialogStateProps): UseInventoryDialogStateReturn {
  
  // ================================
  // State Management
  // ================================
  
  /** Currently selected supplier for filtering items */
  const [selectedSupplier, setSelectedSupplier] = React.useState<{ id: string; name: string } | null>(null);
  
  /** Currently selected item for operations */
  const [selectedItem, setSelectedItem] = React.useState<ItemRef | null>(null);
  
  // ================================
  // Reset Logic
  // ================================
  
  /** Reset all dialog state when dialog closes */
  React.useEffect(() => {
    if (!open) {
      setSelectedSupplier(null);
      setSelectedItem(null);
    }
  }, [open]);
  
  /** Reset item selection when supplier changes */
  React.useEffect(() => {
    setSelectedItem(null);
  }, [selectedSupplier?.id]);
  
  /** Function to manually reset all state */
  const resetDialogState = React.useCallback(() => {
    setSelectedSupplier(null);
    setSelectedItem(null);
  }, []);
  
  // ================================
  // Computed States
  // ================================
  
  /** Whether step 2 (item selection) should be enabled */
  const isStep2Enabled = !!selectedSupplier;
  
  /** Whether step 3 (operation) should be enabled */
  const isStep3Enabled = !!selectedSupplier && !!selectedItem;
  
  return {
    selectedSupplier,
    setSelectedSupplier,
    selectedItem,
    setSelectedItem,
    resetDialogState,
    isStep2Enabled,
    isStep3Enabled,
  };
}