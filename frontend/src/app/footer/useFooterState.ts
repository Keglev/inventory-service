/**
 * @file useFooterState.ts
 * @module app/footer/useFooterState
 *
 * @summary
 * Custom hook composing footer data: system health and build metadata.
 *
 * @enterprise
 * - The footer is stateless (details panel removed); this hook
 *   only composes data for the presentational components.
 * - `health` is read from useHealthCheck (features/health) — footer consumes
 *   health state, it does not own it (correct app -> features direction).
 * - Build metadata comes exclusively from config/appMeta (vite define /
 *   Docker build-args); currentLanguage is derived live from i18n.language.
 */

import { useTranslation } from 'react-i18next';
import { useHealthCheck } from '../../features/health/hooks/useHealthCheck';
import { APP_ENVIRONMENT, APP_VERSION, BUILD_ID } from '../../config/appMeta';

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
 * Hook composing footer data.
 *
 * Provides system health and build/locale metadata for the compact footer bar.
 *
 * @returns Object containing health state and footer config
 */
export function useFooterState() {
  const { i18n } = useTranslation(['common']);
  const { health } = useHealthCheck();

  const config: FooterConfig = {
    appVersion: APP_VERSION,
    buildId: BUILD_ID,
    environment: APP_ENVIRONMENT,
    currentLanguage: i18n.language.split('-')[0].toUpperCase(),
    region: 'DE',
  };

  return {
    health,
    config,
  };
}
