/**
 * @file ItemSearchAutocomplete.tsx
 * @module pages/analytics/components/ItemSearchAutocomplete
 * @summary Shared item type-ahead picker for analytics cards and sections.
 * @enterprise
 * Extracts the Autocomplete markup previously duplicated in PriceTrendCard
 * and MovementsSection. State stays with the callers (useItemSearchOptions
 * plus per-consumer option enrichment); this component owns only the
 * invariant picker behavior: object-based selection that is never derived
 * from options, controlled input text, no client-side re-filtering
 * (`filterOptions` passthrough -- callers pre-filter), and mirroring a
 * selection back into the input text so the visible query matches the
 * chosen item. Helper text is computed by the caller because the empty /
 * type-to-search semantics differ per consumer.
 */
import { Autocomplete, TextField } from '@mui/material';
import type { AutocompleteRenderInputParams } from '@mui/material/Autocomplete';
import type { JSX } from 'react';
import type { ItemRef } from '../../../api/shared/types';

/**
 * Props accepted by {@link ItemSearchAutocomplete}.
 * @public
 */
export type ItemSearchAutocompleteProps = {
  /** Pre-filtered, pre-enriched options; MUI does not filter again. */
  options: ItemRef[];
  /** True while the backing search query is loading. */
  loading: boolean;
  /** Current selection; owned by the caller, never derived from options. */
  value: ItemRef | null;
  /** Controlled input text (what the user typed). */
  inputValue: string;
  /** Selection change; the input text is mirrored automatically on select. */
  onSelect: (item: ItemRef | null) => void;
  /** Input text change (typing, clearing). */
  onInputChange: (text: string) => void;
  /** Field label. */
  label: string;
  /** Caller-computed helper line; pass ' ' to reserve the row height. */
  helperText: string;
  /** Optional input placeholder. */
  placeholder?: string;
  /** Optional text for MUI's empty-options popup. */
  noOptionsText?: string;
  /** Minimum field width in px (layout differs per host). */
  minWidth?: number;
};

/**
 * Renders the shared analytics item picker.
 *
 * @param props - {@link ItemSearchAutocompleteProps}
 * @returns The controlled Autocomplete element.
 * @public
 */
export function ItemSearchAutocomplete({
  options,
  loading,
  value,
  inputValue,
  onSelect,
  onInputChange,
  label,
  helperText,
  placeholder,
  noOptionsText,
  minWidth = 280,
}: ItemSearchAutocompleteProps): JSX.Element {
  return (
    <Autocomplete<ItemRef, false, false, false>
      sx={{ minWidth }}
      options={options}
      getOptionLabel={(o) => o.name}
      loading={loading}
      value={value}
      onChange={(_e, val) => {
        onSelect(val);
        // Mirror the selection into the input so the visible text stays in
        // sync with the chosen item (identical behavior in both prior hosts).
        if (val) onInputChange(val.name);
      }}
      inputValue={inputValue}
      onInputChange={(_e, val) => onInputChange(val)}
      forcePopupIcon={false}
      clearOnBlur={false}
      selectOnFocus
      handleHomeEndKeys
      filterOptions={(x) => x}
      isOptionEqualToValue={(o, v) => o.id === v.id}
      renderInput={(params: AutocompleteRenderInputParams) => (
        <TextField
          {...params}
          size="small"
          label={label}
          placeholder={placeholder}
          helperText={helperText}
          FormHelperTextProps={{ sx: { minHeight: 20, mt: 0.5 } }}
        />
      )}
      {...(noOptionsText !== undefined ? { noOptionsText } : {})}
    />
  );
}
