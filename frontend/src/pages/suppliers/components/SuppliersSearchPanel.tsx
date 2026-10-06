/**
 * @file SuppliersSearchPanel.tsx
 * @module pages/suppliers/components/SuppliersSearchPanel
 *
 * @summary
 * Search panel component for suppliers board.
 * Handles search input, results dropdown, and selected supplier display.
 *
 * @enterprise
 * - The shared SupplierSearchField (matching in the browser, at most six
 *   results plus a count of the rest)
 * - Selected supplier info display with clear button
 * - Pure presentation component
 * - i18n support
 */

import * as React from 'react';
import { Paper, Box, Typography, Stack, Button } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { SupplierRow } from '../../../api/suppliers/types';
import { SupplierSearchField } from './SupplierSearchField';

/**
 * Suppliers Search Panel component props.
 *
 * @interface SuppliersSearchPanelProps
 */
export interface SuppliersSearchPanelProps {
  /** Current search query value */
  searchQuery: string;
  /** Handler for search query changes */
  onSearchChange: (query: string) => void;
  /** Whether search is loading */
  isLoading: boolean;
  /** Search results to display */
  searchResults: SupplierRow[];
  /** Handler for search result selection */
  onResultSelect: (supplier: SupplierRow) => void;
  /** Currently selected supplier */
  selectedSupplier: SupplierRow | null;
  /** Handler to clear selected supplier */
  onClearSelection: () => void;
}

/**
 * Search panel for suppliers board.
 *
 * Features:
 * - Shared supplier search field
 * - Selected supplier info with clear button
 * - Responsive layout
 *
 * @component
 * @example
 * ```tsx
 * <SuppliersSearchPanel
 *   searchQuery={query}
 *   onSearchChange={setQuery}
 *   isLoading={isLoading}
 *   searchResults={results}
 *   onResultSelect={handleSelect}
 *   selectedSupplier={selected}
 *   onClearSelection={handleClear}
 * />
 * ```
 */
export const SuppliersSearchPanel: React.FC<SuppliersSearchPanelProps> = ({
  searchQuery,
  onSearchChange,
  isLoading,
  searchResults,
  onResultSelect,
  selectedSupplier,
  onClearSelection,
}) => {
  const { t } = useTranslation(['common', 'suppliers']);

  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
        {t('suppliers:search.title')}
      </Typography>

      <Box sx={{ mb: 2 }}>
        <SupplierSearchField
          query={searchQuery}
          onQueryChange={onSearchChange}
          results={searchResults}
          loading={isLoading}
          onSelect={onResultSelect}
          suppressResults={selectedSupplier !== null}
        />
      </Box>

      {/* Selected supplier: compact one-line indicator with clear action.
          The former detail card duplicated the table row below. */}
      {selectedSupplier && (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {selectedSupplier.name}
          </Typography>
          <Button size="small" color="error" onClick={onClearSelection}>
            {t('suppliers:actions.clear')}
          </Button>
        </Stack>
      )}
    </Paper>
  );
};
