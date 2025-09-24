/**
 * @file QuantityAdjustDialog.tsx
 * @module pages/inventory/QuantityAdjustDialog
 *
 * @summary
 * Dialog to adjust stock by a delta with a business reason.
 * Positive = purchase/inbound; negative = correction/outbound.
 */

import * as React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Box } from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { adjustQuantitySchema } from './validation';
import type { AdjustQuantityForm } from './validation';
import { adjustQuantity } from '../../api/inventory/mutations';
import type { Resolver } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

export interface QuantityAdjustDialogProps {
  open: boolean;
  itemId: string;
  onClose: () => void;
  onAdjusted: () => void;
}

export const QuantityAdjustDialog: React.FC<QuantityAdjustDialogProps> = ({
  open, itemId, onClose, onAdjusted
}) => {
  const { t } = useTranslation();
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } =
    useForm<AdjustQuantityForm>({
        resolver: zodResolver(adjustQuantitySchema) as Resolver<AdjustQuantityForm>,
        defaultValues: { id: itemId, delta: 0, reason: '' },
    });

  React.useEffect(() => {
    reset({ id: itemId, delta: 0, reason: '' });
  }, [itemId, reset]);

  const onSubmit = handleSubmit(async (values: AdjustQuantityForm) => {
    const ok = await adjustQuantity(values);
    if (ok) {
        onAdjusted();
        onClose();
    }
  });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{t('inventory.adjustQty', 'Adjust quantity')}</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'grid', gap: 2, mt: 1 }}>
          <TextField
            label={t('inventory.delta', 'Delta')}
            type="number"
            {...register('delta')}
            error={!!errors.delta}
            helperText={errors.delta?.message}
          />
          <TextField
            label={t('inventory.reason', 'Reason')}
            {...register('reason')}
            error={!!errors.reason}
            helperText={errors.reason?.message}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('actions.cancel', 'Cancel')}</Button>
        <Button onClick={onSubmit} disabled={isSubmitting} variant="contained">
          {t('actions.apply', 'Apply')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
