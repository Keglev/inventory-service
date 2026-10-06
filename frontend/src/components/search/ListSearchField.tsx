/**
 * @file ListSearchField.tsx
 * @module components/search/ListSearchField
 *
 * @summary
 * The one search field for lists matched in the browser: the supplier search
 * (board and supplier dialogs) and the item pickers of the inventory dialogs.
 *
 * @enterprise
 * - Receives the already matched results (matchSuppliers, matchItems) and
 *   shows at most MAX_VISIBLE of them, with a count of the rest, so a long
 *   list never opens a long dropdown; typing more narrows it.
 * - Two modes. Search (no value prop): the field keeps no value and the
 *   caller shows the pick elsewhere. Picker (value given): the picked option
 *   stays in the field; clearing the text clears the pick.
 * - Built on MUI Autocomplete: arrow keys and Enter select a result, and
 *   the listbox carries the ARIA roles a screen reader needs.
 * - The field is never disabled while data loads; a disabled field drops
 *   focus and loses what the user types next.
 */

import * as React from 'react';
import { Autocomplete, Box, Paper, TextField, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { SEARCH_MIN_CHARS } from '../../utils/searchFragment';

/** Results shown at once; the rest are counted below them. */
const MAX_VISIBLE = 6;

export interface ListSearchFieldProps<T> {
  /** Text typed in the field. */
  query: string;
  /** Called with the new text on every edit. */
  onQueryChange: (query: string) => void;
  /** Options matching the query. */
  results: readonly T[];
  /** Whether the list behind the results is still loading. */
  loading: boolean;
  /** Called with the option the user picks; null when a picker is cleared. */
  onSelect: (option: T | null) => void;
  /** The first line of a result, and the text a picker shows. */
  getLabel: (option: T) => string;
  /** A stable identity for an option. */
  getKey: (option: T) => string;
  /** An optional second line of a result; an empty string shows nothing. */
  getDetail?: (option: T) => string;
  /** Picker mode: the picked option. Left out, the field is a plain search. */
  value?: T | null;
  /** Shown when nothing matches. */
  noResultsText: string;
  /** Shown under the field while the query is too short. */
  hintText: string;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  /** Hides the result list, e.g. while a picked option is shown elsewhere. */
  suppressResults?: boolean;
}

// The popup paper receives the hidden-result count through slotProps.
function ResultsPaper({ children, moreCount, ...rest }: React.ComponentProps<typeof Paper> & { moreCount?: number }) {
  const { t } = useTranslation(['common']);
  return (
    <Paper {...rest}>
      {children}
      {moreCount ? (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', px: 2, py: 1, borderTop: 1, borderColor: 'divider' }}
        >
          {t('common:search.moreResults', { count: moreCount })}
        </Typography>
      ) : null}
    </Paper>
  );
}

export function ListSearchField<T>({
  query,
  onQueryChange,
  results,
  loading,
  onSelect,
  getLabel,
  getKey,
  getDetail,
  value,
  noResultsText,
  hintText,
  label,
  placeholder,
  disabled = false,
  suppressResults = false,
}: ListSearchFieldProps<T>) {
  const { t } = useTranslation(['common']);
  const [popupOpen, setPopupOpen] = React.useState(false);

  const picker = value !== undefined;
  const longEnough = query.trim().length >= SEARCH_MIN_CHARS;
  const visible = results.slice(0, MAX_VISIBLE);
  const moreCount = results.length - visible.length;
  // A picked option stays among the options, so Autocomplete can match it.
  const options =
    suppressResults ? [] : value && !visible.some((o) => getKey(o) === getKey(value)) ? [value, ...visible] : visible;

  return (
    <Autocomplete<T>
      options={options}
      // Matching happens upstream; Autocomplete must not filter again.
      filterOptions={(all) => all}
      getOptionLabel={getLabel}
      getOptionKey={getKey}
      isOptionEqualToValue={(option, picked) => getKey(option) === getKey(picked)}
      value={value ?? null}
      inputValue={query}
      onInputChange={(_event, text) => onQueryChange(text)}
      onChange={(_event, option) => onSelect(option)}
      open={popupOpen && longEnough && !suppressResults}
      onOpen={() => setPopupOpen(true)}
      onClose={() => setPopupOpen(false)}
      // A search keeps what was typed; a picker falls back to its pick.
      clearOnBlur={picker}
      disabled={disabled}
      loading={loading}
      loadingText={t('common:loading')}
      noOptionsText={noResultsText}
      slots={{ paper: ResultsPaper }}
      slotProps={{ paper: { moreCount } as React.ComponentProps<typeof Paper> }}
      renderOption={(props, option) => {
        const { key, ...optionProps } = props as typeof props & { key: React.Key };
        const detail = getDetail?.(option);
        return (
          <li key={key} {...optionProps}>
            <Box>
              <Typography variant="body2">{getLabel(option)}</Typography>
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
          label={label}
          placeholder={placeholder}
          helperText={query.trim().length > 0 && !longEnough ? hintText : undefined}
        />
      )}
    />
  );
}
