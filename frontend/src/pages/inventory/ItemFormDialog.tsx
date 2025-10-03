/**
 * @file ItemFormDialog.tsx
 * @module pages/inventory/ItemFormDialog
 *
 * @summary
 * Create/Edit dialog for inventory items with SAP-like flow:
 * pick a supplier → enter name/code/minQty/notes → submit.
 *
 * @remarks
 * - Built with React Hook Form + Zod for robust, typed client validation.
 * - Error handling maps backend messages to field or form errors, even when the backend
 *   returns only a generic string (no structured `fieldErrors`).
 * - Supplier Autocomplete is fully controlled to avoid desync between RHF state and UI value.
 * - Demo mode is supported via a `readOnly` prop (disabled primary action with tooltip);
 *   the flag will be wired from AppShell later.
 *
 * @enterprise
 * - **Resilience:** Network/mutation calls never throw here; errors surface as user-friendly form
 *   messages, with lightweight heuristics (duplicate name/code, supplier issues).
 * - **Separation of concerns:** All normalization of server responses lives in `api/inventory/*`
 *   so this component stays focused on UX and validation.
 * - **i18n discipline:** Keys live under `common` and `inventory` namespaces to keep domain-based
 *   translation files (enterprise standard). Avoid per-dialog files to limit sprawl.
 * - **Maintainability:** Extensive TypeDoc + inline comments explain business intent and trade-offs
 *   for future contributors and technical reviewers (e.g., recruiters).
 */

import * as React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Box, Autocomplete, Alert, Tooltip, FormControl,
  InputLabel, Select, MenuItem
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Resolver } from 'react-hook-form';
import { listSuppliers, upsertItem } from '../../api/inventory/mutations';
import type { SupplierOptionDTO } from '../../api/inventory/mutations';
import { useTranslation } from 'react-i18next';
import { upsertItemSchema } from './validation';
import type { UpsertItemForm } from './validation';

/**
 * Props for {@link ItemFormDialog}.
 */
export interface ItemFormDialogProps {
  /** Whether the dialog is visible. */
  open: boolean;
  /**
   * When present, dialog operates in **Edit** mode and pre-fills fields.
   * When absent, dialog operates in **Create** mode.
   */
  initial?: Partial<UpsertItemForm>;
  /** Called when the user cancels or after a successful save. */
  onClose: () => void;
  /**
   * Called after a successful save.
   * Parent typically reloads the grid and shows a toast.
   */
  onSaved: () => void;
  /**
   * When true, disables the primary action and shows a tooltip.
   * This is used for “demo mode” where mutations are read-only.
   * The actual flag will be provided by AppShell later.
   */
  readOnly?: boolean;
}

/**
 * Dialog for creating or editing an inventory item.
 *
 * @remarks
 * Key UX decisions:
 * - **Supplier-first**: keeps the Autocomplete controlled so the selected supplier is consistent
 *   between UI and RHF values (prevents subtle desyncs when list loads late).
 * - **Error mapping**: since the backend may return a flat `message`, we apply small heuristics
 *   to surface likely field-level issues (e.g., duplicate `name`/`code`) while keeping a
 *   generic fallback for unknown messages. This can be upgraded to structured `fieldErrors`
 *   later without changing the UI layer.
 */
