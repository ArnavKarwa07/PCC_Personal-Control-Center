import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Geolocation } from '@capacitor/geolocation';

const isTauri = () => typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

export interface PermissionReport {
  notifications: 'granted' | 'denied' | 'prompt' | 'unsupported';
  location: 'granted' | 'denied' | 'prompt' | 'unsupported';
  exactAlarm: 'granted' | 'denied' | 'prompt' | 'unsupported';
}

export const permissionService = {
  async getPermissionStatus(): Promise<PermissionReport> {
    const isNative = Capacitor.isNativePlatform();
    let notifications: PermissionReport['notifications'] = 'prompt';
    let location: PermissionReport['location'] = 'prompt';
    let exactAlarm: PermissionReport['exactAlarm'] = 'unsupported';

    // Check Notifications
    try {
      if (isNative) {
        const status = await LocalNotifications.checkPermissions();
        notifications = status.display === 'granted' ? 'granted' : status.display === 'denied' ? 'denied' : 'prompt';
        exactAlarm = notifications;
      } else if (isTauri()) {
        const { isPermissionGranted } = await import('@tauri-apps/plugin-notification');
        const granted = await isPermissionGranted();
        notifications = granted ? 'granted' : 'prompt';
      } else if (typeof window !== 'undefined' && 'Notification' in window) {
        const perm = Notification.permission;
        notifications = perm === 'granted' ? 'granted' : perm === 'denied' ? 'denied' : 'prompt';
      } else {
        notifications = 'unsupported';
      }
    } catch (err) {
      console.warn('Error checking notification permissions:', err);
    }

    // Check Location
    try {
      if (isNative) {
        const status = await Geolocation.checkPermissions();
        location = status.location === 'granted' || status.coarseLocation === 'granted' ? 'granted' : status.location === 'denied' ? 'denied' : 'prompt';
      } else if (typeof window !== 'undefined' && navigator.geolocation) {
        if ('permissions' in navigator) {
          const perm = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
          location = perm.state === 'granted' ? 'granted' : perm.state === 'denied' ? 'denied' : 'prompt';
        } else {
          location = 'prompt';
        }
      } else {
        location = 'unsupported';
      }
    } catch (err) {
      console.warn('Error checking location permissions:', err);
    }

    return { notifications, location, exactAlarm };
  },

  async requestNotificationPermission(): Promise<boolean> {
    const isNative = Capacitor.isNativePlatform();
    try {
      if (isNative) {
        const result = await LocalNotifications.requestPermissions();
        return result.display === 'granted';
      } else if (isTauri()) {
        const { requestPermission, isPermissionGranted } = await import('@tauri-apps/plugin-notification');
        let granted = await isPermissionGranted();
        if (!granted) {
          const permission = await requestPermission();
          granted = permission === 'granted';
        }
        return granted;
      } else if (typeof window !== 'undefined' && 'Notification' in window) {
        const perm = await Notification.requestPermission();
        return perm === 'granted';
      }
    } catch (err) {
      console.warn('Failed to request notification permission:', err);
    }
    return false;
  },

  async requestLocationPermission(): Promise<boolean> {
    const isNative = Capacitor.isNativePlatform();
    try {
      if (isNative) {
        const req = await Geolocation.requestPermissions();
        return req.location === 'granted' || req.coarseLocation === 'granted';
      } else if (typeof window !== 'undefined' && navigator.geolocation) {
        return new Promise((resolve) => {
          let finished = false;
          const timer = setTimeout(() => {
            if (!finished) {
              finished = true;
              resolve(false);
            }
          }, 3000);

          navigator.geolocation.getCurrentPosition(
            () => {
              if (!finished) {
                finished = true;
                clearTimeout(timer);
                resolve(true);
              }
            },
            () => {
              if (!finished) {
                finished = true;
                clearTimeout(timer);
                resolve(false);
              }
            },
            { timeout: 3000, enableHighAccuracy: false }
          );
        });
      }
    } catch (err) {
      console.warn('Failed to request location permission:', err);
    }
    return false;
  },

  async requestAllPermissions(): Promise<PermissionReport> {
    try {
      await this.requestNotificationPermission();
    } catch (e) {
      console.warn('Notification permission error:', e);
    }
    try {
      await this.requestLocationPermission();
    } catch (e) {
      console.warn('Location permission error:', e);
    }
    return this.getPermissionStatus();
  },
};

