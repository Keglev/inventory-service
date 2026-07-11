/**
 * @file SuppliersSearchPanel.tsx
 * @module pages/suppliers/components/SuppliersSearchPanel
 *
 * @summary
 * Search panel component for suppliers board.
 * Handles search input, results dropdown, and selected supplier display.
 *
 * @enterprise
 * - Debounced search input with loading indicator
 * - Interactive dropdown for search results
 * - Selected supplier info display with clear button
 * - Pure presentation component
 * - i18n support
 */

import * as React from 'react';
import {
  Paper,
  Box,
  Typography,
  TextField,
  CircularProgress,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Button,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { SupplierRow } from '../../../api/suppliers/types';

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
 * - Search input with loading indicator
 * - Results dropdown (max 300px height)
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

      {/* Search Input */}
      <Box sx={{ position: 'relative', mb: 2 }}>
        <TextField
          fullWidth
          size="small"
          placeholder={t(
            'suppliers:search.placeholder'
          )}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          disabled={false}
          InputProps={{
            endAdornment: isLoading ? <CircularProgress size={20} /> : null,
          }}
        />

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && !selectedSupplier && (
          <Paper
            elevation={2}
            sx={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              zIndex: 10,
              mt: 0.5,
              maxHeight: 300,
              overflow: 'auto',
            }}
          >
            <List>
              {searchResults.map((supplier) => (
                <ListItemButton
                  key={supplier.id}
                  onClick={() => onResultSelect(supplier)}
                >
                  <ListItemText
                    primary={supplier.name}
                    secondary={
                      supplier.email || supplier.phone || 'No contact info'
                    }
                  />
                </ListItemButton>
              ))}
            </List>
          </Paper>
        )}
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
