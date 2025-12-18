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
import type { SupplierRow } from '../../../api/suppliers';

/**
 * Complete suppliers board page state interface.
 *
 * @interface SuppliersBoardState
 */
export interface SuppliersBoardState {
  // Search & Filter
  searchQuery: string;
  showAllSuppliers: boolean;

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
  setShowAllSuppliers: (show: boolean) => void;
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
  const renderCount = React.useRef(0);
  renderCount.current++;
  if (renderCount.current > 100) {
    console.error('[SUPPLIERS STATE] INFINITE RENDER DETECTED - over 100 renders!');
  }
  
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showAllSuppliers, setShowAllSuppliers] = React.useState(false);
  const [paginationModel, setPaginationModel] = React.useState<GridPaginationModel>({
    page: 0,
    pageSize: 6,
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
    showAllSuppliers,
    paginationModel,
    sortModel,
    selectedId,
    selectedSearchResult,
    openCreate,
    openEdit,
    openDelete,
    setSearchQuery,
    setShowAllSuppliers,
    setPaginationModel,
    setSortModel,
    setSelectedId,
    setSelectedSearchResult,
    setOpenCreate,
    setOpenEdit,
    setOpenDelete,
  };

  console.log(`[SUPPLIERS STATE RENDER #${renderCount.current}] paginationModel:`, paginationModel);
  
  return stateObject;
};
