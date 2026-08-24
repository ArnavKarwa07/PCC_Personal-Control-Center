import React, { useState, useEffect, useRef } from 'react';
import { DesktopLayout } from './DesktopLayout';
import { MobileLayout } from './MobileLayout';
import { ToastContainer } from '../components/ui/Toast';
import { CommandPalette } from '../components/CommandPalette';
import { AIAssistantWidget } from '../components/AIAssistantWidget';
import { AlarmRingingModal } from '../components/AlarmRingingModal';
import { useUIStore } from '../stores/uiStore';
import { useAlarmStore } from '../stores/alarmStore';
import { useAutoSync } from '../hooks/useAutoSync';
import { alarmScheduler } from '../services/alarmScheduler';
import type { Alarm } from '../types';
import { PermissionModal } from '../components/PermissionModal';
import { permissionService } from '../services/permissionService';
import './AppShell.css';

export const AppShell: React.FC = () => {
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );
  const { theme, accentColor, commandPaletteOpen, setCommandPaletteOpen } = useUIStore();
  const { alarms, snoozeAlarm } = useAlarmStore() as any;
  const [showPermBanner, setShowPermBanner] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('pcc_permissions_requested')) {
      setShowPermBanner(true);
    }
  }, []);

  const handleGrantPermissions = async () => {
    localStorage.setItem('pcc_permissions_requested', 'true');
    await permissionService.requestAllPermissions();
    setShowPermBanner(false);
  };

  const handleSkipPermissions = () => {
    setShowPermBanner(false);
    localStorage.setItem('pcc_permissions_requested', 'true');
  };

  // Mount global multi-device auto-sync hook
  useAutoSync();

  // Sync theme and accent color DOM data attributes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-accent', accentColor);
  }, [theme, accentColor]);

  // Responsive breakpoint listener
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Global keyboard shortcut for Command Palette (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  // Live Alarm Ticker Engine
  const [ringingQueue, setRingingQueue] = useState<Alarm[]>([]);
  const triggeredSetRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    const checkAlarms = () => {
      const now = new Date();
      const localYear = now.getFullYear();
      const localMonth = String(now.getMonth() + 1).padStart(2, '0');
      const localDay = String(now.getDate()).padStart(2, '0');
      const localDateStr = `${localYear}-${localMonth}-${localDay}`;
      const h = now.getHours().toString().padStart(2, '0');
      const m = now.getMinutes().toString().padStart(2, '0');
      const timeStr = `${h}:${m}`;
      const dayNum = now.getDay();
      const currentMs = now.getTime();

      // Prune keys older than 24 hours (86400000 ms)
      triggeredSetRef.current.forEach((timestamp, key) => {
        if (currentMs - timestamp > 86400000) {
          triggeredSetRef.current.delete(key);
        }
      });

      const matchedAlarms = (alarms || []).filter((a: Alarm) => {
        if (!a.enabled) return false;
        if (a.time !== timeStr) return false;
        const alarmDays = (a.days && a.days.length > 0 ? a.days : [0, 1, 2, 3, 4, 5, 6]).map(Number);
        if (!alarmDays.includes(dayNum)) return false;
        const triggerKey = `${a.id}-${localDateStr}-${timeStr}`;
        return !triggeredSetRef.current.has(triggerKey);
      });

      if (matchedAlarms.length > 0) {
        matchedAlarms.forEach((alm: Alarm) => {
          const k = `${alm.id}-${localDateStr}-${timeStr}`;
          triggeredSetRef.current.set(k, currentMs);
          alarmScheduler.triggerWebNotification(
            `⏰ Alarm: ${alm.label || 'Wake Up'}`,
            `It's ${alm.time}! Tap to open PCC.`,
            `alarm-${alm.id}`
          );
        });

        setRingingQueue((prev) => [...prev, ...matchedAlarms]);
      }
    };

    const timer = setInterval(checkAlarms, 1000);
    return () => clearInterval(timer);
  }, [alarms]);

  const activeRingingAlarm = ringingQueue[0] || null;

  const handleDismissRinging = () => {
    if (activeRingingAlarm && activeRingingAlarm.id.startsWith('alm_snooze')) {
      useAlarmStore.getState().deleteAlarm(activeRingingAlarm.id);
    }
    setRingingQueue((prev) => prev.slice(1));
  };

  const handleSnoozeRinging = (minutes: number) => {
    if (activeRingingAlarm) {
      if (typeof snoozeAlarm === 'function') {
        snoozeAlarm(activeRingingAlarm.id, minutes);
      }
      if (activeRingingAlarm.id.startsWith('alm_snooze')) {
        useAlarmStore.getState().deleteAlarm(activeRingingAlarm.id);
      }
    }
    setRingingQueue((prev) => prev.slice(1));
  };

  return (
    <div className="pcc-app-shell">
      {/* System Permissions Request Modal */}
      <PermissionModal
        isOpen={showPermBanner}
        onGrantAll={handleGrantPermissions}
        onSkip={handleSkipPermissions}
      />
      {isDesktop ? <DesktopLayout /> : <MobileLayout />}

      {/* Global Toast Notification Container */}
      <ToastContainer />

      {/* Global Command Palette & Fuzzy Search */}
      <CommandPalette />

      {/* Global Floating AI Assistant */}
      <AIAssistantWidget />

      {/* Interactive Ringing Alarm Screen */}
      <AlarmRingingModal
        alarm={activeRingingAlarm}
        onDismiss={handleDismissRinging}
        onSnooze={handleSnoozeRinging}
      />
    </div>
  );
};
