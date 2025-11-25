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
import Footer from './app/Footer';

export default function App() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      <AppRouter />
      <Footer />
    </Box>
  );
}


