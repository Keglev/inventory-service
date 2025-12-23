/**
 * @file LanguageToggle.tsx
 * @description
 * Language toggle button (DE/EN) for the public shell header.
 * Displays flag icon for current language and triggers language change.
 *
 * @enterprise
 * - Flag icons for visual language indication
 * - Clean MUI IconButton with accessibility
 * - Responsive icon sizing
 * - Integrates with i18next and toast notifications
 *
 * @example
 * ```tsx
 * <LanguageToggle
 *   locale="de"
 *   onToggle={() => toggleLanguage()}
 *   tooltip={t('actions.toggleLanguage')}
 * />
 * ```
 */
import * as React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import type { SupportedLocale } from '../../../theme';

const DE_FLAG = '/flags/de.svg';
const US_FLAG = '/flags/us.svg';

interface LanguageToggleProps {
  /** Current locale: 'de' or 'en' */
  locale: SupportedLocale;
  /** Callback when toggle is clicked */
  onToggle: () => void;
  /** Tooltip text for accessibility */
  tooltip: string;
}

/**
 * LanguageToggle component
 * @param locale - Current locale ('de' | 'en')
 * @param onToggle - Callback function to toggle language
 * @param tooltip - Accessibility tooltip text
 * @returns Language toggle button with flag icon
 */
const LanguageToggle: React.FC<LanguageToggleProps> = ({ locale, onToggle, tooltip }) => (
  <Tooltip title={tooltip}>
    <IconButton onClick={onToggle}>
      <img
        src={locale === 'de' ? DE_FLAG : US_FLAG}
        alt={locale === 'de' ? 'Deutsch' : 'English'}
        width={20}
        height={20}
      />
    </IconButton>
  </Tooltip>
);

export default LanguageToggle;
