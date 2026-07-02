/**
 * @file NotificationsMenuSection.tsx
 * @module app/HamburgerMenu/NotificationsMenuSection
 *
 * @summary
 * Notification section coordinator; reads lowStockCount from useDashboardMetrics
 * and renders one of three states: loading skeleton, low-stock alert, or all-clear.
 *
 * @enterprise
 * Data origin: api/analytics/hooks (useDashboardMetrics); only .data?.lowStockCount
 * is consumed. Mounted exclusively by MenuContent/MenuSectionsRenderer.
 * Composes the NotificationSettings/* components rather than reimplementing their JSX.
 */

import { useDashboardMetrics } from '../../api/analytics/hooks';
import AllClearNotificationSection from './NotificationSettings/AllClearNotificationSection';
import LowStockAlertSection from './NotificationSettings/LowStockAlertSection';
import NotificationLoadingState from './NotificationSettings/NotificationLoadingState';

export default function NotificationsMenuSection() {
  const q = useDashboardMetrics();

  const lowStockCount = q.data?.lowStockCount ?? 0;
  const hasLowStock = !q.isLoading && lowStockCount > 0;

  if (q.isLoading) {
    return <NotificationLoadingState />;
  }

  return hasLowStock ? (
    <LowStockAlertSection lowStockCount={lowStockCount} />
  ) : (
    <AllClearNotificationSection />
  );
}
