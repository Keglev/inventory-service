/**
 * @file SupplierSearchField.tsx
 * @module pages/suppliers/components/SupplierSearchField
 *
 * @summary
 * The one supplier search field: the suppliers board and the edit and delete
 * dialogs all use it.
 *
 * @enterprise
 * - Receives the already matched suppliers (matchSuppliers) and shows at
 *   most MAX_VISIBLE of them, with a count of the rest, so a long list
 *   never opens a long dropdown; typing more narrows it.
 * - Built on MUI Autocomplete: arrow keys and Enter select a result, and
 *   the listbox carries the ARIA roles a screen reader needs.
 * - The field is never disabled while data loads; a disabled field drops
 *   focus and loses what the user types next.
 * - The second line of a result names the contact and an email or phone,
 *   when the supplier has them; nothing is shown otherwise.
 */

import * as React from 'react';
import { Autocomplete, Box, Paper, TextField, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { SupplierRow } from '../../../api/suppliers/types';
import { SUPPLIER_SEARCH_MIN_CHARS } from '../utils/matchSuppliers';

/** Results shown at once; the rest are counted below them. */
const MAX_VISIBLE = 6;

export interface SupplierSearchFieldProps {
  /** Text typed in the field. */
  query: string;
  /** Called with the new text on every edit. */
  onQueryChange: (query: string) => void;
  /** Suppliers matching the query (matchSuppliers). */
  results: SupplierRow[];
  /** Whether the supplier list is still loading. */
  loading: boolean;
  /** Called with the supplier the user picks. */
  onSelect: (supplier: SupplierRow) => void;
  /** Hides the result list, e.g. while a picked supplier is shown. */
  suppressResults?: boolean;
}

// The popup paper receives the hidden-result count through slotProps.
function ResultsPaper({ children, moreCount, ...rest }: React.ComponentProps<typeof Paper> & { moreCount?: number }) {
  const { t } = useTranslation(['suppliers']);
  return (
    <Paper {...rest}>
      {children}
      {moreCount ? (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', px: 2, py: 1, borderTop: 1, borderColor: 'divider' }}
        >
          {t('suppliers:search.moreResults', { count: moreCount })}
        </Typography>
      ) : null}
    </Paper>
  );
}

export const SupplierSearchField: React.FC<SupplierSearchFieldProps> = ({
  query,
  onQueryChange,
  results,
  loading,
  onSelect,
  suppressResults = false,
}) => {
  const { t } = useTranslation(['suppliers', 'common']);
  const [popupOpen, setPopupOpen] = React.useState(false);

  const longEnough = query.trim().length >= SUPPLIER_SEARCH_MIN_CHARS;
  const visible = results.slice(0, MAX_VISIBLE);
  const moreCount = results.length - visible.length;

  return (
    <Autocomplete<SupplierRow>
      options={suppressResults ? [] : visible}
      // Matching happens upstream; Autocomplete must not filter again.
      filterOptions={(options) => options}
      getOptionLabel={(supplier) => supplier.name}
      value={null}
      inputValue={query}
      // value stays null: the field is a search, the caller keeps the pick.
      onInputChange={(_event, text) => onQueryChange(text)}
      onChange={(_event, supplier) => {
        // Typed as nullable by MUI; with value fixed at null a pick is never null.
        if (supplier) onSelect(supplier);
      }}
      open={popupOpen && longEnough && !suppressResults}
      onOpen={() => setPopupOpen(true)}
      onClose={() => setPopupOpen(false)}
      clearOnBlur={false}
      loading={loading}
      loadingText={t('common:loading')}
      noOptionsText={t('suppliers:search.noResults')}
      slots={{ paper: ResultsPaper }}
      slotProps={{ paper: { moreCount } as React.ComponentProps<typeof Paper> }}
      renderOption={(props, supplier) => {
        const { key, ...optionProps } = props as typeof props & { key: React.Key };
        const detail = [supplier.contactName, supplier.email || supplier.phone].filter(Boolean).join(' · ');
        return (
          <li key={key} {...optionProps}>
            <Box>
              <Typography variant="body2">{supplier.name}</Typography>
              {detail && (
                <Typography variant="caption" color="text.secondary">
                  {detail}
                </Typography>
              )}
            </Box>
          </li>
        );
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          size="small"
          placeholder={t('suppliers:search.placeholder')}
          helperText={query.trim().length > 0 && !longEnough ? t('suppliers:search.typeToSearch') : undefined}
        />
      )}
    />
  );
};
