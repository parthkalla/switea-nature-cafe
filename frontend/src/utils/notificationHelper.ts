/**
 * Browser Native Notification Helper
 * Handles Chrome / Android / Desktop OS-level notification permissions and alerts
 */

export const isNotificationSupported = (): boolean => {
  return typeof window !== 'undefined' && 'Notification' in window;
};

export const getNotificationPermission = (): NotificationPermission => {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
};

export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!isNotificationSupported()) return 'denied';
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      showOrderNotification('Notifications Enabled! 🎉', {
        body: 'You will receive instant alerts when your order status updates.',
        tag: 'welcome-notification',
      });
    }
    return permission;
  } catch (err) {
    console.warn('Error requesting notification permission:', err);
    return 'denied';
  }
};

export const showOrderNotification = (
  title: string,
  options?: {
    body?: string;
    icon?: string;
    badge?: string;
    tag?: string;
    data?: any;
  }
): Notification | null => {
  if (!isNotificationSupported()) return null;
  if (Notification.permission !== 'granted') return null;

  try {
    const notification = new Notification(title, {
      icon: options?.icon || '/images/roastfuze_coffee_cup.png',
      badge: options?.badge || '/images/roastfuze_coffee_cup.png',
      body: options?.body || 'Your order status has been updated.',
      tag: options?.tag || 'order-status',
      ...options,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return notification;
  } catch (err) {
    console.warn('Could not display system notification:', err);
    return null;
  }
};
