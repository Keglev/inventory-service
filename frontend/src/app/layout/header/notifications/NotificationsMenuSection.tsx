import { useDashboardMetrics } from '../../api/analytics/hooks/useDashboardMetrics';
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
