import httpClient from './httpClient';

/**
 * Calls a cheap health endpoint to confirm DB connectivity.
 * Returns true for HTTP 200; otherwise false.
 */
export async function testConnection(): Promise<boolean> {
  try {
    const res = await httpClient.get("/health/db");
    return res.status === 200;
  } catch {
    return false;
  }
}

