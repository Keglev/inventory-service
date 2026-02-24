/**
 * @file all-providers.tsx
 * @module __tests__/test/all-providers
 *
 * @description
 * Test-only provider composition root used by `renderWithProviders`.
 *
 * @responsibility
 * - Centralize routing + React Query providers for consistent test setup.
 * - Configure React Query for deterministic tests (no retries, no caching between tests).
 *
 * @out_of_scope
 * - App-level provider wiring (belongs in src/app).
 * - Domain fixtures and per-suite helpers (belongs next to the tests).
 */

/* eslint-disable react-refresh/only-export-components */

import type { PropsWithChildren } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * Create a QueryClient configured for tests:
 * - No retries (fail fast)
 * - No cache persistence across tests
 */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

/**
 * Wrap the UI under test with all required providers.
 *
 * Note: We create a fresh QueryClient per render to ensure isolation between tests.
 */
export function AllProviders({ children }: PropsWithChildren) {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}