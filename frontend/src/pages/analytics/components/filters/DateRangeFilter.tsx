/**
 * @file DateRangeFilter.tsx
 * @description
 * Date range picker with quick presets (30/90/180 days)
 */

import { useState } from 'react';
import { Button } from '@mui/material';
import { formatToIsoDate, getQuickDateRange, parseIsoDate } from './useFiltersLogic';
import type { AnalyticsFilters } from './Filters.types';

interface DateRangeFilterProps {
  /** Current filter state */
  value: AnalyticsFilters;
  /** Changed on any date or quick-range change */
  onChange: (filters: AnalyticsFilters) => void;
  disabled?: boolean;
}

/**
 * DateRangeFilter - date picker with quick presets
 */
export function DateRangeFilter({
  value,
  onChange,
  disabled = false,
}: DateRangeFilterProps) {
  const [showCustom, setShowCustom] = useState(value.quick === 'custom');

  const fromDate = parseIsoDate(value.from);
  const toDate = parseIsoDate(value.to);

  const handleQuickRange = (days: number) => {
    const { from, to } = getQuickDateRange(days);
    onChange({
      ...value,
      quick: (days === 30 ? '30' : days === 90 ? '90' : '180') as '30' | '90' | '180',
      from: formatToIsoDate(from),
      to: formatToIsoDate(to),
    });
    setShowCustom(false);
  };

  const handleCustom = () => {
    setShowCustom(true);
    onChange({ ...value, quick: 'custom' });
  };

  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...value,
      from: e.target.value || undefined,
      quick: 'custom',
    });
  };

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...value,
      to: e.target.value || undefined,
      quick: 'custom',
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <Button
          variant={value.quick === '30' ? 'contained' : 'outlined'}
          size="small"
          onClick={() => handleQuickRange(30)}
          disabled={disabled}
        >
          30 days
        </Button>
        <Button
          variant={value.quick === '90' ? 'contained' : 'outlined'}
          size="small"
          onClick={() => handleQuickRange(90)}
          disabled={disabled}
        >
          90 days
        </Button>
        <Button
          variant={value.quick === '180' ? 'contained' : 'outlined'}
          size="small"
          onClick={() => handleQuickRange(180)}
          disabled={disabled}
        >
          180 days
        </Button>
        <Button
          variant={value.quick === 'custom' ? 'contained' : 'outlined'}
          size="small"
          onClick={handleCustom}
          disabled={disabled}
        >
          Custom
        </Button>
      </div>

      {showCustom && (
        <div style={{ display: 'flex', gap: '12px', marginTop: '12px', alignItems: 'center' }}>
          <input
            type="date"
            value={fromDate?.toISOString().split('T')[0] || ''}
            onChange={handleFromChange}
            disabled={disabled}
            style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }}
          />
          <span style={{ fontSize: '14px', color: '#999' }}>to</span>
          <input
            type="date"
            value={toDate?.toISOString().split('T')[0] || ''}
            onChange={handleToChange}
            disabled={disabled}
            style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }}
          />
        </div>
      )}
    </div>
  );
}
