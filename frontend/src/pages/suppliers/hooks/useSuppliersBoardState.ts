/**
 * @file useSuppliersBoardState.ts
 * @module pages/suppliers/hooks/useSuppliersBoardState
 *
 * @summary
 * Centralized state management for suppliers board page.
 * Manages search, pagination, sorting, dialog toggles, and selection.
 *
 * @enterprise
 * - Single source of truth for UI state
 * - Separated from data fetching and processing logic
 * - Allows components to be pure and testable
 */

import * as React from 'react';
import type { GridPaginationModel, GridSortModel } from '@mui/x-data-grid';
import type { SupplierRow } from '../../../api/suppliers/types';

/**
 * Complete suppliers board page state interface.
 *
 * @interface SuppliersBoardState
 */
export interface SuppliersBoardState {
  // Search & Filter
  searchQuery: string;

  // Pagination & Sorting
  paginationModel: GridPaginationModel;
  sortModel: GridSortModel;

  // Selection
  selectedId: string | null;
  selectedSearchResult: SupplierRow | null;

  // Dialog toggles
  openCreate: boolean;
  openEdit: boolean;
  openDelete: boolean;
}

/**
 * State setter functions.
 */
export interface SuppliersBoardStateSetters {
  setSearchQuery: (query: string) => void;
  setPaginationModel: (model: GridPaginationModel) => void;
  setSortModel: (model: GridSortModel) => void;
  setSelectedId: (id: string | null) => void;
  setSelectedSearchResult: (result: SupplierRow | null) => void;
  setOpenCreate: (open: boolean) => void;
  setOpenEdit: (open: boolean) => void;
  setOpenDelete: (open: boolean) => void;
}

/**
 * Return type of useSuppliersBoardState hook.
 */
export type UseSuppliersBoardStateReturn = SuppliersBoardState & SuppliersBoardStateSetters;

/**
 * Hook for managing suppliers board page state.
 *
 * Returns unified state object and setter functions.
 *
 * @returns State and setter functions
 */
export const useSuppliersBoardState = (): UseSuppliersBoardStateReturn => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [paginationModel, setPaginationModel] = React.useState<GridPaginationModel>({
    page: 0,
    // Ten rows fill a 1920x1080 screen without the former show-all card (S2-15).
    pageSize: 10,
  });
  const [sortModel, setSortModel] = React.useState<GridSortModel>([
    { field: 'name', sort: 'asc' },
  ]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [selectedSearchResult, setSelectedSearchResult] = React.useState<SupplierRow | null>(null);
  const [openCreate, setOpenCreate] = React.useState(false);
  const [openEdit, setOpenEdit] = React.useState(false);
  const [openDelete, setOpenDelete] = React.useState(false);

  const stateObject = {
    searchQuery,
    paginationModel,
    sortModel,
    selectedId,
    selectedSearchResult,
    openCreate,
    openEdit,
    openDelete,
    setSearchQuery,
    setPaginationModel,
    setSortModel,
    setSelectedId,
    setSelectedSearchResult,
    setOpenCreate,
    setOpenEdit,
    setOpenDelete,
  };

  return stateObject;
};
