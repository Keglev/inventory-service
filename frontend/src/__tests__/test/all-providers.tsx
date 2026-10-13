/**
 * @file all-providers.tsx
 * @module __tests__/test/all-providers
 *
 * @description
 * Test-only provider composition root used by `renderWithProviders`.
 *
 * @responsibility
 * - Centralize routing + React Query providers for consistent test setup.
 * - Configure React Query for deterministic tests (no retries, no caching between tests;
 *   the cache survives a rerender within one test).
 *
 * @out_of_scope
 * - App-level provider wiring (belongs in src/app).
 * - Domain fixtures and per-suite helpers (belongs next to the tests).
 */

import { useState, type PropsWithChildren } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { createTestQueryClient } from '@/__tests__/test/queryClient';

export function AllProviders({ children }: PropsWithChildren) {
  // One client per mounted provider: a rerender keeps the cache, a new render()
  // mounts a new provider and so starts empty. gcTime 0 drops unobserved data.
  const [queryClient] = useState(() => createTestQueryClient({ gcTime: 0 }));

  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}
