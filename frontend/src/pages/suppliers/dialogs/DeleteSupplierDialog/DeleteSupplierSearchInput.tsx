/**
 * @file DeleteSupplierSearchInput.tsx
 * @module dialogs/DeleteSupplierDialog/DeleteSupplierSearchInput
 *
 * @summary
 * Search input field component.
 * Pure presentation with debounced input handling.
 *
 * @enterprise
 * - Reusable search input component
 * - Shows loading indicator during search
 * - Disabled state during loading
 */

import * as React from 'react';
import { TextField, Box, CircularProgress } from '@mui/material';
import { useTranslation } from 'react-i18next';

/**
 * Props for DeleteSupplierSearchInput component.
 *
 * @interface DeleteSupplierSearchInputProps
 */
interface DeleteSupplierSearchInputProps {
  /** Current search query value */
  value: string;
  /** Called when user types in the input */
  onChange: (query: string) => Promise<void>;
  /** Whether search is loading */
  isLoading: boolean;
}

/**
 * Search input field for supplier deletion.
 *
 * Displays text input with loading indicator.
 * Disabled during loading state.
 *
 * @component
 * @param props - Component props
 * @returns JSX element with search input
 *
 * @example
 * ```tsx
 * <DeleteSupplierSearchInput
 *   value={query}
 *   onChange={handleChange}
 *   isLoading={loading}
 * />
 * ```
 */
export const DeleteSupplierSearchInput: React.FC<DeleteSupplierSearchInputProps> = ({
  value,
  onChange,
  isLoading,
}) => {
  const { t } = useTranslation(['suppliers']);

  return (
    <Box sx={{ mb: 2 }}>
      <TextField
        fullWidth
        size="small"
        placeholder={t('suppliers:search.placeholder', 'Enter supplier name (min 2 chars)...')}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={isLoading}
        InputProps={{
          endAdornment: isLoading ? <CircularProgress size={20} /> : null,
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#fafafa',
          },
        }}
      />
    </Box>
  );
};
