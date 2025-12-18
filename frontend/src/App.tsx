/**
 * @file App.tsx
 * @description
 * Root application component. Delegates routing to `AppRouter` and includes the
 * global Footer. Flex layout ensures footer stays at bottom on all pages.
 *
 * @layout
 * - Container: flex column, full viewport height
 * - AppRouter (routes): flex-grow to fill available space
 * - Footer: visible on all pages (login, dashboard, logout, etc.)
 */

import { Box } from '@mui/material';
import AppRouter from './routes/AppRouter';
import { AppFooter } from './app/footer';
import { SettingsProvider } from './context/settings/SettingsContext';
import { HelpProvider } from './context/help/HelpContext';
import HelpPanel from './components/help/HelpPanel';
import * as React from 'react';

// Debug-focused error boundary to surface render errors that can freeze routing.
class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    try {
      if (localStorage.getItem('debugRouting') === '1') {
        // eslint-disable-next-line no-console
        console.debug('[boundary] render error', error, info.componentStack);
      }
    } catch {
      // ignore
    }
  }

  render() {
    if (this.state.error) {
      return (
        <Box sx={{ p: 3 }}>
          <strong>Something went wrong.</strong>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{String(this.state.error)}</pre>
        </Box>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <HelpProvider>
      <SettingsProvider>
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
          <AppErrorBoundary>
            <AppRouter />
          </AppErrorBoundary>
          <AppFooter />
          <HelpPanel />
        </Box>
      </SettingsProvider>
    </HelpProvider>
  );
}


