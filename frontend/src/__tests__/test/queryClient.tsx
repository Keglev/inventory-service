/**
 * @file queryClient.tsx
 * @module __tests__/test/queryClient
 *
 * @description
 * The one React Query client factory and provider wrapper for specs.
 *
 * @responsibility
 * - Build clients that never retry, so a rejected request fails the query at once.
 * - Give hook and component specs a provider without re-implementing it per file.
 *
 * @out_of_scope
 * - Router and other app providers (AllProviders composes those).
 * - Caching behaviour of the production client (src/main.tsx owns it).
 */

import type { PropsWithChildren, ReactElement } from 'react';
import { QueryClient, QueryClientProvider, type DefaultOptions } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react';

type QueryDefaults = NonNullable<DefaultOptions['queries']>;

/**
 * Creates an isolated client; each spec or render gets its own cache.
 *
 * @param queries query defaults merged over `retry: false` (e.g. a staleTime)
 */
export function createTestQueryClient(queries: QueryDefaults = {}): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, ...queries },
      mutations: { retry: false },
    },
  });
}

/**
 * Wrapper for `renderHook` and `render`: one provider bound to one client, so a
 * rerender keeps the cache.
 *
 * @param client the client to provide; a fresh test client by default
 */
export function createQueryWrapper(client: QueryClient = createTestQueryClient()) {
  return function QueryWrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

/**
 * Renders `ui` inside a query provider and returns the client with the result,
 * for specs that seed or inspect the cache.
 *
 * @param ui      element under test
 * @param client  the client to provide; a fresh test client by default
 * @param options further render options (the wrapper is fixed)
 */
export function renderWithQueryClient(
  ui: ReactElement,
  client: QueryClient = createTestQueryClient(),
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  return { client, ...render(ui, { wrapper: createQueryWrapper(client), ...options }) };
}
