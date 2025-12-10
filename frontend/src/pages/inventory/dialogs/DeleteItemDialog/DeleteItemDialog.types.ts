/**
 * @file DeleteItemDialog.types.ts
 * @description
 * Type definitions for DeleteItemDialog component and hook.
 * Centralizes all interfaces and types to keep other files focused.
 */

import type { SupplierOption, ItemOption } from '../../../../api/analytics/types';
import type {
  useSuppliersQuery,
  useItemSearchQuery,
  useItemDetailsQuery,
} from '../../../../api/inventory/hooks/useInventoryData';

/**
 * Props for DeleteItemDialog component
 * Controls visibility and callbacks for the dialog lifecycle
 */
export interface DeleteItemDialogProps {
  /** Whether dialog is open */
  open: boolean;
  /** Called when user closes dialog */
  onClose: () => void;
  /** Called after successful item deletion to refresh parent data */
  onItemDeleted: () => void;
  /** Demo mode: allows flow but prevents actual deletion */
  readOnly?: boolean;
}

/**
 * Props for DeleteItemContent component
 * Provides all state and handlers needed for form rendering
 */
export interface DeleteItemContentProps {
  /** All state and handlers from useDeleteItemDialog hook */
  state: UseDeleteItemDialogReturn;
  /** Whether to show confirmation view instead of form */
  showConfirmation: boolean;
}

/**
 * Return type for useDeleteItemDialog hook
 * Aggregates state, queries, and handlers for complete dialog functionality
 */
export interface UseDeleteItemDialogReturn {
  // ============================================
  // Selection State
  // ============================================
  /** Currently selected supplier for filtering items */
  selectedSupplier: SupplierOption | null;
  /** Currently selected item for deletion */
  selectedItem: ItemOption | null;
  /** Search query for item autocomplete */
  itemQuery: string;
  /** Deletion reason selected from dropdown */
  deletionReason: string;

  // ============================================
  // Dialog State
  // ============================================
  /** Error message to display to user */
  formError: string;
  /** Whether confirmation dialog is shown */
  showConfirmation: boolean;
  /** Whether form is currently submitting */
  isSubmitting: boolean;

  // ============================================
  // Data Queries (from React Query)
  // ============================================
  /** Query state for supplier list */
  suppliersQuery: ReturnType<typeof useSuppliersQuery>;
  /** Query state for filtered items */
  itemsQuery: ReturnType<typeof useItemSearchQuery>;
  /** Query state for selected item details */
  itemDetailsQuery: ReturnType<typeof useItemDetailsQuery>;

  // ============================================
  // State Setters
  // ============================================
  setSelectedSupplier: (supplier: SupplierOption | null) => void;
  setSelectedItem: (item: ItemOption | null) => void;
  setItemQuery: (query: string) => void;
  setFormError: (error: string) => void;
  setShowConfirmation: (show: boolean) => void;
  setDeletionReason: (reason: string) => void;

  // ============================================
  // Event Handlers
  // ============================================
  /** Close dialog and reset all state */
  handleClose: () => void;
  /** Cancel confirmation and return to form */
  handleCancelConfirmation: () => void;
  /** Submit form to show confirmation */
  onSubmit: () => void;
  /** Confirmed deletion - call backend API */
  onConfirmedDelete: () => Promise<void>;
}
