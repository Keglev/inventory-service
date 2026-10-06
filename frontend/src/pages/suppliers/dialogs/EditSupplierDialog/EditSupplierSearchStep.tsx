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
 * - Search through the shared SupplierSearchField (matching in the browser)
 */

import * as React from 'react';
import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { SupplierRow } from '../../../../api/suppliers/types';
import { SupplierSearchField } from '../../components/SupplierSearchField';

/**
 * Props for EditSupplierSearchStep component.
 *
 * @interface EditSupplierSearchStepProps
 */
interface EditSupplierSearchStepProps {
  /** Current search query */
  searchQuery: string;
  /** Called when search query changes */
  onSearchQueryChange: (query: string) => void;
  /** Suppliers matching the query */
  searchResults: SupplierRow[];
  /** Whether the supplier list is loading */
  searchLoading: boolean;
  /** Called when supplier is selected */
  onSelectSupplier: (supplier: SupplierRow) => void;
}

/**
 * Step 1: Search and select supplier.
 *
 * Allows user to search for and select a supplier to edit, through the
 * shared SupplierSearchField.
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
  const { t } = useTranslation(['suppliers']);

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
        {t('suppliers:steps.selectSupplier')}
      </Typography>

      <SupplierSearchField
        query={searchQuery}
        onQueryChange={onSearchQueryChange}
        results={searchResults}
        loading={searchLoading}
        onSelect={onSelectSupplier}
      />
    </Box>
  );
};
