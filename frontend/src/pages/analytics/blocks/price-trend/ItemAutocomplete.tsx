/**
 * @file ItemAutocomplete.tsx
 * @description
 * Item search and selection autocomplete component.
 * Handles global and supplier-scoped searches with debouncing.
 */

import * as React from 'react';
import { TextField, Autocomplete } from '@mui/material';
import type { AutocompleteRenderInputParams } from '@mui/material/Autocomplete';
import { useTranslation } from 'react-i18next';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import {
  searchItemsForSupplier,
  searchItemsGlobal,
  type ItemRef,
} from '../../../../api/analytics';
import { useDebounced } from '../../../../hooks/useDebounced';

/**
 * Props for ItemAutocomplete
 */
export interface ItemAutocompleteProps {
  /** Currently selected item */
  value: ItemRef | null;
  /** Called when user selects an item */
  onChange: (item: ItemRef | null) => void;
  /** Supplier ID to scope search (null = global) */
  supplierId?: string | null;
  /** Whether control is disabled */
  disabled?: boolean;
}

/**
 * Item autocomplete component with debounced search
 * Enforces supplier scoping and prevents cross-supplier leaks
 */
export function ItemAutocomplete({
  value,
  onChange,
  supplierId,
  disabled = false,
}: ItemAutocompleteProps) {
  const { t } = useTranslation(['analytics']);

  // Controlled input text and debounced version
  const [itemQuery, setItemQuery] = React.useState('');
  const debouncedQuery = useDebounced(itemQuery, 250);

  // Reset when supplier changes to prevent cross-supplier leaks
  React.useEffect(() => {
    setItemQuery('');
  }, [supplierId]);

  // Search query: global vs supplier-scoped with keepPreviousData
  const itemSearchQ = useQuery<ItemRef[]>({
    queryKey: ['analytics', 'itemSearch', supplierId ?? null, debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery) return [];
      if (supplierId) return searchItemsForSupplier(supplierId, debouncedQuery, 50);
      return searchItemsGlobal(debouncedQuery, 50);
    },
    enabled: debouncedQuery.length >= 1,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  });

  // Client-side filter: belt-and-suspenders supplier filtering
  const baseOptions: ItemRef[] = React.useMemo(() => {
    const base = itemSearchQ.data ?? [];
    const sid = supplierId ?? '';
    const q = debouncedQuery.trim().toLowerCase();
    const bySupplier = sid ? base.filter((it) => (it.supplierId ?? '') === sid) : base;
    const byQuery = q ? bySupplier.filter((it) => it.name.toLowerCase().includes(q)) : bySupplier;
    return byQuery.slice(0, 50);
  }, [itemSearchQ.data, supplierId, debouncedQuery]);

  // Keep selected item visible during refetch if transiently missing from options
  const options: ItemRef[] = React.useMemo(() => {
    if (value && !baseOptions.some((o) => o.id === value.id)) {
      return [value, ...baseOptions];
    }
    return baseOptions;
  }, [baseOptions, value]);

  return (
    <Autocomplete<ItemRef, false, false, false>
      sx={{ minWidth: 320 }}
      options={options}
      getOptionLabel={(o) => o.name}
      loading={itemSearchQ.isLoading}
      value={value}
      onChange={(_e, val) => {
        onChange(val);
        if (val) setItemQuery(val.name);
      }}
      inputValue={itemQuery}
      onInputChange={(_e, val) => setItemQuery(val)}
      disabled={disabled}
      forcePopupIcon={false}
      clearOnBlur={false}
      selectOnFocus
      handleHomeEndKeys
      filterOptions={(x) => x}
      isOptionEqualToValue={(o, v) => o.id === v.id}
      renderInput={(params: AutocompleteRenderInputParams) => {
        const typed = debouncedQuery.trim().length > 0;
        const showNoMatches = !!supplierId && typed && options.length === 0;
        const showTypeHint = !!supplierId && !typed;

        return (
          <TextField
            {...params}
            size="small"
            label={t('analytics:item')}
            placeholder={t('analytics:priceTrend.selectSupplierShort')}
            helperText={
              showNoMatches
                ? t('analytics:priceTrend.noItemsForSupplier')
                : showTypeHint
                  ? t('analytics:priceTrend.typeToSearch', 'Start typing to search…')
                  : ' '
            }
            FormHelperTextProps={{ sx: { minHeight: 20, mt: 0.5 } }}
          />
        );
      }}
      noOptionsText={
        debouncedQuery
          ? t('analytics:priceTrend.noItemsForSupplier')
          : t('analytics:priceTrend.selectSupplierShort')
      }
    />
  );
}
