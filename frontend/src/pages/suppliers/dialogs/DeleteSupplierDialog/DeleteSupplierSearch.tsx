/**
 * @file DeleteSupplierSearch.tsx
 * @module dialogs/DeleteSupplierDialog/DeleteSupplierSearch
 *
 * @summary
 * Search step for supplier deletion dialog.
 * Hint, the shared supplier search field, and Cancel.
 *
 * @enterprise
 * - Uses SupplierSearchField, the search the board and the edit dialog use.
 * - Cancel stays enabled: matching runs in the browser, and leaving the
 *   dialog never needs to wait for the supplier list.
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
  Stack,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { HelpIconButton } from '../../../../features/help/components/HelpIconButton';
import type { SupplierRow } from '../../../../api/suppliers/types';
import { SupplierSearchField } from '../../components/SupplierSearchField';

/**
 * Props for DeleteSupplierSearch component.
 *
 * @interface DeleteSupplierSearchProps
 */
interface DeleteSupplierSearchProps {
  /** Search query value */
  searchQuery: string;
  /** Called when search query changes */
  onSearchQueryChange: (query: string) => void;
  /** Search results to display */
  searchResults: SupplierRow[];
  /** Whether search is loading */
  searchLoading: boolean;
  /** Called when supplier is selected */
  onSelectSupplier: (supplier: SupplierRow) => void;
  /** Called when cancel button is clicked */
  onCancel: () => void;
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
}) => {
  const { t } = useTranslation(['common', 'suppliers']);

  return (
    <>
      <DialogTitle sx={{ pt: 3.5 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>{t('suppliers:dialogs.delete.title')}</Box>
          <HelpIconButton topicId="suppliers.delete" tooltip={t('common:actions.help')} />
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t('suppliers:dialogs.delete.search.hint')}
        </Typography>

        <SupplierSearchField
          query={searchQuery}
          onQueryChange={onSearchQueryChange}
          results={searchResults}
          loading={searchLoading}
          onSelect={onSelectSupplier}
        />
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onCancel}>
          {t('common:actions.cancel')}
        </Button>
      </DialogActions>
    </>
  );
};
