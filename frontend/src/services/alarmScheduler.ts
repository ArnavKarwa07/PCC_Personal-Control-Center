import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import type { Alarm, Reminder } from '../types';

function fnv1aHash(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

function alarmIdToNumericId(strId: string): number {
  return 100000000 + (fnv1aHash(strId) % 100000000);
}

function reminderIdToNumericId(strId: string): number {
  return 200000000 + (fnv1aHash(strId) % 100000000);
}

const activeTauriTimers = new Map<string, any>();

function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

export const alarmScheduler = {
  async init(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await LocalNotifications.createChannel({
        id: 'pcc_alarms_channel',
        name: 'PCC Alarms & Reminders',
        description: 'High priority notifications for scheduled wake alarms and urgent reminders',
        importance: 5, // MAX importance
        visibility: 1, // PUBLIC
        vibration: true,
        sound: 'alarm.wav',
      });
    } catch (err) {
      console.warn('Failed to create local notification channel:', err);
    }
  },

  async scheduleAlarmNotification(alarm: Alarm): Promise<void> {
    if (!alarm.enabled) {
      await this.cancelAlarmNotification(alarm.id);
      return;
    }

    const now = new Date();
    const [hours, minutes] = alarm.time.split(':').map(Number);
    const h = hours || 0;
    const m = minutes || 0;

    let dayDiff = 0;
    const alarmTimeToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0, 0);

    if (alarmTimeToday.getTime() <= now.getTime()) {
      dayDiff = 1;
    }

    const targetDate = new Date();
    targetDate.setDate(now.getDate() + dayDiff);
    targetDate.setHours(h, m, 0, 0);

    const notificationId = alarmIdToNumericId(alarm.id);

    if (Capacitor.isNativePlatform()) {
      try {
        await LocalNotifications.cancel({ notifications: [{ id: notificationId }] });
        await LocalNotifications.schedule({
          notifications: [
            {
              id: notificationId,
              title: `⏰ Alarm: ${alarm.label || 'PCC Alarm'}`,
              body: `It's ${alarm.time}! Tap to dismiss or snooze.`,
              schedule: { at: targetDate, allowWhileIdle: true },
              channelId: 'pcc_alarms_channel',
              actionTypeId: 'ALARM_ACTION',
              extra: { alarmId: alarm.id, type: 'alarm' },
            },
          ],
        });
      } catch (err) {
        console.warn('Failed to schedule native alarm notification:', err);
      }
    } else if (isTauri()) {
      try {
        if (activeTauriTimers.has(alarm.id)) {
          clearTimeout(activeTauriTimers.get(alarm.id));
          activeTauriTimers.delete(alarm.id);
        }

        const delay = targetDate.getTime() - Date.now();
        if (delay > 0) {
          const timer = setTimeout(async () => {
            try {
              const { sendNotification } = await import('@tauri-apps/plugin-notification');
              sendNotification({
                title: `⏰ Alarm: ${alarm.label || 'PCC Alarm'}`,
                body: `It's ${alarm.time}!`,
              });
            } catch (e) {
              console.warn('Tauri notification error:', e);
            }
            activeTauriTimers.delete(alarm.id);
          }, delay);
          activeTauriTimers.set(alarm.id, timer);
        }
      } catch (err) {
        console.warn('Failed to schedule Tauri alarm notification:', err);
      }
    }
  },

  async cancelAlarmNotification(alarmId: string): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      try {
        const id = alarmIdToNumericId(alarmId);
        await LocalNotifications.cancel({ notifications: [{ id }] });
      } catch (err) {
        console.warn('Failed to cancel native alarm notification:', err);
      }
    } else if (isTauri()) {
      if (activeTauriTimers.has(alarmId)) {
        clearTimeout(activeTauriTimers.get(alarmId));
        activeTauriTimers.delete(alarmId);
      }
    }
  },

  async scheduleReminderNotification(reminder: Reminder): Promise<void> {
    if (reminder.completed || !reminder.dueDate) return;

    const dueDate = new Date(reminder.dueDate);
    if (isNaN(dueDate.getTime()) || dueDate.getTime() <= Date.now()) return;

    const notificationId = reminderIdToNumericId(reminder.id);

    if (Capacitor.isNativePlatform()) {
      try {
        await LocalNotifications.cancel({ notifications: [{ id: notificationId }] });
        await LocalNotifications.schedule({
          notifications: [
            {
              id: notificationId,
              title: `📌 Reminder: ${reminder.title}`,
              body: reminder.notes || 'PCC Scheduled Reminder',
              schedule: { at: dueDate, allowWhileIdle: true },
              channelId: 'pcc_alarms_channel',
              extra: { reminderId: reminder.id, type: 'reminder' },
            },
          ],
        });
      } catch (err) {
        console.warn('Failed to schedule native reminder notification:', err);
      }
    }
  },

  async triggerWebNotification(title: string, body: string, tag?: string): Promise<void> {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          tag,
          icon: '/logo.png',
          requireInteraction: true,
        });
      } catch (err) {
        console.warn('Web notification trigger error:', err);
      }
    }
  },
};

alarmScheduler.init();
