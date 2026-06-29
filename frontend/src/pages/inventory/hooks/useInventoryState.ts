/**
 * @file useInventoryState.ts
 * @module pages/inventory/hooks/useInventoryState
 *
 * @summary
 * Centralized state bag for the inventory page: filters, DataGrid models,
 * row selection, and six dialog open/close flags, plus their setters.
 *
 * @enterprise
 * - Single useState-bag lets handler hooks receive one state object
 *   instead of threading individual setters. The cost is a wider
 *   re-render surface; the benefit is a stable handler signature across
 *   all five handler modules.
 * - paginationModel uses MUI's 0-based page convention. The 1-based
 *   conversion for the backend happens later in useDataFetchingLogic
 *   (see CB-F).
 * - Defaults are deliberate. Sort 'name,asc' matches the alphabetical
 *   mental model for inventory browse; page size 10 fits one viewport
 *   on standard laptops without vertical scroll.
 * - Six independent dialog flags rather than one discriminated union.
 *   Dialogs may overlap (selection survives across open/close cycles)
 *   and an exclusive-open invariant would not match the UX.
 */

import * as React from 'react';
import type { GridPaginationModel, GridSortModel } from '@mui/x-data-grid';

/**
 * Complete inventory page state interface.
 * 
 * @interface InventoryState
 */
export interface InventoryState {
  // Filters
  q: string;
  supplierId: string | number | null;
  belowMinOnly: boolean;

  // Pagination & Sorting
  paginationModel: GridPaginationModel;
  sortModel: GridSortModel;

  // Selection
  selectedId: string | null;

  // Dialog toggles
  openNew: boolean;
  openEdit: boolean;
  openEditName: boolean;
  openDelete: boolean;
  openAdjust: boolean;
  openPrice: boolean;
}

/**
 * State setter functions.
 */
export interface InventoryStateSetters {
  setQ: (q: string) => void;
  setSupplierId: (id: string | number | null) => void;
  setBelowMinOnly: (below: boolean) => void;
  setPaginationModel: (model: GridPaginationModel) => void;
  setSortModel: (model: GridSortModel) => void;
  setSelectedId: (id: string | null) => void;
  setOpenNew: (open: boolean) => void;
  setOpenEdit: (open: boolean) => void;
  setOpenEditName: (open: boolean) => void;
  setOpenDelete: (open: boolean) => void;
  setOpenAdjust: (open: boolean) => void;
  setOpenPrice: (open: boolean) => void;
}

/**
 * Hook for managing inventory page state.
 * 
 * Returns unified state object and setter functions.
 * 
 * @returns State and setter functions
 */
export const useInventoryState = (): InventoryState & InventoryStateSetters => {
  const [q, setQ] = React.useState('');
  const [supplierId, setSupplierId] = React.useState<string | number | null>(null);
  const [belowMinOnly, setBelowMinOnly] = React.useState(false);
  const [paginationModel, setPaginationModel] = React.useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });
  const [sortModel, setSortModel] = React.useState<GridSortModel>([
    { field: 'name', sort: 'asc' },
  ]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [openNew, setOpenNew] = React.useState(false);
  const [openEdit, setOpenEdit] = React.useState(false);
  const [openEditName, setOpenEditName] = React.useState(false);
  const [openDelete, setOpenDelete] = React.useState(false);
  const [openAdjust, setOpenAdjust] = React.useState(false);
  const [openPrice, setOpenPrice] = React.useState(false);

  return {
    q,
    supplierId,
    belowMinOnly,
    paginationModel,
    sortModel,
    selectedId,
    openNew,
    openEdit,
    openEditName,
    openDelete,
    openAdjust,
    openPrice,
    setQ,
    setSupplierId,
    setBelowMinOnly,
    setPaginationModel,
    setSortModel,
    setSelectedId,
    setOpenNew,
    setOpenEdit,
    setOpenEditName,
    setOpenDelete,
    setOpenAdjust,
    setOpenPrice,
  };
};
