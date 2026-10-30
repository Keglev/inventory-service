/**
 * @file SupplierPickerField.tsx
 * @module components/search/SupplierPickerField
 *
 * @summary
 * The one supplier picker: type two letters, pick a supplier from the
 * matches. A picker setting of the shared ListSearchField.
 *
 * @enterprise
 * - Replaces the supplier dropdowns, which listed every supplier at once and
 *   would open a 500-row menu for a large supplier base (S2-9, Carlos
 *   2026-10-30). Same rule as the item pickers: matching in the browser
 *   (matchSupplierOptions) over the supplier list already loaded and cached, at most six results with a
 *   count of the rest (ADR-0014).
 * - Owns its typed text. A pick puts the supplier's name in the field;
 *   clearing it hands null to the caller; a value the caller sets or resets
 *   shows its name (Autocomplete resets the text on a value change).
 */

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import type { SupplierOption } from '../../api/analytics/types';
import { matchSupplierOptions } from '../../api/suppliers/matchSupplierOptions';
import { ListSearchField } from './ListSearchField';

export interface SupplierPickerFieldProps {
  /** Every supplier (the cached supplier list). */
  suppliers: readonly SupplierOption[];
  /** Whether the supplier list is still loading. */
  loading: boolean;
  /** The picked supplier, or null. */
  value: SupplierOption | null;
  /** Called with the picked supplier, or null when the field is cleared. */
  onSelect: (supplier: SupplierOption | null) => void;
  label?: string;
  /** Shown while the field is empty; defaults to the type-to-search hint. */
  placeholder?: string;
}

export function SupplierPickerField({ suppliers, loading, value, onSelect, label, placeholder }: SupplierPickerFieldProps) {
  const { t } = useTranslation(['suppliers']);
  // MUI's Autocomplete resets the text to the picked label whenever the value
  // changes (a pick, a reset by the caller), so the text needs no sync here.
  const [query, setQuery] = React.useState(value?.label ?? '');

  const results = React.useMemo(() => matchSupplierOptions(suppliers, query), [suppliers, query]);

  return (
    <ListSearchField<SupplierOption>
      query={query}
      onQueryChange={setQuery}
      results={results}
      loading={loading}
      value={value}
      onSelect={onSelect}
      getLabel={(supplier) => supplier.label}
      getKey={(supplier) => supplier.id}
      label={label}
      placeholder={placeholder ?? t('suppliers:search.placeholder')}
      noResultsText={t('suppliers:search.noResults')}
      hintText={t('suppliers:search.typeToSearch')}
      shrinkLabel={placeholder !== undefined}
    />
  );
}
