/**
 * @file LanguageToggle.tsx
 * @module LanguageToggle
 * @summary Public-shell language toggle button (DE/EN); a stateless IconButton
 * that delegates locale state entirely to its parent via onToggle.
 *
 * @enterprise
 * - Distinct from the HamburgerMenu LanguageToggle twin: this component makes no
 *   i18n calls and owns no side-effects — the authenticated-shell twin calls
 *   i18next directly and manages its own toast. Do not merge until ST-APP4.
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
  locale: SupportedLocale;
  onToggle: () => void;
  tooltip: string;
}

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
