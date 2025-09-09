/**
 * @file App.tsx
 * @description
 * Root application component. Delegates routing to `AppRouter`. Keep this file
 * intentionally small—global providers (theme, query client) live higher in the tree
 * or inside AppShell to avoid tight coupling at the root.
 */

import AppRouter from './routes/AppRouter';

export default function App() {
  return <AppRouter />;
}


