/**
 * @file main.tsx
 * @description
 * Application entry point. Mounts the React tree, wires the top-level providers,
 * and ensures localization is initialized before any UI renders.
 *
 * @remarks
 * - Keep this file minimal and deterministic.
 * - Global CSS is imported via `index.css`, which in turn imports `styles/global.css`.
 * - i18n is initialized here (side-effect import) so any downstream `useTranslation()`
 *   calls in AppShell or pages can rely on an initialized i18next instance.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App';
import AuthProvider from './context/AuthProvider';

// Global CSS entry. Keep `index.css` minimal; it should only import `styles/global.css`.
import './index.css';

// Side-effect import: initializes i18n (language detection + resources + persistence).
// IMPORTANT: Must be imported before any component that calls `useTranslation()`.
import './i18n';

/**
 * DOM container root element. The exclamation mark (`!`) asserts the element exists.
 * If you change your index.html mount point, reflect it here as well.
 */
const root = document.getElementById('root')!;

// In development, React.StrictMode intentionally double-invokes certain lifecycles
// to surface side-effects. This is expected. Do not remove unless you have a
// measured reason (e.g., performance profiling in production builds).
ReactDOM.createRoot(root).render(
  <React.StrictMode>
    {/* Client-side routing. For server deployments, ensure the backend serves index.html for unknown routes. */}
    <BrowserRouter>
      {/* Auth context (session state, user profile, guards). Placed high to be available to routes/shell. */}
      <AuthProvider>
        {/* App component composes routes and the application shell. */}
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

