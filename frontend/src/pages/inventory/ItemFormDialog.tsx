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
 *
 * @refactored
 * - Uses shared `useSuppliersQuery` hook for consistent supplier loading with 5-minute cache
 * - Migrated from direct `listSuppliers()` API call to React Query pattern
 * - Eliminates duplicate supplier fetching logic (~27 lines)
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
import { upsertItem } from '../../api/inventory/mutations';
import type { UpsertItemRequest } from '../../api/inventory/mutations';
import type { InventoryRow } from '../../api/inventory/types';
import { useTranslation } from 'react-i18next';
import { itemFormSchema } from './validation';
import type { UpsertItemForm } from './validation';
import { useSuppliersQuery } from './hooks/useInventoryData';
import type { SupplierOption } from './types/inventory-dialog.types';

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
  initial?: InventoryRow;
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
  const { t } = useTranslation(['common', 'inventory', 'errors']);

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
    resolver: zodResolver(itemFormSchema) as Resolver<UpsertItemForm>,
    defaultValues: {
      name: initial?.name ?? '',
      code: initial?.code ?? '',
      supplierId: initial?.supplierId ?? '',
      quantity: initial?.onHand ?? 0, // Map onHand to quantity
      price: 0, // Price not in InventoryRow, start with 0
      reason: 'INITIAL_STOCK', // Default reason
    },
  });

  /** Allowed reasons for *create* flow only (server enum-compatible). */
  const CREATE_REASON_OPTIONS = [
    { value: 'INITIAL_STOCK', i18nKey: 'stockReasons.initial_stock' },
    { value: 'MANUAL_UPDATE', i18nKey: 'stockReasons.manual_update' },
  ] as const;

  /**
   * Load suppliers using shared hook with 5-minute cache.
   * @enterprise Consistent with other dialogs (QuantityAdjustDialog, PriceChangeDialog)
   * @refactored Replaced manual useEffect + listSuppliers() with useSuppliersQuery hook
   */
  const { data: suppliers = [] } = useSuppliersQuery(open);

  /**
   * Controlled value for Autocomplete to prevent UI/RHF desync (common pitfall).
   * RHF stores the `supplierId` as the form value; the UI needs the full option object.
   */
  const [supplierValue, setSupplierValue] = React.useState<SupplierOption | null>(null);
  
  /** Form-level error banner (for non-field errors and generic failures). */
  const [formError, setFormError] = React.useState<string | null>(null);

  /**
   * Align the controlled Autocomplete with `initial?.supplierId` when suppliers load.
   * @enterprise Avoids race conditions where the list arrives after defaultValues.
   * @refactored Simplified to only handle supplier matching, fetching now handled by hook
   */
  React.useEffect(() => {
    if (!suppliers.length) return;
    const match = suppliers.find((s) => String(s.id) === String(initial?.supplierId)) ?? null;
    setSupplierValue(match);
  }, [suppliers, initial?.supplierId]);

  /**
   * Reinitialize RHF state whenever the dialog opens with different initial data.
   * @enterprise Ensures predictable reset semantics for Create vs. Edit flows.
   */
  React.useEffect(() => {
    if (!open) return;
    reset({
      name: initial?.name ?? '',
      code: initial?.code ?? '',
      supplierId: (initial?.supplierId as UpsertItemForm['supplierId']) ?? '',
      quantity: initial?.onHand ?? 0, // Map onHand to quantity
      price: 0, // Price not in InventoryRow, start with 0
      reason: 'INITIAL_STOCK', // Default reason
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
        message: t('errors:inventory.conflicts.duplicateName', 'An item with this name already exists.'),
      });
      setFormError(t('errors:inventory.validationFailed', 'Please fix the highlighted fields.'));
      return;
    }
    if ((msg.includes('code') || msg.includes('sku')) && (msg.includes('duplicate') || msg.includes('exists'))) {
      setError('code', {
        message: t('errors:inventory.conflicts.duplicateCode', 'An item with this code already exists.'),
      });
      setFormError(t('errors:inventory.validationFailed', 'Please fix the highlighted fields.'));
      return;
    }
    if (msg.includes('supplier')) {
      setError('supplierId', { message });
      setFormError(t('errors:inventory.validationFailed', 'Please fix the highlighted fields.'));
      return;
    }

    // Generic fallback
    setFormError(message || t('errors:inventory.server.serverError', 'Something went wrong. Please try again.'));
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

    // Prepare the request with auto-set minQty and createdBy
    // Map reason to notes for backend compatibility
    const requestData: UpsertItemRequest = {
      name: values.name,
      code: values.code,
      supplierId: values.supplierId,
      quantity: values.quantity,
      price: values.price,
      minQty: 5, // Auto-set minimal stock to 5 as requested
      notes: values.reason, // Map reason dropdown to notes field for backend
      createdBy: 'user', // Set default user - can be improved with actual user context
    };

    const res = await upsertItem(requestData);
    if (res.ok) {
      onSaved();
      onClose();
    } else {
      applyServerError(res.error ?? t('errors:inventory.server.serverError', 'Something went wrong. Please try again.'));
    }
  });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {initial?.id
          ? t('inventory:dialogs.editItemTitle', 'Edit item')
          : t('inventory:toolbar.newItem', 'Add new item')}
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ display: 'grid', gap: 2, mt: 1 }}>
          {/* Top-level error banner for non-field failures */}
          {formError && <Alert severity="error">{formError}</Alert>}

          {/* Supplier (controlled Autocomplete) */}
          <Autocomplete<SupplierOption, false, false, false>
            options={suppliers}
            value={supplierValue}
            onChange={(_, opt) => {
              setSupplierValue(opt);
              const nextSupplierId: UpsertItemForm['supplierId'] =
                opt ? (opt.id as UpsertItemForm['supplierId']) : ('' as UpsertItemForm['supplierId']);
                setValue('supplierId', nextSupplierId, { shouldValidate: true });
              }}
            getOptionLabel={(o) => o.label}
            isOptionEqualToValue={(a, b) => String(a.id) === String(b.id)}
            renderInput={(p) => (
              <TextField
                {...p}
                label={t('inventory:table.supplier', 'Supplier')}
                error={!!errors.supplierId}
                helperText={errors.supplierId?.message}
              />
            )}
          />

          {/* Name */}
          <TextField
            label={t('inventory:table.name', 'Item')}
            {...register('name')}
            error={!!errors.name}
            helperText={errors.name?.message}
          />

          {/* Code / SKU */}
          <Tooltip title={t('inventory:fields.codeReadOnlyHint', 'Optional for now')}>
            <TextField
              label={t('inventory:table.code', 'Code / SKU')}
              {...register('code')}
              InputProps={{ readOnly: true }}
              error={!!errors.code}
            />
          </Tooltip>

          {/* Initial Stock Quantity */}
          <TextField
            label={t('inventory:table.quantity', 'Initial Stock')}
            type="number"
            slotProps={{ htmlInput: { min: 0 } }}
            {...register('quantity', { valueAsNumber: true })}
            error={!!errors.quantity}
            helperText={errors.quantity?.message}
          />

          {/* Price */}
          <TextField
            label={t('inventory:table.price', 'Price')}
            type="number"
            slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
            {...register('price', { valueAsNumber: true })}
            error={!!errors.price}
            helperText={errors.price?.message}
            InputProps={{
              startAdornment: <span style={{ marginRight: '8px' }}>€</span>,
            }}
          />

          {/* Reason dropdown on CREATE only */}
          {!initial?.id && (
            <FormControl error={!!errors.reason}>
              <InputLabel id="reason-label">{t('inventory:fields.reasonLabel', 'Reason')}</InputLabel>
              <Select
                labelId="reason-label"
                label={t('inventory:fields.reasonLabel', 'Reason')}
                value={watch('reason') ?? 'INITIAL_STOCK'}
                onChange={(e) => setValue('reason', e.target.value as UpsertItemForm['reason'], { shouldValidate: true })}
              >
                {CREATE_REASON_OPTIONS.map(opt => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {t(`inventory:${opt.i18nKey}`, opt.value)}
                  </MenuItem>
                ))}
              </Select>
              {errors.reason?.message && (
                <Box sx={{ mt: 0.5, color: 'error.main', fontSize: 12 }}>{errors.reason.message}</Box>
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
                ? t('inventory:buttons.save', 'Save')
                : t('inventory:buttons.create', 'Create')}
            </Button>
          </span>
        </Tooltip>
      </DialogActions>
    </Dialog>
  );
};
