import { useEffect, useCallback, useState } from "react";
import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { useAlarmStore } from "../stores/alarmStore";
import { useReminderStore } from "../stores/reminderStore";
import { useTaskStore } from "../stores/taskStore";
import { useNoteStore } from "../stores/noteStore";
import { useProjectStore } from "../stores/projectStore";
import { useCalendarStore } from "../stores/calendarStore";
import { useIdeaStore } from "../stores/ideaStore";
import { syncQueue } from "../services/syncQueue";

export function useAutoSync() {
  const fetchAlarms = useAlarmStore((s) => s.fetchAlarms);
  const fetchReminders = useReminderStore((s) => s.fetchReminders);
  const fetchTasks = useTaskStore((s) => s.fetchTasks);
  const fetchNotes = useNoteStore((s) => s.fetchNotes);
  const fetchProjects = useProjectStore((s) => s.fetchProjects);
  const fetchEvents = useCalendarStore((s) => s.fetchEvents);
  const fetchIdeas = useIdeaStore((s) => s.fetchIdeas);

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingQueueCount, setPendingQueueCount] = useState(
    syncQueue.getQueueSize(),
  );

  const syncAll = useCallback(async () => {
    if (!navigator.onLine) {
      setIsOnline(false);
      return;
    }

    setIsOnline(true);
    setIsSyncing(true);

    try {
      // PUSH phase: Flush queued mutations first
      if (syncQueue.getQueueSize() > 0) {
        await syncQueue.flushQueue();
      }

      // PULL phase: Fetch all data from server
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
      console.warn("AutoSync error:", err);
    } finally {
      setIsSyncing(false);
      setPendingQueueCount(syncQueue.getQueueSize());
    }
  }, [
    fetchAlarms,
    fetchReminders,
    fetchTasks,
    fetchNotes,
    fetchProjects,
    fetchEvents,
    fetchIdeas,
  ]);

  useEffect(() => {
    // Initial fetch on mount
    syncAll();

    // Foreground visibility change listener (Web / Desktop)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        syncAll();
      }
    };
    window.addEventListener("visibilitychange", handleVisibilityChange);

    // Online/Offline events
    const handleOnline = () => {
      setIsOnline(true);
      syncAll();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Listen to syncQueue changes to update the count
    const handleQueueChanged = () => {
      setPendingQueueCount(syncQueue.getQueueSize());
    };
    window.addEventListener("syncQueueChanged", handleQueueChanged);

    // Native app resume listener (Android Capacitor)
    let isMounted = true;
    let appStateHandle: any = null;
    if (Capacitor.isNativePlatform()) {
      CapacitorApp.addListener(
        "appStateChange",
        (state: { isActive: boolean }) => {
          if (state.isActive) {
            syncAll();
          }
        },
      )
        .then((handle) => {
          if (!isMounted) {
            if (handle && typeof handle.remove === "function") {
              handle.remove();
            }
          } else {
            appStateHandle = handle;
          }
        })
        .catch((err) => {
          console.warn(
            "Failed to register native appStateChange listener:",
            err,
          );
        });
    }

    // Periodic interval sync (every 60s)
    const interval = setInterval(() => {
      if (document.visibilityState === "visible" && navigator.onLine) {
        syncAll();
      }
    }, 60000);

    return () => {
      isMounted = false;
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("syncQueueChanged", handleQueueChanged);

      if (appStateHandle && typeof appStateHandle.remove === "function") {
        appStateHandle.remove();
      }
      clearInterval(interval);
    };
  }, [syncAll]);

  return { syncAll, isOnline, isSyncing, pendingQueueCount };
}
