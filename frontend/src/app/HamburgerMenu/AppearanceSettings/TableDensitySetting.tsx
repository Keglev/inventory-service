/**
 * @file TableDensitySetting.tsx
 * @module app/HamburgerMenu/AppearanceSettings/TableDensitySetting
 *
 * @summary
 * Controlled density picker (comfortable/compact) rendered as a ToggleButtonGroup.
 *
 * @enterprise
 * - Controlled component: accepts `tableDensity` + `onChange`; no local state;
 *   persistence is owned by the parent section coordinator (AppearanceMenuSection).
 * - Density is editable from both this HamburgerMenu surface and the settings dialog;
 *   this component is the HamburgerMenu surface of ST-APP4.
 *
 * @example
 * ```tsx
 * <TableDensitySetting tableDensity="compact" onChange={handleChange} />
 * ```
 */

import { Box, Typography, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface TableDensitySettingProps {
  tableDensity: string;
  onChange: (newDensity: 'compact' | 'comfortable') => void;
}

export default function TableDensitySetting({
  tableDensity,
  onChange,
}: TableDensitySettingProps) {
  const { t } = useTranslation(['common']);

  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.75 }}>
        {t('appearance.density')}
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
            {t('appearance.standard')}
          </Typography>
        </ToggleButton>
        <ToggleButton value="compact">
          <Typography variant="caption">
            {t('appearance.compact')}
          </Typography>
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
}
