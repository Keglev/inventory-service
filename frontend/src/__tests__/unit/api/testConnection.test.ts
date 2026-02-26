/**
 * @file testConnection.test.ts
 * @module tests/unit/api/testConnection
 * @what_is_under_test testConnection / checkSession
 * @responsibility
 * Guarantees health-check and session-check contracts: fixed route wiring and deterministic
 * boolean/null return surfaces on both success and failure.
 * @out_of_scope
 * Auth/session backend behavior (cookie issuance, expiry policies, and server-side middleware).
 * @out_of_scope
 * HTTP client behavior (interceptors, retries/timeouts, and transport concerns).
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { testConnection, checkSession, type AppUserProfile } from '@/api/testConnection';
import httpClient from '@/api/httpClient';

vi.mock('@/api/httpClient');

describe('testConnection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('testConnection()', () => {
    describe('success paths', () => {
      it('returns true when health check succeeds', async () => {
        vi.mocked(httpClient.get).mockResolvedValue({ status: 200, data: {} });

        const result = await testConnection();

        expect(result).toBe(true);
        expect(httpClient.get).toHaveBeenCalledWith('/api/health/db');
      });
    });

    describe('failure paths', () => {
      it('returns false when the request rejects', async () => {
        vi.mocked(httpClient.get).mockRejectedValue(new Error('Network error'));

        const result = await testConnection();

        expect(result).toBe(false);
      });

      it('returns false when the server reports a non-200 response', async () => {
        vi.mocked(httpClient.get).mockRejectedValue({ response: { status: 500 } });

        const result = await testConnection();

        expect(result).toBe(false);
      });
    });
  });

  describe('checkSession()', () => {
    const mockUser: AppUserProfile = {
      id: '123',
      fullName: 'Test User',
      email: 'test@example.com',
      role: 'USER',
    };

    describe('success paths', () => {
      it('returns the user profile when the session is valid', async () => {
        vi.mocked(httpClient.get).mockResolvedValue({ data: mockUser, status: 200 });

        const result = await checkSession();

        expect(result).toEqual(mockUser);
        expect(httpClient.get).toHaveBeenCalledWith('/api/me');
      });
    });

    describe('failure paths', () => {
      it('returns null when the session is invalid (401)', async () => {
        vi.mocked(httpClient.get).mockRejectedValue({ response: { status: 401 } });

        const result = await checkSession();

        expect(result).toBeNull();
      });

      it('returns null on request failures', async () => {
        vi.mocked(httpClient.get).mockRejectedValue(new Error('Network error'));

        const result = await checkSession();

        expect(result).toBeNull();
      });
    });
  });
});
