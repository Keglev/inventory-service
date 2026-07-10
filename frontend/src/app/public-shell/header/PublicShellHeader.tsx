/**
 * @file PublicShellHeader.tsx
 * @module PublicShellHeader
 * @summary Fixed AppBar orchestrator for public-shell; delegates theme and
 * language toggling to ThemeToggle and LanguageToggle; owns no state.
 *
 * @enterprise
 * - Thin pass-through: all callbacks originate in AppPublicShell so the header
 *   has no local state and remains a pure layout component.
 *
 * @example
 * ```tsx
 * <PublicShellHeader
 *   appTitle="Smart Supply Pro"
 *   themeMode="light"
 *   onThemeToggle={() => setThemeMode(...)}
 *   locale="de"
 *   onLocaleToggle={() => toggleLocale()}
 *   languageTooltip={t('actions.toggleLanguage')}
 * />
 * ```
 */
import * as React from 'react';
import { AppBar, Toolbar, Typography, Box } from '@mui/material';
import type { SupportedLocale } from '../../../theme';
import ThemeToggle from './ThemeToggle';
import LanguageToggle from './LanguageToggle';

interface PublicShellHeaderProps {
  appTitle: string;
  themeMode: 'light' | 'dark';
  onThemeToggle: () => void;
  locale: SupportedLocale;
  onLocaleToggle: () => void;
  languageTooltip: string;
}

const PublicShellHeader: React.FC<PublicShellHeaderProps> = ({
  appTitle,
  themeMode,
  onThemeToggle,
  locale,
  onLocaleToggle,
  languageTooltip,
}) => (
  <AppBar position="fixed" color="primary" sx={{ width: '100%', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
    <Toolbar>
      <Typography variant="h6" sx={{ fontWeight: 700, flex: 1 }}>
        {appTitle}
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <ThemeToggle themeMode={themeMode} onToggle={onThemeToggle} />

        <LanguageToggle locale={locale} onToggle={onLocaleToggle} tooltip={languageTooltip} />
      </Box>
    </Toolbar>
  </AppBar>
);

export default PublicShellHeader;
