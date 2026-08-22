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
    if (!alarm.enabled || !alarm.time || !/^\d{1,2}:\d{2}$/.test(alarm.time)) {
      await this.cancelAlarmNotification(alarm.id);
      return;
    }

    const [h, m] = alarm.time.split(':').map(Number);
    if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) {
      await this.cancelAlarmNotification(alarm.id);
      return;
    }

    const now = new Date();
    const currentDay = now.getDay();
    const currentMin = now.getHours() * 60 + now.getMinutes();
    const alarmMin = h * 60 + m;

    const days = (alarm.days && alarm.days.length > 0 ? alarm.days : [0, 1, 2, 3, 4, 5, 6]).map(Number);
    let dayDiff = 0;
    let found = false;

    for (let offset = 0; offset < 7; offset++) {
      const candidateDay = (currentDay + offset) % 7;
      if (days.includes(candidateDay)) {
        if (offset === 0 && alarmMin <= currentMin) {
          continue; // Already passed today, look for next day
        }
        dayDiff = offset;
        found = true;
        break;
      }
    }

    if (!found) {
      dayDiff = 7;
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
