/**
 * @file NotificationsMenuSection.tsx
 * @module app/layout/header/notifications/NotificationsMenuSection
 *
 * @summary
 * Content of the notification bell's popover: a loading state, the low-stock
 * alert with its count, or the all-clear message.
 *
 * @enterprise
 * - Reads the count from useDashboardMetrics, the query the dashboard KPI card
 *   uses, so the bell and the card cannot disagree and share one request.
 * - The bell is its only consumer.
 */
import { useDashboardMetrics } from '../../../../api/analytics/hooks/useDashboardMetrics';
import AllClearNotificationSection from './AllClearNotificationSection';
import LowStockAlertSection from './LowStockAlertSection';
import NotificationLoadingState from './NotificationLoadingState';

export default function NotificationsMenuSection({ onNavigate }: { onNavigate?: () => void } = {}) {
  const q = useDashboardMetrics();

  const lowStockCount = q.data?.lowStockCount ?? 0;
  const hasLowStock = !q.isLoading && lowStockCount > 0;

  if (q.isLoading) {
    return <NotificationLoadingState />;
  }

  return hasLowStock ? (
    <LowStockAlertSection lowStockCount={lowStockCount} onShowAll={onNavigate} />
  ) : (
    <AllClearNotificationSection />
  );
}
