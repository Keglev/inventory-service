/**
 * @file DeleteItemDialog.types.ts
 * @module pages/inventory/dialogs/DeleteItemDialog/DeleteItemDialog.types
 *
 * @summary
 * Shared type surface for the DeleteItemDialog feature module. Centralizes
 * the content props and the orchestrator-hook return shape.
 *
 * @enterprise
 * - UseDeleteItemDialogReturn is the contract every view and field
 *   component consumes. Specialized sub-hooks (state, queries, handlers)
 *   flow up into this single shape so callers do not thread three objects.
 * - Query types are derived via ReturnType<typeof useSuppliersQuery>
 *   rather than re-declared, so a backend or hook signature change
 *   propagates here automatically.
 */

import type { SupplierOption, ItemOption } from '../../../../api/analytics/types';
import type { useSuppliersQuery } from '../../../../api/inventory/hooks/useSuppliersQuery';
import type { useItemSearchQuery } from '../../../../api/inventory/hooks/useItemSearchQuery';
import type { useItemDetailsQuery } from '../../../../api/inventory/hooks/useItemDetailsQuery';

export interface DeleteItemContentProps {
  state: UseDeleteItemDialogReturn; // All state from hook
  showConfirmation: boolean; // Route between form and confirmation views
}

export interface UseDeleteItemDialogReturn {
  // Selection state
  selectedSupplier: SupplierOption | null;
  selectedItem: ItemOption | null;
  itemQuery: string;

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

  // Handlers
  handleClose: () => void; // Close and reset all
  handleCancelConfirmation: () => void; // Back to form
  onSubmit: () => void; // Validate and show confirmation
  onConfirmedDelete: () => Promise<void>; // Execute deletion
}
