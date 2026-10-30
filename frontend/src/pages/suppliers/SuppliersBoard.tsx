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
 * - The grid pages and sorts in the browser over the full supplier list
 * - Search input is wired to the suppliers query layer; debouncing lives in the api/suppliers query layer, not here
 * - Row selection via click, with dialog management
 * - All dialogs (Create, Edit, Delete) managed here
 * - Full TypeScript type safety, no implicit any types
 * - i18n discipline: translations in 'common' and 'suppliers' namespaces
 */

import * as React from 'react';
import { Box } from '@mui/material';
import { useAuth } from '../../hooks/useAuth';
import type { SupplierRow } from '../../api/suppliers/types';

import { useSuppliersBoardState } from './hooks/useSuppliersBoardState';
import { useToolbarHandlers } from './handlers/useToolbarHandlers';
import { useSearchHandlers } from './handlers/useSearchHandlers';
import { useDialogHandlers } from './handlers/useDialogHandlers';
import { useSuppliersBoardData } from './hooks/useSuppliersBoardData';
import { SuppliersToolbar } from './components/SuppliersToolbar';
import { SuppliersSearchPanel } from './components/SuppliersSearchPanel';
import { SuppliersTable } from './components/SuppliersTable';
import { SuppliersDialogs } from './components/SuppliersDialogs';
import { railGutter } from '../../theme/pagePanel';
import { PagePanel } from '../../components/ui/PagePanel';

/**
 * Suppliers Management Board - main page orchestrator.
 *
 * Responsibilities:
 * - Compose state hook (useSuppliersBoardState) for all UI state management
 * - Compose data hook (useSuppliersBoardData) for data fetching and processing
 * - Render UI components (Toolbar, SearchPanel, Table, Dialogs)
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
  const { handleSupplierCreated, handleSupplierUpdated, handleSupplierDeleted } =
    useDialogHandlers(state);

  // =====================
  // Data Fetching & Processing
  // =====================
  const data = useSuppliersBoardData(state.searchQuery);
  const selectedResult = state.selectedSearchResult;

  // The grid shows every supplier and pages them; a supplier picked from the
  // search dropdown narrows it to that one row. The former "show all" card that
  // hid the grid by default is gone (S2-15): the list loads with the page anyway.
  const displayRows = selectedResult ? [selectedResult] : data.suppliers;

  const { setOpenCreate, setOpenEdit, setOpenDelete } = state;
  const handleCloseCreate = React.useCallback(() => setOpenCreate(false), [setOpenCreate]);
  const handleCloseEdit = React.useCallback(() => setOpenEdit(false), [setOpenEdit]);
  const handleCloseDelete = React.useCallback(() => setOpenDelete(false), [setOpenDelete]);

  // =====================
  // Render
  // =====================
  return (
    <PagePanel
      overlays={
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
      }
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
      <Box sx={{ px: 2, pl: railGutter, pr: railGutter }}>
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

      {/* Suppliers Table */}
      <Box sx={{ px: 2, pl: railGutter, pr: railGutter, mb: 2, flex: 1, minHeight: 0 }}>
        <SuppliersTable
          rows={displayRows}
          paginationModel={state.paginationModel}
          onPaginationChange={state.setPaginationModel}
          sortModel={state.sortModel}
          onSortChange={state.setSortModel}
          isLoading={data.isLoadingSuppliers}
          onRowClick={state.setSelectedId}
        />
      </Box>
    </PagePanel>
  );
};

export default SuppliersBoard;
