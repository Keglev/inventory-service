/**
 * @file DeleteItemDialog.types.ts
 * @module pages/inventory/dialogs/DeleteItemDialog/DeleteItemDialog.types
 *
 * @summary
 * Shared type surface for the DeleteItemDialog feature module. Centralizes
 * dialog props, content props, and the orchestrator-hook return shape.
 *
 * @enterprise
 * - UseDeleteItemDialogReturn is the contract every view and field
 *   component consumes. Specialized sub-hooks (state, queries, handlers)
 *   flow up into this single shape so callers do not thread three objects.
 * - Query types are derived via ReturnType<typeof useSuppliersQuery>
 *   rather than re-declared, so a backend or hook signature change
 *   propagates here automatically.
 * - readOnly on DeleteItemDialogProps is the demo-mode flag: the form
 *   flow stays interactive but the final DELETE call is blocked at the
 *   handler.
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
