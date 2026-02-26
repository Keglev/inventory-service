/**
 * @file reactQueryCapture.ts
 * @module tests/unit/utils/reactQueryCapture
 * @what_is_under_test React Query `useQuery` config capture helpers
 * @responsibility
 * Provides small utilities to capture the config object passed to a mocked `useQuery` call so unit
 * tests can assert queryKey/enabled/queryFn wiring without re-implementing mocking boilerplate.
 * @out_of_scope
 * React Query runtime behavior (caching, retry/backoff, observers, and GC semantics).
 * @out_of_scope
 * Hook integration behavior (provider wiring and end-to-end data fetching).
 */

export type CapturedQueryConfig<TData = unknown> = {
  queryKey: unknown;
  queryFn: () => Promise<TData> | TData;
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
};

type UseQueryMock = {
  mockImplementation: (impl: (config: unknown) => unknown) => unknown;
};

export function arrangeUseQueryConfigCapture<TData>(
  useQueryMock: UseQueryMock,
  queryResult: unknown = { data: undefined },
) {
  let capturedConfig: CapturedQueryConfig<TData> | undefined;

  useQueryMock.mockImplementation((config: unknown) => {
    capturedConfig = config as CapturedQueryConfig<TData>;
    return queryResult;
  });

  return {
    queryResult,
    getConfig: () => {
      if (!capturedConfig) {
        throw new Error('Expected useQuery to be called and config captured.');
      }
      return capturedConfig;
    },
  };
}

export function arrangeUseQueryConfigCollector<TData>(
  useQueryMock: UseQueryMock,
  queryResult: unknown = { data: undefined },
) {
  const configs: CapturedQueryConfig<TData>[] = [];

  useQueryMock.mockImplementation((config: unknown) => {
    configs.push(config as CapturedQueryConfig<TData>);
    return queryResult;
  });

  return { configs, queryResult };
}
