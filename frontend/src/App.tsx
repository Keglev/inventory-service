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
 */

import { Box } from '@mui/material';
import AppRouter from './routes/AppRouter';
import { SettingsProvider } from './context/settings/SettingsContext';
import { HelpProvider } from './context/help/HelpContext';

export default function App() {
  return (
    <HelpProvider>
      <SettingsProvider>
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
          <AppRouter />
        </Box>
      </SettingsProvider>
    </HelpProvider>
  );
}
