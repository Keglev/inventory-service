/**
 * @file ItemFormDialog.tsx
 * @module pages/inventory/ItemFormDialog
 *
 * @summary
 * Dialog for creating or editing an inventory item.
 * SAP-like flow: choose supplier → enter name/code/min qty/notes.
 *
 * @enterprise
 * - React Hook Form + Zod for robust, typed validation.
 * - Server errors are mapped to a form-level message.
 * - On success, parent can refresh the grid and show a toast.
 */

import * as React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Box, Autocomplete, Alert
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { upsertItemSchema } from './validation';
import type { Resolver } from 'react-hook-form';
import type { UpsertItemForm } from './validation';
import { listSuppliers, upsertItem } from '../../api/inventory/mutations';
import type { SupplierOptionDTO } from '../../api/inventory/mutations';
import { useTranslation } from 'react-i18next';

export interface ItemFormDialogProps {
  open: boolean;
  initial?: Partial<UpsertItemForm>;
  onClose: () => void;
  onSaved: () => void; // caller refreshes grid
}

export const ItemFormDialog: React.FC<ItemFormDialogProps> = ({
  open, initial, onClose, onSaved
}) => {
  const { t } = useTranslation(['common', 'auth', 'analytics']);
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } =
    useForm<UpsertItemForm>({
        resolver: zodResolver(upsertItemSchema) as Resolver<UpsertItemForm>,
        defaultValues: {
            id: initial?.id,
            name: initial?.name ?? '',
            code: initial?.code ?? '',
            supplierId: initial?.supplierId ?? '',
            minQty: initial?.minQty ?? 0,
            notes: initial?.notes ?? '',
        },
    });

  const [suppliers, setSuppliers] = React.useState<SupplierOptionDTO[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const list = await listSuppliers();
      if (!cancelled) setSuppliers(list);
    })();
    return () => { cancelled = true; };
  }, []);

  const onSubmit = handleSubmit(async (values: UpsertItemForm) => {
    setError(null);
    const res = await upsertItem(values);
    if (res.ok) {
        onSaved();
        onClose();
    } else {
        setError(res.error ?? t('errors.unknown', 'Something went wrong'));
    }
  });

  const selectedSupplier =
    suppliers.find((s) => String(s.id) === String(initial?.supplierId)) ?? null;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {initial?.id ? t('inventory.editItem', 'Edit item') : t('inventory.newItem', 'Add new item')}
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'grid', gap: 2, mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <Autocomplete<SupplierOptionDTO, false, false, false>
            options={suppliers}
            value={selectedSupplier}
            onChange={(_, opt) =>
                setValue(
                    'supplierId',
                    (opt ? (opt.id as UpsertItemForm['supplierId']) : ('' as UpsertItemForm['supplierId']))
                )
            }
            getOptionLabel={(o: SupplierOptionDTO) => o.name}
            isOptionEqualToValue={(a: SupplierOptionDTO, b: SupplierOptionDTO) => String(a.id) === String(b.id)}
            renderInput={(p) => (
                <TextField
                    {...p}
                    label={t('inventory.supplier', 'Supplier')}
                    error={!!errors.supplierId}
                    helperText={errors.supplierId?.message}
                />
            )}
          />

          <TextField
            label={t('inventory.name', 'Item')}
            {...register('name')}
            error={!!errors.name}
            helperText={errors.name?.message}
          />

          <TextField
            label={t('inventory.code', 'Code / SKU')}
            {...register('code')}
            helperText={t('inventory.codeHint', 'Optional for now')}
          />

          <TextField
            label={t('inventory.minQty', 'Min Qty')}
            type="number"
            inputProps={{ min: 0 }}
            {...register('minQty')}
            error={!!errors.minQty}
            helperText={errors.minQty?.message}
          />

          <TextField
            label={t('inventory.notes', 'Notes')}
            multiline minRows={2}
            {...register('notes')}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('actions.cancel', 'Cancel')}</Button>
        <Button onClick={onSubmit} disabled={isSubmitting} variant="contained">
          {initial?.id ? t('actions.save', 'Save') : t('actions.create', 'Create')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
