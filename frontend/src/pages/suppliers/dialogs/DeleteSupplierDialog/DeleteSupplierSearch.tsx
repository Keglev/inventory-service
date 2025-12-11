/**
 * @file DeleteSupplierSearch.tsx
 * @module dialogs/DeleteSupplierDialog/DeleteSupplierSearch
 *
 * @summary
 * Search step for supplier deletion dialog.
 * Displays search input and search results.
 *
 * @enterprise
 * - Pure presentation component, no business logic
 * - Handles debounced search input
 * - Displays search results with interactive selection
 * - Accessibility: proper labels and ARIA attributes
 */

import * as React from 'react';
import {
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Paper,
  Stack,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useTranslation } from 'react-i18next';
import type { SupplierRow } from '../../../../api/suppliers/types';

/**
 * Props for DeleteSupplierSearch component.
 *
 * @interface DeleteSupplierSearchProps
 */
interface DeleteSupplierSearchProps {
  /** Search query value */
  searchQuery: string;
  /** Called when search query changes */
  onSearchQueryChange: (query: string) => Promise<void>;
  /** Search results to display */
  searchResults: SupplierRow[];
  /** Whether search is loading */
  searchLoading: boolean;
  /** Called when supplier is selected */
  onSelectSupplier: (supplier: SupplierRow) => void;
  /** Called when cancel button is clicked */
  onCancel: () => void;
  /** Called to open help */
  onHelp: () => void;
}

/**
 * Search step for supplier deletion dialog.
 *
 * Allows user to search for and select supplier to delete.
 * Displays search results in interactive list format.
 *
 * @component
 * @param props - Component props
 * @returns JSX element with search form
 *
 * @example
 * ```tsx
 * <DeleteSupplierSearch
 *   searchQuery={query}
 *   onSearchQueryChange={handleSearch}
 *   searchResults={results}
 *   searchLoading={loading}
 *   onSelectSupplier={handleSelect}
 *   onCancel={handleCancel}
 *   onHelp={handleHelp}
 * />
 * ```
 */
export const DeleteSupplierSearch: React.FC<DeleteSupplierSearchProps> = ({
  searchQuery,
  onSearchQueryChange,
  searchResults,
  searchLoading,
  onSelectSupplier,
  onCancel,
  onHelp,
}) => {
  const { t } = useTranslation(['common', 'suppliers']);

  return (
    <>
      <DialogTitle sx={{ pt: 3.5 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>{t('suppliers:dialogs.delete.title', 'Delete Supplier')}</Box>
          <Tooltip title={t('actions.help', 'Help')}>
            <IconButton size="small" onClick={onHelp}>
              <HelpOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t('suppliers:dialogs.delete.search.hint', 'Search for the supplier you want to delete')}
        </Typography>

        {/* Search Input */}
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder={t('suppliers:search.placeholder', 'Enter supplier name (min 2 chars)...')}
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            disabled={searchLoading}
            InputProps={{
              endAdornment: searchLoading ? <CircularProgress size={20} /> : null,
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#fafafa',
              },
            }}
          />
        </Box>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <Paper
            variant="outlined"
            sx={{
              maxHeight: 300,
              overflow: 'auto',
              backgroundColor: '#fafafa',
            }}
          >
            <Stack spacing={0}>
              {searchResults.map((supplier) => (
                <Box
                  key={supplier.id}
                  onClick={() => onSelectSupplier(supplier)}
                  sx={{
                    p: 1.5,
                    cursor: 'pointer',
                    borderBottom: '1px solid #e0e0e0',
                    transition: 'background-color 0.2s',
                    '&:hover': {
                      backgroundColor: '#e3f2fd',
                    },
                    '&:last-child': {
                      borderBottom: 'none',
                    },
                  }}
                >
                  <Typography variant="body2" fontWeight={500}>
                    {supplier.name}
                  </Typography>
                  {supplier.contactName && (
                    <Typography variant="caption" color="text.secondary">
                      {supplier.contactName}
                    </Typography>
                  )}
                </Box>
              ))}
            </Stack>
          </Paper>
        )}

        {searchQuery.trim().length >= 2 && searchResults.length === 0 && !searchLoading && (
          <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
            {t('suppliers:search.noResults', 'No suppliers found')}
          </Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onCancel} disabled={searchLoading}>
          {t('common:actions.cancel', 'Cancel')}
        </Button>
      </DialogActions>
    </>
  );
};
