/**
 * @file EditSupplierConfirmation.tsx
 * @module dialogs/EditSupplierDialog/EditSupplierConfirmation
 *
 * @summary
 * Confirmation dialog for supplier changes.
 * Displays changes summary before applying updates.
 *
 * @enterprise
 * - Pure presentation component
 * - Shows supplier info (name is read-only)
 * - Displays what will change (before → after)
 * - Requires user confirmation before proceeding
 */

import * as React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  Divider,
  CircularProgress,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { EditSupplierForm } from '../../../../api/suppliers';
import type { SupplierRow } from '../../../../api/suppliers/types';

/**
 * Props for EditSupplierConfirmation component.
 *
 * @interface EditSupplierConfirmationProps
 */
interface EditSupplierConfirmationProps {
  /** Whether confirmation dialog is open */
  open: boolean;
  /** Selected supplier to update */
  supplier: SupplierRow | null;
  /** Pending changes to apply */
  changes: EditSupplierForm | null;
  /** Form error message, if any */
  formError: string;
  /** Whether update is in progress */
  isSubmitting: boolean;
  /** Called when user confirms changes */
  onConfirm: () => Promise<void>;
  /** Called when user cancels */
  onCancel: () => void;
}

/**
 * Confirmation dialog for supplier changes.
 *
 * Displays supplier details and a summary of changes
 * that will be applied. Requires user confirmation.
 *
 * @component
 * @param props - Component props
 * @returns JSX element with confirmation dialog
 *
 * @example
 * ```tsx
 * <EditSupplierConfirmation
 *   open={showConfirmation}
 *   supplier={selectedSupplier}
 *   changes={pendingChanges}
 *   formError={error}
 *   isSubmitting={isSubmitting}
 *   onConfirm={handleConfirm}
 *   onCancel={handleCancel}
 * />
 * ```
 */
export const EditSupplierConfirmation: React.FC<EditSupplierConfirmationProps> = ({
  open,
  supplier,
  changes,
  formError,
  isSubmitting,
  onConfirm,
  onCancel,
}) => {
  const { t } = useTranslation(['suppliers', 'common']);

  return (
    <Dialog open={open} onClose={onCancel} fullWidth maxWidth="sm">
      <DialogTitle>{t('suppliers:dialogs.confirmChanges', 'Confirm Changes')}</DialogTitle>

      <DialogContent dividers>
        <Box sx={{ display: 'grid', gap: 2 }}>
          {formError && (
            <Alert severity="error" onClose={onCancel}>
              {formError}
            </Alert>
          )}

          <Alert severity="warning">
            {t('suppliers:confirmations.changesCannotBeReversed', 'These changes cannot be reversed.')}
          </Alert>

          {supplier && (
            <Box>
              {/* Supplier Name (Read-only for display) */}
              <Box sx={{ mb: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {t('suppliers:table.name', 'Supplier Name')}
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>
                  {supplier.name}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  {t('suppliers:hints.nameCannotBeChanged', '(Cannot be changed)')}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Changes Summary */}
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
                {t('suppliers:confirmations.changes', 'Changes')}
              </Typography>

              {changes?.contactName !== (supplier.contactName || '') && (
                <Box sx={{ mb: 1.5, p: 1, bgcolor: 'info.lighter', borderRadius: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {t('suppliers:table.contactName', 'Contact Name')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {supplier.contactName || '(empty)'} →{' '}
                    {changes?.contactName || '(empty)'}
                  </Typography>
                </Box>
              )}

              {changes?.phone !== (supplier.phone || '') && (
                <Box sx={{ mb: 1.5, p: 1, bgcolor: 'info.lighter', borderRadius: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {t('suppliers:table.phone', 'Phone')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {supplier.phone || '(empty)'} → {changes?.phone || '(empty)'}
                  </Typography>
                </Box>
              )}

              {changes?.email !== (supplier.email || '') && (
                <Box sx={{ mb: 1.5, p: 1, bgcolor: 'info.lighter', borderRadius: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {t('suppliers:table.email', 'Email')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {supplier.email || '(empty)'} → {changes?.email || '(empty)'}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ gap: 1 }}>
        <Button onClick={onCancel} disabled={isSubmitting}>
          {t('common:actions.no', 'No')}
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <CircularProgress size={16} sx={{ mr: 1 }} />
              {t('common:saving', 'Saving...')}
            </>
          ) : (
            t('common:actions.yes', 'Yes')
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
