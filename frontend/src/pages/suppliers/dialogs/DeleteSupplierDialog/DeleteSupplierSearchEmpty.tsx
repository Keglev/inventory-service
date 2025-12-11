/**
 * @file DeleteSupplierSearchEmpty.tsx
 * @module dialogs/DeleteSupplierDialog/DeleteSupplierSearchEmpty
 *
 * @summary
 * Empty state message for supplier search.
 * Displays when no suppliers are found.
 *
 * @enterprise
 * - Pure presentation component
 * - Clear messaging for empty search results
 */

import * as React from 'react';
import { Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

/**
 * Props for DeleteSupplierSearchEmpty component.
 *
 * @interface DeleteSupplierSearchEmptyProps
 */
interface DeleteSupplierSearchEmptyProps {
  /** Whether search has been performed (query length >= 2) */
  hasSearched: boolean;
  /** Whether search is currently loading */
  isLoading: boolean;
}

/**
 * Empty state message for supplier search results.
 *
 * Shows "No suppliers found" message when search
 * has been performed but returned no results.
 *
 * @component
 * @param props - Component props
 * @returns JSX element with empty message, or null if no message needed
 *
 * @example
 * ```tsx
 * <DeleteSupplierSearchEmpty
 *   hasSearched={query.length >= 2}
 *   isLoading={loading}
 * />
 * ```
 */
export const DeleteSupplierSearchEmpty: React.FC<DeleteSupplierSearchEmptyProps> = ({
  hasSearched,
  isLoading,
}) => {
  const { t } = useTranslation(['suppliers']);

  if (!hasSearched || isLoading) {
    return null;
  }

  return (
    <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
      {t('suppliers:search.noResults', 'No suppliers found')}
    </Typography>
  );
};
