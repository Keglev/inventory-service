/**
 * @file queryClient.test.tsx
 * @module tests/test/queryClient
 * @testing Contract tests for the React Query test harness.
 * @description
 * Contract under test:
 * - AllProviders keeps one client for its lifetime, so a rerender keeps the
 *   cache, while two render() calls never share one.
 * - createTestQueryClient never retries, also when extra defaults are given.
 * - renderWithQueryClient and createQueryWrapper provide the client they are given.
 *
 * Siblings: example.test.tsx (render utilities).
 */

import { describe, expect, it, vi } from 'vitest';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { render, renderHook, screen, waitFor } from '@/__tests__/test/test-utils';
import {
  createQueryWrapper,
  createTestQueryClient,
  renderWithQueryClient,
} from '@/__tests__/test/queryClient';

function Probe({ queryFn, label = 'probe' }: { queryFn: () => Promise<string>; label?: string }) {
  const q = useQuery({ queryKey: ['probe'], queryFn });
  return <div>{q.isError ? `${label}:error` : `${label}:${q.data ?? 'loading'}`}</div>;
}

describe('AllProviders', () => {
  // A mounted query keeps the client it started with, so the loss shows only in a
  // component mounted after the rerender: it must find the cached data.
  it('keeps the cache for a component mounted after a rerender', async () => {
    const queryFn = vi.fn().mockResolvedValue('one');
    const { rerender } = render(<Probe queryFn={queryFn} />);
    await screen.findByText('probe:one');

    rerender(
      <>
        <Probe queryFn={queryFn} />
        <Probe queryFn={queryFn} label="late" />
      </>,
    );

    // Synchronous: the data comes from the cache, not from a refetch (stale data
    // still triggers one in the background, so the call count is not the proof).
    expect(screen.getByText('late:one')).toBeInTheDocument();
  });

  it('starts each render() with an empty cache', async () => {
    const queryFn = vi.fn().mockResolvedValue('one');
    const first = render(<Probe queryFn={queryFn} />);
    await screen.findByText('probe:one');
    first.unmount();

    render(<Probe queryFn={queryFn} />);

    expect(screen.getByText('probe:loading')).toBeInTheDocument();
    await screen.findByText('probe:one');
    expect(queryFn).toHaveBeenCalledTimes(2);
  });
});

describe('createTestQueryClient', () => {
  it('fails a rejected query without retrying', async () => {
    const queryFn = vi.fn().mockRejectedValue(new Error('down'));
    renderWithQueryClient(<Probe queryFn={queryFn} />);

    await screen.findByText('probe:error');
    expect(queryFn).toHaveBeenCalledTimes(1);
  });

  it('keeps retry off when extra query defaults are given', () => {
    const client = createTestQueryClient({ staleTime: 60_000 });

    expect(client.getDefaultOptions().queries).toMatchObject({ retry: false, staleTime: 60_000 });
  });
});

describe('renderWithQueryClient', () => {
  it('returns the client the rendered tree reads from', async () => {
    const { client } = renderWithQueryClient(<Probe queryFn={() => Promise.resolve('seen')} />);

    await waitFor(() => expect(client.getQueryData(['probe'])).toBe('seen'));
  });
});

describe('createQueryWrapper', () => {
  it('provides the given client to a hook', () => {
    const client = createTestQueryClient();

    const { result } = renderHook(() => useQueryClient(), { wrapper: createQueryWrapper(client) });

    expect(result.current).toBe(client);
  });
});
