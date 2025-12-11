/**
 * @file DeleteSupplierSearch.tsx
 * @module dialogs/DeleteSupplierDialog/DeleteSupplierSearch
 *
 * @summary
 * Search step for supplier deletion dialog.
 * Orchestrates search input, results, and empty state components.
 *
 * @enterprise
 * - Composes specialized search components
 * - Clean separation of concerns
 * - Pure presentation, no business logic
 */

import * as React from 'react';
import {
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  Stack,
  Tooltip,
} from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useTranslation } from 'react-i18next';
import { DeleteSupplierSearchInput } from './DeleteSupplierSearchInput';
import { DeleteSupplierSearchResults } from './DeleteSupplierSearchResults';
import { DeleteSupplierSearchEmpty } from './DeleteSupplierSearchEmpty';
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
 * Composes search input, results list, and empty state components.
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

  const hasSearched = searchQuery.trim().length >= 2;

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

        <DeleteSupplierSearchInput
          value={searchQuery}
          onChange={onSearchQueryChange}
          isLoading={searchLoading}
        />

        <DeleteSupplierSearchResults
          suppliers={searchResults}
          onSelectSupplier={onSelectSupplier}
        />

        <DeleteSupplierSearchEmpty
          hasSearched={hasSearched}
          isLoading={searchLoading}
        />
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onCancel} disabled={searchLoading}>
          {t('common:actions.cancel', 'Cancel')}
        </Button>
      </DialogActions>
    </>
  );
};
