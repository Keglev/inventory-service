/**
 * @file DeleteSupplierSearchResults.tsx
 * @module dialogs/DeleteSupplierDialog/DeleteSupplierSearchResults
 *
 * @summary
 * Search results list component.
 * Displays supplier search results in interactive list.
 *
 * @enterprise
 * - Pure presentation component
 * - Interactive selection with hover effects
 * - Displays supplier name and contact name
 */

import * as React from 'react';
import { Paper, Stack, Box, Typography } from '@mui/material';
import type { SupplierRow } from '../../../../api/suppliers/types';

/**
 * Props for DeleteSupplierSearchResults component.
 *
 * @interface DeleteSupplierSearchResultsProps
 */
interface DeleteSupplierSearchResultsProps {
  /** List of suppliers to display */
  suppliers: SupplierRow[];
  /** Called when user clicks on a supplier */
  onSelectSupplier: (supplier: SupplierRow) => void;
}

/**
 * Search results list for supplier deletion.
 *
 * Displays suppliers in interactive list with hover effects.
 * Each item shows supplier name and contact name.
 *
 * @component
 * @param props - Component props
 * @returns JSX element with results list, or null if no results
 *
 * @example
 * ```tsx
 * <DeleteSupplierSearchResults
 *   suppliers={results}
 *   onSelectSupplier={handleSelect}
 * />
 * ```
 */
export const DeleteSupplierSearchResults: React.FC<DeleteSupplierSearchResultsProps> = ({
  suppliers,
  onSelectSupplier,
}) => {
  if (suppliers.length === 0) {
    return null;
  }

  return (
    <Paper
      variant="outlined"
      sx={{
        maxHeight: 300,
        overflow: 'auto',
        backgroundColor: '#fafafa',
      }}
    >
      <Stack spacing={0}>
        {suppliers.map((supplier) => (
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
  );
};
