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
import { useAuth } from '../../hooks/useAuth';
import type { SupplierRow } from '../../api/suppliers';

import { useSuppliersBoardState } from './hooks';
import {
  useToolbarHandlers,
  useSearchHandlers,
  useTableHandlers,
  useFilterHandlers,
  useDialogHandlers,
  useDataFetchingLogic,
} from './handlers';
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
  // =====================
  // State Management
  // =====================
  const state = useSuppliersBoardState();
  const { user } = useAuth();

  // =====================
  // Event Handlers
  // =====================
  const { handleAddNew, handleEdit, handleDelete } = useToolbarHandlers(state);
  const { handleSearchChange, handleSearchResultSelect, handleClearSearchSelection } =
    useSearchHandlers(state);
  const { handleRowClick, handlePaginationChange, handleSortChange } = useTableHandlers(state);
  const { handleToggleShowAll } = useFilterHandlers(state);
  const { handleSupplierCreated, handleSupplierUpdated, handleSupplierDeleted } =
    useDialogHandlers(state);

  // =====================
  // Data Fetching & Processing
  // =====================
  const data = useDataFetchingLogic(state);
  const hasSelectedFromSearch = state.selectedSearchResult !== null;
  
  // Determine what to display:
  // 1. If user selected a result from search dropdown: show only that selected supplier
  // 2. If showAllSuppliers is true: show paginated suppliers
  // 3. Otherwise: show nothing
  const displayRows = hasSelectedFromSearch 
    ? (state.selectedSearchResult ? [state.selectedSearchResult] : [])
    : (state.showAllSuppliers ? data.suppliers : []);
  const displayRowCount = hasSelectedFromSearch 
    ? (state.selectedSearchResult ? 1 : 0)
    : (state.showAllSuppliers ? data.total : 0);

  const { setOpenCreate, setOpenEdit, setOpenDelete } = state;
  const handleCloseCreate = React.useCallback(() => setOpenCreate(false), [setOpenCreate]);
  const handleCloseEdit = React.useCallback(() => setOpenEdit(false), [setOpenEdit]);
  const handleCloseDelete = React.useCallback(() => setOpenDelete(false), [setOpenDelete]);

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
          editEnabled={state.selectedId !== null || Boolean(user?.isDemo) || user?.role === 'ADMIN'}
          onEditClick={handleEdit}
          deleteEnabled={state.selectedId !== null || Boolean(user?.isDemo) || user?.role === 'ADMIN'}
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
        {!state.showAllSuppliers && !hasSelectedFromSearch ? (
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              height: 260,
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
              rows={displayRows}
              rowCount={displayRowCount}
              paginationModel={state.paginationModel}
              onPaginationChange={handlePaginationChange}
              sortModel={state.sortModel}
              onSortChange={handleSortChange}
              isLoading={data.isLoadingSuppliers}
              onRowClick={handleRowClick}
            />
          </Box>
        )}
      </Paper>

      {/* Dialogs */}
      {/* Step 3: Testing Dialogs */}
      <SuppliersDialogs
        openCreate={state.openCreate}
        onCloseCreate={handleCloseCreate}
        onCreated={handleSupplierCreated}
        openEdit={state.openEdit}
        onCloseEdit={handleCloseEdit}
        onUpdated={handleSupplierUpdated}
        openDelete={state.openDelete}
        onCloseDelete={handleCloseDelete}
        onDeleted={handleSupplierDeleted}
      />
    </Box>
  );
};

export default SuppliersBoard;
