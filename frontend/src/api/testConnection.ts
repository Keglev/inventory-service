import httpClient from './httpClient';

/**
 * Calls the backend health check endpoint to confirm database connectivity.
 *
 * @returns A simple status string ("OK" or error).
 */
export const testConnection = async (): Promise<string> => {
  const response = await httpClient.get('/health/db');
  const data = response.data;

  if (data.status === 'UP') {
    return 'OK';
  } else {
    return 'Database unreachable';
  }
};

