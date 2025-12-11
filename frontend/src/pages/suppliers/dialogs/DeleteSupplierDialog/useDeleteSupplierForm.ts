/**
 * @file useDeleteSupplierForm.ts
 * @module dialogs/DeleteSupplierDialog/useDeleteSupplierForm
 *
 * @summary
 * Hook for supplier deletion workflow logic.
 * Handles search, selection, and deletion submission.
 *
 * @enterprise
 * - Two-step workflow: search → confirm delete
 * - Supplier search with debouncing
 * - Business rule enforcement (admin-only, linked items check)
 * - Server error mapping with intelligent heuristics
 */

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../../hooks/useAuth';
import { deleteSupplier, getSuppliersPage } from '../../../../api/suppliers';
import type { SupplierRow } from '../../../../api/suppliers/types';

/**
 * Hook return type for delete supplier workflow.
 * 
 * @interface UseDeleteSupplierFormReturn
 */
export interface UseDeleteSupplierFormReturn {
  // Search state
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
 * - Supplier search with debouncing
 * - Selection validation
 * - Deletion submission
 * - Error mapping and display
 * - Authorization checks
 *
 * @param onDeleted - Callback when supplier is successfully deleted
 * @returns Workflow state and handlers
 */
export const useDeleteSupplierForm = (
  onDeleted: () => void
): UseDeleteSupplierFormReturn => {
  const { t } = useTranslation(['common', 'suppliers', 'errors']);
  const { user } = useAuth();

  // Search state
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<SupplierRow[]>([]);
  const [searchLoading, setSearchLoading] = React.useState(false);

  // Selection state
  const [selectedSupplier, setSelectedSupplier] = React.useState<SupplierRow | null>(null);

  // Confirmation state
  const [showConfirmation, setShowConfirmation] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  /**
   * Search for suppliers by name.
   * Requires minimum 2 characters, debounces API calls.
   */
  const handleSearchQueryChange = React.useCallback(
    async (query: string) => {
      setSearchQuery(query);

      if (query.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      setSearchLoading(true);
      try {
        const response = await getSuppliersPage({ page: 1, pageSize: 10, q: query });
        setSearchResults(response.items);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    },
    []
  );

  /**
   * Handle supplier selection from search results.
   * Clears search and shows confirmation step.
   */
  const handleSelectSupplier = React.useCallback((supplier: SupplierRow) => {
    setSelectedSupplier(supplier);
    setSearchQuery('');
    setSearchResults([]);
    setError(null);
    setShowConfirmation(true);
  }, []);

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
    setSearchQuery('');
    setSearchResults([]);
    setError(null);
    setShowConfirmation(false);
  }, []);

  return {
    // Search state
    searchQuery,
    setSearchQuery,
    searchResults,
    searchLoading,
    handleSearchQueryChange,

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
