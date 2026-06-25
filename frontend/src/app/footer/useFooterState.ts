/**
 * @file useFooterState.ts
 * @module app/footer/useFooterState
 *
 * @summary
 * Custom hook for managing footer state and health monitoring.
 * Encapsulates footer state (details collapse) and health status data.
 *
 * @enterprise
 * - Owns footer state (details collapse) + metadata composition; the presentational
 *   footer components receive everything as props and own no state.
 * - `health` is read from useHealthCheck (features/health) — footer consumes health
 *   state, it does not own it (correct app -> features direction).
 * - Build metadata below is HARDCODED, not build-injected (see config comment).
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useHealthCheck } from '../../features/health';

/**
 * Footer configuration interface.
 */
interface FooterConfig {
  appVersion: string;
  buildId: string;
  environment: string;
  currentLanguage: string;
  region: string;
}

/**
 * Hook for managing footer state and configuration.
 *
 * Provides footer state (details open/close), health status, and metadata.
 * Integrates with i18n for localization and useHealthCheck for system monitoring.
 *
 * @returns Object containing footer state, config, and callbacks
 *
 * @example
 * ```tsx
 * const { detailsOpen, toggleDetails, health, config } = useFooterState();
 * ```
 */
export function useFooterState() {
  const { i18n } = useTranslation(['common']);
  const { health } = useHealthCheck();

  // Footer details collapse state
  const [detailsOpen, setDetailsOpen] = React.useState(false);

  /**
   * Toggle footer details panel open/close.
   */
  const toggleDetails = () => {
    setDetailsOpen((prev) => !prev);
  };

  // WHY: build metadata is hardcoded — no build-time source wired (package.json=0.0.0,
  //      no vite define / import.meta.env for version). currentLanguage is the only live
  //      value (derived from i18n.language); region is a static 'DE'.
  // BUCKET: inject appVersion/buildId/environment from build-time env
  //         (vite define + git SHA + package version) (CB-APP1)
  const config: FooterConfig = {
    appVersion: '1.0.0',
    buildId: '4a9c12f',
    environment: 'Production (Koyeb)',
    currentLanguage: i18n.language.split('-')[0].toUpperCase(),
    region: 'DE',
  };

  return {
    detailsOpen,
    toggleDetails,
    health,
    config,
  };
}
