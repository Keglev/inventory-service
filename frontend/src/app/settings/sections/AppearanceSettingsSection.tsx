/**
 * @file AppearanceSettingsSection.tsx
 * @module app/settings/sections/AppearanceSettingsSection
 *
 * @summary
 * Appearance settings section component.
 * Manages table density preferences with radio button group.
 *
 * @enterprise
 * - Focused on single concern: table density management
 * - Type-safe density selection
 * - i18n support for labels and descriptions
 * - Consistent styling with settings form design
 * - Full TypeDoc coverage for appearance settings
 */

import {
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { TableDensity } from '../../../context/SettingsContext';

interface AppearanceSettingsSectionProps {
  /** Current table density value */
  tableDensity: TableDensity;

  /** Callback when table density changes */
  onTableDensityChange: (density: TableDensity) => void;
}

/**
 * Appearance settings section component.
 *
 * Provides table density selector with comfortable and compact options.
 * Isolated from other settings for independent testing and reuse.
 *
 * @param props - Component props
 * @returns JSX element rendering appearance settings controls
 *
 * @example
 * ```tsx
 * <AppearanceSettingsSection
 *   tableDensity="comfortable"
 *   onTableDensityChange={handleDensityChange}
 * />
 * ```
 */
export default function AppearanceSettingsSection({
  tableDensity,
  onTableDensityChange,
}: AppearanceSettingsSectionProps) {
  const { t } = useTranslation(['common']);

  return (
    <FormControl>
      <FormLabel sx={{ fontWeight: 600, mb: 1 }}>
        {t('settings.tableDensity', 'Table Density')}
      </FormLabel>
      <RadioGroup
        value={tableDensity}
        onChange={(e) => onTableDensityChange(e.target.value as TableDensity)}
      >
        <FormControlLabel
          value="comfortable"
          control={<Radio size="small" />}
          label={t('settings.tableDensity.comfortable', 'Comfortable')}
        />
        <FormControlLabel
          value="compact"
          control={<Radio size="small" />}
          label={t('settings.tableDensity.compact', 'Compact')}
        />
      </RadioGroup>
    </FormControl>
  );
}
