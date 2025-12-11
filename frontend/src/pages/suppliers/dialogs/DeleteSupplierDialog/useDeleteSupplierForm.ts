/**
 * @file useDeleteSupplierForm.ts
 * @module dialogs/DeleteSupplierDialog/useDeleteSupplierForm
 *
 * @summary
 * Hook for supplier deletion workflow.
 * Handles selection, confirmation, and deletion submission.
 *
 * @enterprise
 * - Focuses on deletion-specific logic only
 * - Delegates search to useSupplierSearch hook
 * - Business rule enforcement (admin-only, linked items check)
 * - Server error mapping with intelligent heuristics
 */

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../../hooks/useAuth';
import { deleteSupplier } from '../../../../api/suppliers';
import { useSupplierSearch } from './useSupplierSearch';
import type { SupplierRow } from '../../../../api/suppliers/types';

/**
 * Hook return type for delete supplier workflow.
 * 
 * @interface UseDeleteSupplierFormReturn
 */
export interface UseDeleteSupplierFormReturn {
  // Search state (delegated to useSupplierSearch)
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: SupplierRow[];
  searchLoading: boolean;
  handleSearchQueryChange: (query: string) => Promise<void>;

  // Selection state
  selectedSupplier: SupplierRow | null;
  setSelectedSupplier: (supplier: SupplierRow | null) => void;
  handleSelectSupplier: (supplier: SupplierRow) => void;

  // Confirmation state
  showConfirmation: boolean;
  setShowConfirmation: (show: boolean) => void;
  isDeleting: boolean;
  error: string | null;
  setError: (error: string | null) => void;

  // Actions
  handleConfirmDelete: () => Promise<void>;
  resetForm: () => void;
}

/**
 * Hook for supplier deletion workflow.
 *
 * Manages:
 * - Selection and confirmation state
 * - Deletion submission
 * - Error mapping and display
 * - Authorization checks
 *
 * Uses useSupplierSearch for search functionality.
 *
 * @param onDeleted - Callback when supplier is successfully deleted
 * @returns Workflow state and handlers
 */
export const useDeleteSupplierForm = (
  onDeleted: () => void
): UseDeleteSupplierFormReturn => {
  const { t } = useTranslation(['common', 'suppliers', 'errors']);
  const { user } = useAuth();

  // Search functionality
  const search = useSupplierSearch();

  // Selection state
  const [selectedSupplier, setSelectedSupplier] = React.useState<SupplierRow | null>(null);

  // Confirmation state
  const [showConfirmation, setShowConfirmation] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  /**
   * Handle supplier selection from search results.
   * Clears search and shows confirmation step.
   */
  const handleSelectSupplier = React.useCallback((supplier: SupplierRow) => {
    setSelectedSupplier(supplier);
    search.resetSearch();
    setError(null);
    setShowConfirmation(true);
  }, [search]);

  /**
   * Handle delete confirmation and submission.
   * Checks authorization, sends DELETE request, maps errors.
   */
  const handleConfirmDelete = React.useCallback(async () => {
    const mapServerError = (errorMsg?: string | null): string => {
      if (!errorMsg) {
        return t('errors:supplier.requests.failedToDeleteSupplier', 'Failed to delete supplier. Please try again.');
      }

      const msg = errorMsg.toLowerCase();

      // Linked items error (409 Conflict)
      if (
        msg.includes('cannot delete supplier with linked items') ||
        msg.includes('linked items') ||
        msg.includes('cannot delete supplier') ||
        msg.includes('verknüpften') // German: "linked"
      ) {
        return t(
          'errors:supplier.businessRules.cannotDeleteWithItems',
          'This supplier cannot be deleted because there are still items with stock > 0. Please reduce the stock to 0 before deleting the supplier.'
        );
      }

      // Admin-only error (403 Forbidden)
      if (msg.includes('403') || msg.includes('forbidden')) {
        return t('errors:supplier.adminOnly', 'Only administrators can perform this action.');
      }

      // Not found error (404)
      if (msg.includes('404') || msg.includes('not found')) {
        return t('errors:supplier.businessRules.supplierNotFound', 'Supplier not found');
      }

      // Generic error
      return t('errors:supplier.requests.failedToDeleteSupplier', 'Failed to delete supplier. Please try again.');
    };

    if (!selectedSupplier) {
      setError(t('errors:supplier.selection.noSupplierSelected', 'Please select a supplier'));
      return;
    }

    // Check authorization
    if (user?.role !== 'ADMIN') {
      setError(t('errors:supplier.adminOnly', 'Only administrators can perform this action.'));
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const response = await deleteSupplier(selectedSupplier.id);

      if (response.success) {
        // Success: notify parent
        onDeleted();
      } else {
        // Map and display server error
        const errorMessage = mapServerError(response.error);
        setError(errorMessage);
      }
    } catch (err) {
      const errorMessage = mapServerError(err instanceof Error ? err.message : undefined);
      setError(errorMessage);
      console.error('Delete failed:', err);
    } finally {
      setIsDeleting(false);
    }
  }, [selectedSupplier, user?.role, t, onDeleted]);

  /**
   * Reset form to initial state.
   */
  const resetForm = React.useCallback(() => {
    setSelectedSupplier(null);
    search.resetSearch();
    setError(null);
    setShowConfirmation(false);
  }, [search]);

  return {
    // Search state (delegated)
    searchQuery: search.searchQuery,
    setSearchQuery: search.setSearchQuery,
    searchResults: search.searchResults,
    searchLoading: search.searchLoading,
    handleSearchQueryChange: search.handleSearchQueryChange,

    // Selection state
    selectedSupplier,
    setSelectedSupplier,
    handleSelectSupplier,

    // Confirmation state
    showConfirmation,
    setShowConfirmation,
    isDeleting,
    error,
    setError,

    // Actions
    handleConfirmDelete,
    resetForm,
  };
};
