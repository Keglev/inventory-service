/**
 * @file App.tsx
 * @description
 * Root application component. Delegates routing to `AppRouter`. The footer and
 * the help panel are rendered inside each shell (AppShell / AppPublicShell) so
 * they participate in the active MUI theme (the panel previously
 * mounted here, outside both ThemeProviders, and always rendered light).
 *
 * @layout
 * - Container: flex column, full viewport height
 * - AppRouter (routes): fills available space
 * - HelpProvider stays here: help state is global; only the themed panel
 *   rendering lives in the shells.
 * - ShellPreferencesProvider sits above the router so both shells share one
 *   language and theme state; each shell still applies the theme itself.
 */

import { Box } from '@mui/material';
import AppRouter from './routes/AppRouter';
import { SettingsProvider } from './context/settings/SettingsContext';
import { HelpProvider } from './context/help/HelpContext';
import { ShellPreferencesProvider } from './context/shellPreferences/ShellPreferencesContext';

export default function App() {
  return (
    <HelpProvider>
      <ShellPreferencesProvider>
        <SettingsProvider>
          <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
            <AppRouter />
          </Box>
        </SettingsProvider>
      </ShellPreferencesProvider>
    </HelpProvider>
  );
}
