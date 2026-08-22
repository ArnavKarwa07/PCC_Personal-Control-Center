import { useEffect, useCallback } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { useAlarmStore } from '../stores/alarmStore';
import { useReminderStore } from '../stores/reminderStore';
import { useTaskStore } from '../stores/taskStore';
import { useNoteStore } from '../stores/noteStore';
import { useProjectStore } from '../stores/projectStore';
import { useCalendarStore } from '../stores/calendarStore';
import { useIdeaStore } from '../stores/ideaStore';

export function useAutoSync() {
  const fetchAlarms = useAlarmStore((s) => s.fetchAlarms);
  const fetchReminders = useReminderStore((s) => s.fetchReminders);
  const fetchTasks = useTaskStore((s) => s.fetchTasks);
  const fetchNotes = useNoteStore((s) => s.fetchNotes);
  const fetchProjects = useProjectStore((s) => s.fetchProjects);
  const fetchEvents = useCalendarStore((s) => s.fetchEvents);
  const fetchIdeas = useIdeaStore((s) => s.fetchIdeas);

  const syncAll = useCallback(async () => {
    try {
      await Promise.allSettled([
        fetchAlarms(),
        fetchReminders(),
        fetchTasks(),
        fetchNotes(),
        fetchProjects(),
        fetchEvents(),
        fetchIdeas(),
      ]);
    } catch (err) {
      console.warn('AutoSync error:', err);
    }
  }, [fetchAlarms, fetchReminders, fetchTasks, fetchNotes, fetchProjects, fetchEvents, fetchIdeas]);

  useEffect(() => {
    // Initial fetch on mount
    syncAll();

    // Foreground visibility change listener (Web / Desktop)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncAll();
      }
    };
    window.addEventListener('visibilitychange', handleVisibilityChange);

    // Native app resume listener (Android Capacitor)
    let isMounted = true;
    let appStateHandle: any = null;
    if (Capacitor.isNativePlatform()) {
      CapacitorApp.addListener('appStateChange', (state: { isActive: boolean }) => {
        if (state.isActive) {
          syncAll();
        }
      }).then((handle) => {
        if (!isMounted) {
          if (handle && typeof handle.remove === 'function') {
            handle.remove();
          }
        } else {
          appStateHandle = handle;
        }
      }).catch((err) => {
        console.warn('Failed to register native appStateChange listener:', err);
      });
    }

    // Periodic interval sync (every 60s)
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        syncAll();
      }
    }, 60000);

    return () => {
      isMounted = false;
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      if (appStateHandle && typeof appStateHandle.remove === 'function') {
        appStateHandle.remove();
      }
      clearInterval(interval);
    };
  }, [syncAll]);

  return { syncAll };
}
