/**
 * @file reactQueryTestUtils.tsx
 * @module __tests__/unit/utils/reactQueryTestUtils
 * @what_is_under_test createReactQueryWrapper test utility
 * @responsibility
 * - Provides a deterministic React Query provider wrapper for hook/unit tests
 * - Centralizes default query options so tests do not re-implement provider wiring
 * @out_of_scope
 * - Validation of React Query caching, garbage collection, or persistence semantics
 * - Verification of retry/backoff timing behavior beyond toggling the retry flag
 */

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

type CreateReactQueryWrapperOptions = {
  retry?: boolean;
};

export function createReactQueryWrapper(
  options: CreateReactQueryWrapperOptions = { retry: false }
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: options.retry ?? false,
      },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}
