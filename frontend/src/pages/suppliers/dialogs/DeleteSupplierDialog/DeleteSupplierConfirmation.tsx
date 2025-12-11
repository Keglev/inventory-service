/**
 * @file DeleteSupplierConfirmation.tsx
 * @module dialogs/DeleteSupplierDialog/DeleteSupplierConfirmation
 *
 * @summary
 * Confirmation step for supplier deletion dialog.
 * Displays selected supplier details and deletion warning.
 *
 * @enterprise
 * - Pure presentation component, no business logic
 * - Shows supplier details (name, contact, email, phone)
 * - Displays warning message before deletion
 * - Shows loading state during deletion
 * - Displays error messages from backend
 */

import * as React from 'react';
import {
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  Typography,
  Box,
  Paper,
  Stack,
  CircularProgress,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { SupplierRow } from '../../../../api/suppliers/types';

/**
 * Props for DeleteSupplierConfirmation component.
 *
 * @interface DeleteSupplierConfirmationProps
 */
interface DeleteSupplierConfirmationProps {
  /** Supplier to delete */
  supplier: SupplierRow;
  /** Error message from deletion attempt, if any */
  error: string | null;
  /** Whether deletion is in progress */
  isDeleting: boolean;
  /** Called when user confirms deletion */
  onConfirm: () => Promise<void>;
  /** Called when user cancels deletion */
  onCancel: () => void;
}

/**
 * Confirmation step for supplier deletion dialog.
 *
 * Displays supplier details and requires user confirmation
 * before proceeding with deletion.
 *
 * @component
 * @param props - Component props
 * @returns JSX element with confirmation form
 *
 * @example
 * ```tsx
 * <DeleteSupplierConfirmation
 *   supplier={selectedSupplier}
 *   error={error}
 *   isDeleting={isDeleting}
 *   onConfirm={handleDelete}
 *   onCancel={handleCancel}
 * />
 * ```
 */
export const DeleteSupplierConfirmation: React.FC<DeleteSupplierConfirmationProps> = ({
  supplier,
  error,
  isDeleting,
  onConfirm,
  onCancel,
}) => {
  const { t } = useTranslation(['common', 'suppliers', 'errors']);

  return (
    <>
      <DialogTitle sx={{ pt: 3.5 }}>
        {t('suppliers:dialogs.delete.confirmation.title', 'Confirm Deletion')}
      </DialogTitle>

      <DialogContent>
        {/* Warning Alert */}
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2" fontWeight={500}>
            {t(
              'suppliers:dialogs.delete.confirmation.warning',
              'Are you sure do you want to delete this supplier? This cannot be reversed!'
            )}
          </Typography>
        </Alert>

        {/* Selected Supplier Info */}
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            backgroundColor: '#fafafa',
            mb: 2,
            borderColor: '#e0e0e0',
          }}
        >
          <Stack spacing={1}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                {t('suppliers:table.name', 'Supplier Name')}
              </Typography>
              <Typography variant="body2" fontWeight={500}>
                {supplier.name}
              </Typography>
            </Box>

            {supplier.contactName && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  {t('suppliers:table.contactName', 'Contact Name')}
                </Typography>
                <Typography variant="body2">{supplier.contactName}</Typography>
              </Box>
            )}

            {supplier.email && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  {t('suppliers:table.email', 'Email')}
                </Typography>
                <Typography variant="body2">{supplier.email}</Typography>
              </Box>
            )}

            {supplier.phone && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  {t('suppliers:table.phone', 'Phone')}
                </Typography>
                <Typography variant="body2">{supplier.phone}</Typography>
              </Box>
            )}
          </Stack>
        </Paper>

        {/* Error Message */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="body2">{error}</Typography>
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onCancel} disabled={isDeleting}>
          {t('common:actions.no', 'No')}
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="error"
          disabled={isDeleting}
          startIcon={isDeleting ? <CircularProgress size={20} /> : undefined}
        >
          {isDeleting ? t('common:deleting', 'Deleting...') : t('common:actions.yes', 'Yes')}
        </Button>
      </DialogActions>
    </>
  );
};
