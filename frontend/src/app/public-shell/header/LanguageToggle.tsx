/**
 * @file LanguageToggle.tsx
 * @module LanguageToggle
 * @summary Public-shell language toggle: a text button naming the language it
 * switches to; stateless, delegates the switch to its parent via onToggle.
 *
 * @enterprise
 * - The only quick language switch left (FW5 fork 2): public websites keep it in
 *   the header, while the app shell sets language in the settings dialog.
 * - Text, not a flag: flags stand for countries, not languages (W3C i18n).
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
import { Button, Tooltip } from '@mui/material';
import type { SupportedLocale } from '../../../theme';

interface LanguageToggleProps {
  locale: SupportedLocale;
  onToggle: () => void;
  tooltip: string;
}

// WHY: the button names the language it switches TO, in that language, and uses
// no flag (W3C i18n: flags stand for countries, not languages).
const LanguageToggle: React.FC<LanguageToggleProps> = ({ locale, onToggle, tooltip }) => {
  const target = locale === 'de' ? { code: 'en', label: 'English' } : { code: 'de', label: 'Deutsch' };
  return (
    // WHY: describeChild keeps the visible language name as the accessible name
    // (WCAG 2.5.3 label in name); the tooltip becomes the description.
    <Tooltip title={tooltip} describeChild>
      <Button color="inherit" onClick={onToggle} lang={target.code} sx={{ textTransform: 'none', fontWeight: 600, minWidth: 0 }}>
        {target.label}
      </Button>
    </Tooltip>
  );
};

export default LanguageToggle;
