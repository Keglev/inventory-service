/**
 * @file TableDensitySetting.tsx
 * @module app/HamburgerMenu/AppearanceSettings/TableDensitySetting
 *
 * @summary
 * Table density setting component with comfortable/compact toggle buttons.
 * Persists preference via useSettings hook.
 *
 * @example
 * ```tsx
 * <TableDensitySetting tableDensity="compact" onChange={handleChange} />
 * ```
 */

import { Box, Typography, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface TableDensitySettingProps {
  /** Current table density setting (comfortable or compact) */
  tableDensity: string;

  /** Callback when table density changes */
  onChange: (newDensity: 'compact' | 'comfortable') => void;
}

/**
 * Table density setting component.
 *
 * Provides toggle between comfortable and compact table display modes.
 *
 * @param props - Component props
 * @returns JSX element rendering density toggle buttons
 */
export default function TableDensitySetting({
  tableDensity,
  onChange,
}: TableDensitySettingProps) {
  const { t } = useTranslation(['common']);

  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.75 }}>
        {t('appearance.density', 'Density')}
      </Typography>
      <ToggleButtonGroup
        value={tableDensity === 'compact' || tableDensity === 'comfortable' ? tableDensity : 'comfortable'}
        exclusive
        onChange={(_, newDensity) => {
          if (newDensity) onChange(newDensity as 'compact' | 'comfortable');
        }}
        size="small"
        fullWidth
      >
        <ToggleButton value="comfortable">
          <Typography variant="caption">
            {t('appearance.standard', 'Standard')}
          </Typography>
        </ToggleButton>
        <ToggleButton value="compact">
          <Typography variant="caption">
            {t('appearance.compact', 'Compact')}
          </Typography>
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
}
