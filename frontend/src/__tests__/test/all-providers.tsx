/**
 * Test utilities and providers
 * Provides common testing helpers and wrapper components
 */
/* eslint-disable react-refresh/only-export-components */
import type { PropsWithChildren } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * Creates a new QueryClient instance for testing
 * Disables retries and caching for faster, more predictable tests
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
 * Provider wrapper for testing components that need routing and react-query
 */
export function AllProviders({ children }: PropsWithChildren) {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}
