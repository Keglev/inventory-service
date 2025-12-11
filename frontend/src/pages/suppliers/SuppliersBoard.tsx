/**
 * @file SuppliersBoard.tsx
 * @module pages/suppliers/SuppliersBoard
 *
 * @summary
 * Orchestrator component for the Suppliers Management page.
 * Composes: useSuppliersBoardState hook, useSuppliersBoardData hook, and specialized UI components.
 *
 * @enterprise
 * - Separation of concerns: state (useSuppliersBoardState) + data (useSuppliersBoardData) + UI (components)
 * - Server-side pagination and sorting
 * - Client-side search with debouncing
 * - Row selection via click, with dialog management
 * - All dialogs (Create, Edit, Delete) managed here
 * - Full TypeScript type safety, no implicit any types
 * - i18n discipline: translations in 'common' and 'suppliers' namespaces
 */

import * as React from 'react';
import { Box, Paper } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import type { SupplierRow } from '../../api/suppliers';

import { useToast } from '../../context/toast';
import { useSuppliersBoardState, useSuppliersBoardData } from './hooks';
import {
  SuppliersToolbar,
  SuppliersSearchPanel,
  SuppliersFilterPanel,
  SuppliersTable,
  SuppliersDialogs,
} from './components';

/**
 * Suppliers Management Board - main page orchestrator.
 *
 * Responsibilities:
 * - Compose state hook (useSuppliersBoardState) for all UI state management
 * - Compose data hook (useSuppliersBoardData) for data fetching and processing
 * - Render UI components (Toolbar, SearchPanel, FilterPanel, Table, Dialogs)
 * - Manage row selection and actions
 * - Handle data refresh after dialog operations
 *
 * @component
 * @returns JSX element with complete supplier management interface
 *
 * @example
 * ```tsx
 * export default function SuppliersPage() {
 *   return <SuppliersBoard />;
 * }
 * ```
 */
const SuppliersBoard: React.FC = () => {
  const { t } = useTranslation(['common', 'suppliers']);
  const toast = useToast();
  const queryClient = useQueryClient();

  // =====================
  // State Management
  // =====================
  const state = useSuppliersBoardState();

  // =====================
  // Data Fetching & Processing
  // =====================
  const serverPage = state.paginationModel.page + 1; // Convert 0-based to 1-based
  const serverSort = state.sortModel.length
    ? `${state.sortModel[0].field},${state.sortModel[0].sort ?? 'asc'}`
    : 'name,asc';

  const data = useSuppliersBoardData(
    serverPage,
    state.paginationModel.pageSize,
    serverSort,
    state.searchQuery
  );

  // =====================
  // Event Handlers: Toolbar
  // =====================
  const handleAddNew = () => state.setOpenCreate(true);
  const handleEdit = () => state.setOpenEdit(true);
  const handleDelete = () => state.setOpenDelete(true);

  // =====================
  // Event Handlers: Search
  // =====================
  const handleSearchChange = (query: string) => {
    state.setSearchQuery(query);
  };

  const handleSearchResultSelect = (supplier: SupplierRow) => {
    state.setSelectedSearchResult(supplier);
    state.setSearchQuery('');
  };

  const handleClearSearchSelection = () => {
    state.setSelectedSearchResult(null);
  };

  // =====================
  // Event Handlers: Table
  // =====================
  const handleRowClick = (params: { id: string | number }) => {
    state.setSelectedId(String(params.id));
  };

  // =====================
  // Event Handlers: Filter
  // =====================
  const handleToggleShowAll = (show: boolean) => {
    state.setShowAllSuppliers(show);
  };

  // =====================
  // Event Handlers: Dialog
  // =====================
  const handleSupplierCreated = () => {
    toast(t('suppliers:status.created', 'Supplier created successfully'), 'success');
    queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    state.setOpenCreate(false);
  };

  const handleSupplierUpdated = () => {
    toast(t('suppliers:status.updated', 'Supplier updated successfully'), 'success');
    queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    state.setOpenEdit(false);
    state.setSelectedId(null);
  };

  const handleSupplierDeleted = () => {
    toast(t('suppliers:status.deleted', 'Supplier deleted successfully'), 'success');
    queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    state.setOpenDelete(false);
    state.setSelectedId(null);
  };

  // =====================
  // Render
  // =====================
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 2 }}>
      <Paper
        elevation={0}
        sx={{
          p: 0,
          bgcolor: 'background.paper',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header with Toolbar */}
        <SuppliersToolbar
          onCreateClick={handleAddNew}
          editEnabled={state.selectedId !== null}
          onEditClick={handleEdit}
          deleteEnabled={state.selectedId !== null}
          onDeleteClick={handleDelete}
        />

        {/* Search Panel */}
        <Box sx={{ px: 2 }}>
          <SuppliersSearchPanel
            searchQuery={state.searchQuery}
            onSearchChange={handleSearchChange}
            isLoading={data.isLoadingSearch}
            searchResults={data.searchResults}
            onResultSelect={handleSearchResultSelect}
            selectedSupplier={state.selectedSearchResult as SupplierRow | null}
            onClearSelection={handleClearSearchSelection}
          />
        </Box>

        {/* Filter Panel */}
        <Box sx={{ px: 2 }}>
          <SuppliersFilterPanel
            showAllSuppliers={state.showAllSuppliers}
            onToggleChange={handleToggleShowAll}
          />
        </Box>

        {/* Suppliers Table */}
        {!state.showAllSuppliers ? (
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              height: 420,
              display: 'grid',
              placeItems: 'center',
              mx: 2,
              mb: 2,
            }}
          >
            {/* Empty state */}
          </Paper>
        ) : (
          <Box sx={{ px: 2, mb: 2, flex: 1, minHeight: 0 }}>
            <SuppliersTable
              rows={data.suppliers}
              rowCount={data.total}
              paginationModel={state.paginationModel}
              onPaginationChange={state.setPaginationModel}
              sortModel={state.sortModel}
              onSortChange={state.setSortModel}
              isLoading={data.isLoadingSuppliers}
              onRowClick={handleRowClick}
            />
          </Box>
        )}
      </Paper>

      {/* Dialogs */}
      <SuppliersDialogs
        openCreate={state.openCreate}
        onCloseCreate={() => state.setOpenCreate(false)}
        onCreated={handleSupplierCreated}
        openEdit={state.openEdit}
        onCloseEdit={() => state.setOpenEdit(false)}
        onUpdated={handleSupplierUpdated}
        openDelete={state.openDelete}
        onCloseDelete={() => state.setOpenDelete(false)}
        onDeleted={handleSupplierDeleted}
      />
    </Box>
  );
};

export default SuppliersBoard;
