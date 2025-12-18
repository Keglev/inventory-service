/**
 * @file useDialogHandlers.ts
 * @module pages/suppliers/handlers/useDialogHandlers
 *
 * @summary
 * Custom hook that provides dialog event handlers for SuppliersBoard.
 * Manages: Create, Edit, Delete dialog callbacks with toast notifications and cache invalidation.
 *
 * @enterprise
 * - Separation of concerns: handler logic isolated from component
 * - Centralized CRUD operation callbacks
 * - Toast notifications for user feedback
 * - React Query cache invalidation
 */

import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../../context/toast';
import type { UseSuppliersBoardStateReturn } from '../hooks/useSuppliersBoardState';

/**
 * Hook providing dialog operation callbacks.
 *
 * @param state - Suppliers board state object from useSuppliersBoardState
 * @returns Object with handler functions for dialog operations
 *
 * @example
 * ```tsx
 * const { handleSupplierCreated, handleSupplierUpdated, handleSupplierDeleted } = useDialogHandlers(state);
 * ```
 */
export function useDialogHandlers(state: UseSuppliersBoardStateReturn) {
  const { t } = useTranslation(['suppliers']);
  const toast = useToast();
  const queryClient = useQueryClient();

  const handleSupplierCreated = useCallback(() => {
    toast(t('suppliers:status.created', 'Supplier created successfully'), 'success');
    queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    state.setOpenCreate(false);
  }, [state.setOpenCreate, toast, t, queryClient]);

  const handleSupplierUpdated = useCallback(() => {
    toast(t('suppliers:status.updated', 'Supplier updated successfully'), 'success');
    queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    state.setOpenEdit(false);
    state.setSelectedId(null);
  }, [state.setOpenEdit, state.setSelectedId, toast, t, queryClient]);

  const handleSupplierDeleted = useCallback(() => {
    toast(t('suppliers:status.deleted', 'Supplier deleted successfully'), 'success');
    queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    state.setOpenDelete(false);
    state.setSelectedId(null);
  }, [state.setOpenDelete, state.setSelectedId, toast, t, queryClient]);

  return {
    handleSupplierCreated,
    handleSupplierUpdated,
    handleSupplierDeleted,
  };
}
