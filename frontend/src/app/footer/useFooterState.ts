/**
 * @file useFooterState.ts
 * @module app/footer/useFooterState
 *
 * @summary
 * Custom hook for managing footer state and health monitoring.
 * Encapsulates footer state (details collapse) and health status data.
 *
 * @enterprise
 * - Separates footer state management from UI components
 * - Integrates with useHealthCheck hook for health monitoring
 * - Provides localization metadata (language, region)
 * - Type-safe footer configuration
 * - Full TypeDoc coverage for all exported functions
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

  /**
   * Footer configuration extracted from i18n and hardcoded values.
   */
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
