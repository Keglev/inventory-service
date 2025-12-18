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

// Side-effect import: initializes i18n (language detection + resources + persistence).
// IMPORTANT: Must be imported before any component that calls `useTranslation()`.
import './i18n';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App';
import AuthProvider from './context/auth/AuthProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Global CSS entry. Keep `index.css` minimal; it should only import `styles/global.css`.
import './index.css';

// React Query client instance. Shared across the app via context provider.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // sensible defaults
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 60_000,
    },
  },
});

/**
 * DOM container root element. The exclamation mark (`!`) asserts the element exists.
 * If you change your index.html mount point, reflect it here as well.
 */
const root = document.getElementById('root')!;

/**
 * Ensure SPA routing stays in sync even if some code calls
 * `window.history.pushState/replaceState` directly (outside React Router).
 *
 * React Router updates its state when navigation goes through its APIs.
 * Direct calls to the History API do not trigger `popstate`, so the router
 * may not re-render even though the URL changes.
 */
function installHistoryLocationChangePatch() {
  const w = window as unknown as {
    __sspHistoryPatched?: boolean;
  };

  if (w.__sspHistoryPatched) return;
  w.__sspHistoryPatched = true;

  const originalPushState = window.history.pushState;
  const originalReplaceState = window.history.replaceState;

  const preserveReactRouterHistoryState = (nextState: unknown) => {
    const current = window.history.state as unknown;
    const isRRState =
      !!current &&
      typeof current === 'object' &&
      'idx' in (current as Record<string, unknown>) &&
      'key' in (current as Record<string, unknown>);

    if (!isRRState) return nextState;

    // If some code calls replaceState/pushState with null/undefined, keep RR state.
    if (nextState == null) {
      try {
        if (localStorage.getItem('debugRouting') === '1') {
          console.debug(
            '[history] preserving router state (nextState is nullish)',
            '\n',
            new Error().stack
          );
        }
      } catch {
        // ignore
      }
      return current;
    }

    // If caller provides an object without idx/key, merge them in to avoid corrupting router history.
    if (typeof nextState === 'object') {
      const ns = nextState as Record<string, unknown>;
      const hasIdx = 'idx' in ns;
      const hasKey = 'key' in ns;
      if (!hasIdx || !hasKey) {
        const cs = current as Record<string, unknown>;
        const merged = { ...ns } as Record<string, unknown>;
        if (!hasIdx) merged.idx = cs.idx;
        if (!hasKey) merged.key = cs.key;
        if (!('usr' in merged) && 'usr' in cs) merged.usr = cs.usr;

        try {
          if (localStorage.getItem('debugRouting') === '1') {
            console.debug(
              '[history] merged router keys into history.state',
              '\n',
              new Error().stack
            );
          }
        } catch {
          // ignore
        }

        return merged;
      }
    }

    return nextState;
  };

  const notify = () => {
    try {
      window.dispatchEvent(new PopStateEvent('popstate'));
    } catch {
      // no-op: environments without PopStateEvent constructor
      window.dispatchEvent(new Event('popstate'));
    }
  };

  window.history.pushState = function pushStatePatched(...args) {
    const nextArgs = [...args] as unknown[];
    nextArgs[0] = preserveReactRouterHistoryState(nextArgs[0]);
    const result = originalPushState.apply(this, nextArgs as never);
    notify();
    return result;
  };

  window.history.replaceState = function replaceStatePatched(...args) {
    const nextArgs = [...args] as unknown[];
    nextArgs[0] = preserveReactRouterHistoryState(nextArgs[0]);
    const result = originalReplaceState.apply(this, nextArgs as never);
    notify();
    return result;
  };
}

installHistoryLocationChangePatch();

/**
 * Debug-only: audit popstate listener registration/removal.
 * Helps identify code that removes React Router's internal popstate handler.
 */
function installPopstateListenerAudit() {
  try {
    if (localStorage.getItem('debugRouting') !== '1') return;
  } catch {
    return;
  }

  const w = window as unknown as { __sspPopstateAuditInstalled?: boolean };
  if (w.__sspPopstateAuditInstalled) return;
  w.__sspPopstateAuditInstalled = true;

  const originalAdd = window.addEventListener;
  const originalRemove = window.removeEventListener;

  window.addEventListener = ((...args: Parameters<typeof window.addEventListener>) => {
    const [type, listener] = args;
    if (type === 'popstate') {
      console.debug('[popstate] add', listener, '\n', new Error().stack);
    }
    return originalAdd.apply(window, args);
  }) as typeof window.addEventListener;

  window.removeEventListener = ((...args: Parameters<typeof window.removeEventListener>) => {
    const [type, listener] = args;
    if (type === 'popstate') {
      console.debug('[popstate] remove', listener, '\n', new Error().stack);
    }
    return originalRemove.apply(window, args);
  }) as typeof window.removeEventListener;
}

installPopstateListenerAudit();

/**
 * Debug-only: log global runtime errors that might prevent React from committing
 * the new route tree (which can look like "URL changes but UI is stuck").
 */
function installGlobalErrorAudit() {
  try {
    if (localStorage.getItem('debugRouting') !== '1') return;
  } catch {
    return;
  }

  const w = window as unknown as { __sspGlobalErrorAuditInstalled?: boolean };
  if (w.__sspGlobalErrorAuditInstalled) return;
  w.__sspGlobalErrorAuditInstalled = true;

  window.addEventListener('error', (ev) => {
    console.debug('[global] error', ev.message, ev.error);
  });

  window.addEventListener('unhandledrejection', (ev) => {
    console.debug('[global] unhandledrejection', ev.reason);
  });
}

installGlobalErrorAudit();

// Optional: enable verbose routing logs via localStorage.debugRouting = '1'
if (localStorage.getItem('debugRouting') === '1') {
  window.addEventListener('popstate', () => {
    console.debug('[routing] popstate', window.location.pathname + window.location.search);
  });
}

// In development, React.StrictMode intentionally double-invokes certain lifecycles
// to surface side-effects. This is expected. Do not remove unless you have a
// measured reason (e.g., performance profiling in production builds).
ReactDOM.createRoot(root).render(
  <React.StrictMode>
    {/* Client-side routing. For server deployments, ensure the backend serves index.html for unknown routes. */}
    <BrowserRouter>
    {/* Provide React Query context so useQueryClient() works in LogoutPage */}
      <QueryClientProvider client={queryClient}>
        {/* Auth context (session state, user profile, guards). Placed high to be available to routes/shell. */}
        <AuthProvider>
          {/* App component composes routes and the application shell. */}
          <App />
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);

