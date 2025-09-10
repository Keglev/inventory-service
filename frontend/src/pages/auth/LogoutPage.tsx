/**
 * @file LogoutPage.tsx
 * @description
 * Protected route that performs logout:
 *  - POST /api/auth/logout (idempotent; ignores errors)
 *  - Clears React Query caches and AuthContext
 *  - Redirects user to `/logout-success`
 *
 * @enterprise
 * - Keeps logout side effects separate from the confirmation page.
 * - Ensures navigation flows are consistent whether logout is manual or automatic.
 */

import * as React from 'react';
import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import httpClient from '../../api/httpClient';
import { useAuth } from '../../context/useAuth';

const LogoutPage: React.FC = () => {
  const { logout } = useAuth();
  const queryClient = useQueryClient();
  const [done, setDone] = React.useState(false);

  useEffect(() => {
    (async () => {
      try {
        await httpClient.post('/api/auth/logout');
      } catch {
        // Intentionally ignore errors; logout is idempotent
      } finally {
        queryClient.clear(); // clear cached queries
        logout();            // clear auth context
        setDone(true);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (done) return <Navigate to="/logout-success" replace />;
  return null;
  // Immediately redirect to confirmation page.
  return <Navigate to="/logout-success" replace />;
};

export default LogoutPage;
