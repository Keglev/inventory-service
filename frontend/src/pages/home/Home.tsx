/**
 * @file Home.tsx
 * @module pages/home/Home
 *
 * @summary
 * Public landing page at the root route (/). Three states:
 *  - Auth hydrating: centered spinner.
 *  - Authenticated: redirect to /dashboard with history replace.
 *  - Unauthenticated: marketing landing composed of hero, feature grid,
 *    how-it-works, engineering callout, and a closing call to action.
 *
 * @enterprise
 * - Orchestrator only: it owns auth gating and the two entry actions and passes
 *   them down; every section below is presentational, which keeps this file under
 *   the page size budget as the landing copy grows.
 * - Navigate replace on the authenticated branch so the root URL never accumulates
 *   in browser history once a session exists.
 * - Demo Mode is a read-only session started client-side via useAuth; the browser
 *   still performs live unauthenticated reads against the backend, which the API
 *   permits for the demo-readonly endpoints. It needs no provisioned account.
 * - The public shell supplies the header and footer, so this page renders content
 *   only and never duplicates chrome.
 *
 * @i18n
 * Section copy lives in the 'landing' namespace; this file holds no strings.
 */

import * as React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../../hooks/useAuth';
import HeroSection from './sections/HeroSection';
import FeatureGrid from './sections/FeatureGrid';
import HowItWorks from './sections/HowItWorks';
import EngineeringCallout from './sections/EngineeringCallout';
import FinalCta from './sections/FinalCta';

/**
 * Home component.
 * Routes the user based on auth state and renders the public landing page.
 */
const Home: React.FC = () => {
  const { user, loading, loginAsDemo } = useAuth();
  const navigate = useNavigate();

  const handleDemo = React.useCallback(() => {
    loginAsDemo();
    navigate('/dashboard', { replace: true });
  }, [loginAsDemo, navigate]);

  const handleSignIn = React.useCallback(() => {
    navigate('/login');
  }, [navigate]);

  // While auth state is hydrating, show a loading spinner.
  if (loading) {
    return (
      <Box sx={{ minHeight: '70vh', display: 'grid', placeItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  // If already authenticated, skip the landing page entirely.
  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 1, md: 2 } }}>
      <HeroSection onDemo={handleDemo} onSignIn={handleSignIn} />
      <FeatureGrid />
      <HowItWorks />
      <EngineeringCallout />
      <FinalCta onDemo={handleDemo} onSignIn={handleSignIn} />
    </Box>
  );
};

export default Home;
