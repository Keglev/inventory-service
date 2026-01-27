/**
 * @file PublicShellHeader.tsx
 * @description
 * Fixed header for public shell with app title and control buttons.
 * Thin orchestrator delegating to ThemeToggle and LanguageToggle components.
 *
 * @enterprise
 * - Fixed positioning at top of viewport (zIndex management)
 * - Primary color AppBar with Toolbar layout
 * - Responsive title and icon buttons
 * - Delegates theme and language toggling to sub-components
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
  /** Application title to display in header */
  appTitle: string;
  /** Current theme mode */
  themeMode: 'light' | 'dark';
  /** Callback to toggle theme mode */
  onThemeToggle: () => void;
  /** Current locale */
  locale: SupportedLocale;
  /** Callback to toggle language/locale */
  onLocaleToggle: () => void;
  /** Tooltip text for language toggle */
  languageTooltip: string;
}

/**
 * PublicShellHeader component (thin orchestrator)
 * @param appTitle - Application title
 * @param themeMode - Current theme mode
 * @param onThemeToggle - Theme toggle callback
 * @param locale - Current locale
 * @param onLocaleToggle - Locale toggle callback
 * @param languageTooltip - Language tooltip text
 * @returns Fixed AppBar header with theme and language controls
 */
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
      {/* Logo/Title */}
      <Typography variant="h6" sx={{ fontWeight: 700, flex: 1 }}>
        {appTitle}
      </Typography>

      {/* Control buttons container */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {/* Theme toggle */}
        <ThemeToggle themeMode={themeMode} onToggle={onThemeToggle} onThemeToggle={onThemeToggle} />

        {/* Language toggle */}
        <LanguageToggle locale={locale} onToggle={onLocaleToggle} tooltip={languageTooltip} />
      </Box>
    </Toolbar>
  </AppBar>
);

export default PublicShellHeader;
