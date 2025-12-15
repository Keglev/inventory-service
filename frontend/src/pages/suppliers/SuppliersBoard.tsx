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
import { useLocation } from 'react-router-dom';
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
  const location = useLocation();
  const { user } = useAuth();

  const { setSelectedId, setSelectedSearchResult, setSearchQuery } = state;

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
  const usingSearch = state.searchQuery.length >= 2;
  const displayRows = usingSearch ? data.searchResults : data.suppliers;
  const displayRowCount = usingSearch ? data.searchResults.length : data.total;

  // Clear selection/search when leaving the suppliers route to avoid sticky UI state
  React.useEffect(() => {
    if (!location.pathname.startsWith('/suppliers')) {
      setSelectedId(null);
      setSelectedSearchResult(null);
      setSearchQuery('');
    }
    return () => {
      setSelectedId(null);
      setSelectedSearchResult(null);
      setSearchQuery('');
    };
  }, [location.pathname, setSelectedId, setSelectedSearchResult, setSearchQuery]);

  // If the route is no longer /suppliers, render nothing so other pages can take over
  if (!location.pathname.startsWith('/suppliers')) {
    return null;
  }

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
          editEnabled={state.selectedId !== null || Boolean(user?.isDemo)}
          onEditClick={handleEdit}
          deleteEnabled={state.selectedId !== null || Boolean(user?.isDemo)}
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
        {!state.showAllSuppliers && !usingSearch ? (
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
