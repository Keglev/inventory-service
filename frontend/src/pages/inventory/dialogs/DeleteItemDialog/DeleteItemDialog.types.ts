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

export interface DeleteItemContentProps {
  state: UseDeleteItemDialogReturn; // All state from hook
  showConfirmation: boolean; // Route between form and confirmation views
}

export interface UseDeleteItemDialogReturn {
  // Selection state
  selectedSupplier: SupplierOption | null;
  selectedItem: ItemOption | null;
  itemQuery: string;
  deletionReason: string;

  // Dialog state
  formError: string;
  showConfirmation: boolean;
  isSubmitting: boolean;

  // React Query states
  suppliersQuery: ReturnType<typeof useSuppliersQuery>;
  itemsQuery: ReturnType<typeof useItemSearchQuery>;
  itemDetailsQuery: ReturnType<typeof useItemDetailsQuery>;

  // Setters
  setSelectedSupplier: (supplier: SupplierOption | null) => void;
  setSelectedItem: (item: ItemOption | null) => void;
  setItemQuery: (query: string) => void;
  setFormError: (error: string) => void;
  setShowConfirmation: (show: boolean) => void;
  setDeletionReason: (reason: string) => void;

  // Handlers
  handleClose: () => void; // Close and reset all
  handleCancelConfirmation: () => void; // Back to form
  onSubmit: () => void; // Validate and show confirmation
  onConfirmedDelete: () => Promise<void>; // Execute deletion
}
