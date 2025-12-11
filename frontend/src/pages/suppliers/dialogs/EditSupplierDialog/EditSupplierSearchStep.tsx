/**
 * @file EditSupplierSearchStep.tsx
 * @module dialogs/EditSupplierDialog/EditSupplierSearchStep
 *
 * @summary
 * Step 1 component for supplier search and selection.
 * Displays search input and interactive results.
 *
 * @enterprise
 * - Pure presentation component
 * - Search with debouncing
 * - Interactive supplier selection list
 */

import * as React from 'react';
import {
  Box,
  TextField,
  CircularProgress,
  Typography,
  Paper,
  List,
  ListItemButton,
  ListItemText,
  Alert,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { SupplierRow } from '../../../../api/suppliers/types';

/**
 * Props for EditSupplierSearchStep component.
 *
 * @interface EditSupplierSearchStepProps
 */
interface EditSupplierSearchStepProps {
  /** Current search query */
  searchQuery: string;
  /** Called when search query changes */
  onSearchQueryChange: (query: string) => Promise<void>;
  /** Search results to display */
  searchResults: SupplierRow[];
  /** Whether search is loading */
  searchLoading: boolean;
  /** Called when supplier is selected */
  onSelectSupplier: (supplier: SupplierRow) => void;
}

/**
 * Step 1: Search and select supplier.
 *
 * Allows user to search for and select a supplier to edit.
 * Displays autocomplete results with supplier details.
 *
 * @component
 * @param props - Component props
 * @returns JSX element with search form
 *
 * @example
 * ```tsx
 * <EditSupplierSearchStep
 *   searchQuery={query}
 *   onSearchQueryChange={handleSearch}
 *   searchResults={results}
 *   searchLoading={loading}
 *   onSelectSupplier={handleSelect}
 * />
 * ```
 */
export const EditSupplierSearchStep: React.FC<EditSupplierSearchStepProps> = ({
  searchQuery,
  onSearchQueryChange,
  searchResults,
  searchLoading,
  onSelectSupplier,
}) => {
  const { t } = useTranslation(['suppliers', 'common']);

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
        {t('suppliers:steps.selectSupplier', 'Step 1: Search and Select Supplier')}
      </Typography>

      <Box sx={{ position: 'relative', mb: 2 }}>
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
        />

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
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
                  onClick={() => onSelectSupplier(supplier)}
                >
                  <ListItemText
                    primary={supplier.name}
                    secondary={supplier.email || supplier.phone || supplier.contactName}
                  />
                </ListItemButton>
              ))}
            </List>
          </Paper>
        )}

        {searchQuery.length >= 2 && searchResults.length === 0 && !searchLoading && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            {t('suppliers:search.noResults', 'No suppliers found')}
          </Typography>
        )}
      </Box>

      {searchQuery.length < 2 && searchQuery.length > 0 && (
        <Alert severity="info">
          {t('suppliers:search.typeToSearch', 'Type at least 2 characters to search')}
        </Alert>
      )}
    </Box>
  );
};
