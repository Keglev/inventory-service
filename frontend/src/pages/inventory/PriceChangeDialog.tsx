/**
 * @file PriceChangeDialog.tsx
 * @module pages/inventory/PriceChangeDialog
 *
 * @summary
 * Dialog to change the item's unit price.
 */

import * as React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Box } from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { changePriceSchema } from './validation';
import type { ChangePriceForm } from './validation';
import { changePrice } from '../../api/inventory/mutations';
import type { Resolver } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

export interface PriceChangeDialogProps {
  open: boolean;
  itemId: string;
  onClose: () => void;
  onChanged: () => void;
}

export const PriceChangeDialog: React.FC<PriceChangeDialogProps> = ({
  open, itemId, onClose, onChanged
}) => {
  const { t } = useTranslation();
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } =
    useForm<ChangePriceForm>({
        resolver: zodResolver(changePriceSchema) as Resolver<ChangePriceForm>,
        defaultValues: { id: itemId, price: 0 },
    });

  React.useEffect(() => {
    reset({ id: itemId, price: 0 });
  }, [itemId, reset]);

  const onSubmit = handleSubmit(async (values: ChangePriceForm) => {
    const ok = await changePrice(values);
    if (ok) {
        onChanged();
        onClose();
    }
  });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{t('inventory.changePrice', 'Change price')}</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'grid', gap: 2, mt: 1 }}>
          <TextField
            label={t('inventory.newPrice', 'New price')}
            type="number"
            inputProps={{ min: 0, step: '0.01' }}
            {...register('price')}
            error={!!errors.price}
            helperText={errors.price?.message}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('actions.cancel', 'Cancel')}</Button>
        <Button onClick={onSubmit} disabled={isSubmitting} variant="contained">
          {t('actions.update', 'Update')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
