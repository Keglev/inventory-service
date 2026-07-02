/**
 * @file App.tsx
 * @description
 * Root application component. Delegates routing to `AppRouter`. The footer is
 * rendered inside each shell (AppShell / AppPublicShell) so it participates in
 * the active MUI theme.
 *
 * @layout
 * - Container: flex column, full viewport height
 * - AppRouter (routes): flex-grow to fill available space
 */

import { Box } from '@mui/material';
import AppRouter from './routes/AppRouter';
import { SettingsProvider } from './context/settings/SettingsContext';
import { HelpProvider } from './context/help/HelpContext';
import HelpPanel from './components/help/HelpPanel';


export default function App() {
  return (
    <HelpProvider>
      <SettingsProvider>
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
            <AppRouter />
          <HelpPanel />
        </Box>
      </SettingsProvider>
    </HelpProvider>
  );
}


