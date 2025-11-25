/**
 * @file App.tsx
 * @description
 * Root application component. Delegates routing to `AppRouter` and includes the
 * global Footer (outside AppShell). Flex layout ensures footer stays at bottom.
 *
 * @layout
 * - Container: flex column, full viewport height
 * - AppRouter (routes): flex-grow to fill available space
 * - Footer: fixed at bottom, visible on all pages
 */

import AppRouter from './routes/AppRouter';

export default function App() {
  return <AppRouter />;
}


