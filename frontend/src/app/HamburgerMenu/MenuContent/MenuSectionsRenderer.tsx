/**
 * @file MenuSectionsRenderer.tsx
 * @module app/HamburgerMenu/MenuContent/MenuSectionsRenderer
 *
 * @summary
 * Renders all menu sections with dividers between them.
 * Separates menu content rendering from menu state management.
 *
 * @example
 * ```tsx
 * <MenuSectionsRenderer
 *   themeMode="dark"
 *   onThemeModeChange={handleTheme}
 *   locale="en"
 *   onLocaleChange={handleLocale}
 *   onClose={handleClose}
 * />
 * ```
 */

import { Box, Divider } from '@mui/material';
import ProfileMenuSection from '../ProfileMenuSection';
import AppearanceMenuSection from '../AppearanceMenuSection';
import LanguageRegionMenuSection from '../LanguageRegionMenuSection';
import NotificationsMenuSection from '../NotificationsMenuSection';
import HelpDocsMenuSection from '../HelpDocsMenuSection';
import SystemInfoMenuSection from '../SystemInfoMenuSection';
import type { SupportedLocale } from '../../../theme';

interface MenuSectionsRendererProps {
  /** Current theme mode (light or dark) */
  themeMode: 'light' | 'dark';

  /** Callback when theme mode changes */
  onThemeModeChange: (mode: 'light' | 'dark') => void;

  /** Current locale setting */
  locale: SupportedLocale;

  /** Callback when locale changes */
  onLocaleChange: (locale: SupportedLocale) => void;

  /** Callback to close menu */
  onClose: () => void;
}

/**
 * Menu sections renderer component.
 *
 * Orchestrates rendering of all menu sections with dividers.
 * Handles section layout and spacing consistently.
 *
 * @param props - Component props
 * @returns JSX element rendering all menu sections
 */
export default function MenuSectionsRenderer({
  themeMode,
  onThemeModeChange,
  locale,
  onLocaleChange,
  onClose,
}: MenuSectionsRendererProps) {
  return (
    <>
      {/* Profile Section */}
      <Box onClick={onClose}>
        <ProfileMenuSection />
      </Box>

      <Divider />

      {/* Appearance Section */}
      <Box onClick={onClose}>
        <AppearanceMenuSection themeMode={themeMode} onThemeModeChange={onThemeModeChange} />
      </Box>

      <Divider />

      {/* Language & Region Section */}
      <Box onClick={onClose}>
        <LanguageRegionMenuSection locale={locale} onLocaleChange={onLocaleChange} />
      </Box>

      <Divider />

      {/* Notifications Section */}
      <Box onClick={onClose}>
        <NotificationsMenuSection />
      </Box>

      <Divider />

      {/* Help & Docs Section */}
      <Box onClick={onClose}>
        <HelpDocsMenuSection />
      </Box>

      <Divider />

      {/* System Info Section */}
      <Box onClick={onClose}>
        <SystemInfoMenuSection />
      </Box>

      <Divider />
    </>
  );
}