export const ItemFormDialog: React.FC<ItemFormDialogProps> = ({
  open,
  initial,
  onClose,
  onSaved,
  readOnly = false,
}) => {
  // Load both 'common' and 'inventory' namespaces. Keep i18n domain-based (enterprise style).
  const { t } = useTranslation(['common', 'inventory']);

  /**
   * React Hook Form setup with Zod resolver.
   * @enterprise Keeps validation deterministic and type-safe.
   */
  const {
    register,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<UpsertItemForm>({
    resolver: zodResolver(upsertItemSchema) as Resolver<UpsertItemForm>,
    defaultValues: {
      id: initial?.id,
      name: initial?.name ?? '',
      code: initial?.code ?? '',
      supplierId: initial?.supplierId ?? '',
      price: initial?.price ?? 0, // Start with 0, require > 0 on submit
      quantity: initial?.quantity ?? 0, // Start with 0, require > 0 on submit
      // We keep the same form key, but label shows "Qty"
      minQty: initial?.minQty ?? 0,
      // "notes" carries create-reason until backend exposes a dedicated field
      notes: initial?.notes ?? '',
    },
  });

  /** Allowed reasons for *create* flow only (server enum-compatible). */
  const CREATE_REASON_OPTIONS = [
    { value: 'INITIAL_STOCK', i18nKey: 'reasons.initial_stock' },
    { value: 'MANUAL_UPDATE', i18nKey: 'reasons.manual_update' },
  ] as const;

  /** Supplier options fetched from server. */
  const [suppliers, setSuppliers] = React.useState<SupplierOptionDTO[]>([]);
  /**
   * Controlled value for Autocomplete to prevent UI/RHF desync (common pitfall).
   * RHF stores the `supplierId` as the form value; the UI needs the full option object.
   */
  const [supplierValue, setSupplierValue] = React.useState<SupplierOptionDTO | null>(null);
  /** Form-level error banner (for non-field errors and generic failures). */
  const [formError, setFormError] = React.useState<string | null>(null);

  /**
   * Fetch suppliers once and align the controlled Autocomplete with `initial?.supplierId`.
   * @enterprise Avoids race conditions where the list arrives after defaultValues.
   */
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const list = await listSuppliers();
      if (cancelled) return;
      setSuppliers(list);

      const match =
        list.find((s) => String(s.id) === String(initial?.supplierId)) ?? null;
      setSupplierValue(match);
    })();
    return () => {
      cancelled = true;
    };
    // Re-run when editing another item that has a different supplier
  }, [initial?.supplierId]);

  /**
   * Reinitialize RHF state whenever the dialog opens with different initial data.
   * @enterprise Ensures predictable reset semantics for Create vs. Edit flows.
   */
  React.useEffect(() => {
    if (!open) return;
    reset({
      id: initial?.id,
      name: initial?.name ?? '',
      code: initial?.code ?? '',
      supplierId: (initial?.supplierId as UpsertItemForm['supplierId']) ?? '',
      minQty: initial?.minQty ?? 0,
      notes: initial?.notes ?? '',
    });
    setFormError(null);
    clearErrors();
  }, [open, initial, reset, clearErrors]);

  /**
   * Try to convert a generic backend error string into field or form errors.
   * @remarks
   * Since the current backend error shape may be just `message: string`,
   * we use small, readable heuristics to improve UX without backend changes.
   * This can be replaced by structured `fieldErrors` in the future.
   */
  function applyServerError(message?: string | null): void {
    if (!message) return;
    const msg = message.toLowerCase();

    // Heuristics for duplicates and supplier selection issues
    if (msg.includes('name') && (msg.includes('duplicate') || msg.includes('exists'))) {
      setError('name', {
        message: t('inventory:duplicateName', 'An item with this name already exists.'),
      });
      setFormError(t('inventory:validationFailed', 'Please fix the highlighted fields.'));
      return;
    }
    if ((msg.includes('code') || msg.includes('sku')) && (msg.includes('duplicate') || msg.includes('exists'))) {
      setError('code', {
        message: t('inventory:duplicateCode', 'An item with this code already exists.'),
      });
      setFormError(t('inventory:validationFailed', 'Please fix the highlighted fields.'));
      return;
    }
    if (msg.includes('supplier')) {
      setError('supplierId', { message });
      setFormError(t('inventory:validationFailed', 'Please fix the highlighted fields.'));
      return;
    }

    // Generic fallback
    setFormError(message || t('inventory:serverError', 'Something went wrong. Please try again.'));
  }

  /**
   * Submit handler:
   * - Honors `readOnly` (demo mode).
   * - Calls tolerant `upsertItem` mutation.
   * - On success → propagate `onSaved()` and close; on failure → map error(s).
   */
  const onSubmit = handleSubmit(async (values: UpsertItemForm) => {
    setFormError(null);
    clearErrors();

    // Demo guard (real flag will come from AppShell)
    if (readOnly) {
      setFormError(t('common.demoDisabled', 'This action is disabled in demo mode.'));
      return;
    }

    const res = await upsertItem(values);
    if (res.ok) {
      onSaved();
      onClose();
    } else {
      applyServerError(res.error ?? t('inventory:serverError', 'Something went wrong. Please try again.'));
    }
  });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {initial?.id
          ? t('inventory:editItem', 'Edit item')
          : t('inventory:newItem', 'Add new item')}
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ display: 'grid', gap: 2, mt: 1 }}>
          {/* Top-level error banner for non-field failures */}
          {formError && <Alert severity="error">{formError}</Alert>}

          {/* Supplier (controlled Autocomplete) */}
          <Autocomplete<SupplierOptionDTO, false, false, false>
            options={suppliers}
            value={supplierValue}
            onChange={(_, opt) => {
              setSupplierValue(opt);
              const nextSupplierId: UpsertItemForm['supplierId'] =
                opt ? (opt.id as UpsertItemForm['supplierId']) : ('' as UpsertItemForm['supplierId']);
                setValue('supplierId', nextSupplierId, { shouldValidate: true });
              }}
            getOptionLabel={(o) => o.name}
            isOptionEqualToValue={(a, b) => String(a.id) === String(b.id)}
            renderInput={(p) => (
              <TextField
                {...p}
                label={t('inventory:supplier', 'Supplier')}
                error={!!errors.supplierId}
                helperText={errors.supplierId?.message}
              />
            )}
          />

          {/* Name */}
          <TextField
            label={t('inventory:name', 'Item')}
            {...register('name')}
            error={!!errors.name}
            helperText={errors.name?.message}
          />

          {/* Code / SKU */}
          <Tooltip title={t('inventory:codeReadOnlyHint', 'Optional for now')}>
            <TextField
              label={t('inventory:code', 'Code / SKU')}
              {...register('code')}
              InputProps={{ readOnly: true }}
              error={!!errors.code}
            />
          </Tooltip>

          {/* Initial Stock Quantity */}
          <TextField
            label={t('inventory:quantity', 'Initial Stock')}
            type="number"
            slotProps={{ htmlInput: { min: 0 } }}
            {...register('quantity')}
            error={!!errors.quantity}
            helperText={errors.quantity?.message}
          />

          {/* Minimum Quantity */}
          <TextField
            label={t('inventory:minQty', 'Min Qty (Alert Threshold)')}
            type="number"
            slotProps={{ htmlInput: { min: 0 } }}
            {...register('minQty')}
            error={!!errors.minQty}
            helperText={errors.minQty?.message}
          />

          {/* Price */}
          <TextField
            label={t('inventory:price', 'Price')}
            type="number"
            slotProps={{ htmlInput: { min: 0.01, step: 0.01 } }}
            {...register('price')}
            error={!!errors.price}
            helperText={errors.price?.message}
            InputProps={{
              startAdornment: <span style={{ marginRight: '8px' }}>€</span>,
            }}
          />

          {/* Notes */}
          {/* Reason dropdown on CREATE only */}
          {!initial?.id && (
            <FormControl error={!!errors.notes}>
              <InputLabel id="reason-label">{t('inventory:reason', 'Reason')}</InputLabel>
              <Select
                labelId="reason-label"
                label={t('inventory:reason', 'Reason')}
                value={watch('notes') ?? ''}
                onChange={(e) => setValue('notes', e.target.value as UpsertItemForm['notes'], { shouldValidate: true })}
              >
                {CREATE_REASON_OPTIONS.map(opt => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {t(`inventory:${opt.i18nKey}`, opt.value)}
                  </MenuItem>
                ))}
              </Select>
              {errors.notes?.message && (
                <Box sx={{ mt: 0.5, color: 'error.main', fontSize: 12 }}>{errors.notes.message}</Box>
              )}
            </FormControl>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel', 'Cancel')}</Button>

        {/* Primary action: disabled in demo (readOnly) with explanatory tooltip */}
        <Tooltip
          title={readOnly ? t('common.demoDisabled', 'Disabled in demo mode') : ''}
          disableHoverListener={!readOnly}
        >
          {/* span wrapper: Tooltip needs an enabled element even if the button is disabled */}
          <span>
            <Button onClick={onSubmit} disabled={isSubmitting || readOnly} variant="contained">
              {initial?.id
                ? t('inventory:save', 'Save')
                : t('inventory:create', 'Create')}
            </Button>
          </span>
        </Tooltip>
      </DialogActions>
    </Dialog>
  );
};
