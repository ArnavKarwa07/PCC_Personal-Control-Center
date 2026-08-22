import React, { useState, useEffect } from 'react';
import { getApiBaseUrl } from '../services/api';

export type SyncState = 'idle' | 'cold_starting' | 'connected' | 'offline';

export const ColdStartSyncLoader: React.FC = () => {
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    let timer: NodeJS.Timeout | null = null;

    const checkCloudEngineHealth = async () => {
      const baseUrl = getApiBaseUrl();
      const healthUrl = `${baseUrl}/api/v1/health`;

      // Show cold start loader if request takes longer than 1000ms
      timer = setTimeout(() => {
        if (isMounted) {
          setSyncState('cold_starting');
          setIsVisible(true);
        }
      }, 1000);

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const res = await fetch(healthUrl, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (timer) clearTimeout(timer);

        if (res.ok) {
          if (isMounted) {
            setSyncState('connected');
            setIsVisible(true);
            // Dismiss after 2.5s once connected
            setTimeout(() => {
              if (isMounted) setIsVisible(false);
            }, 2500);
          }
        } else {
          if (isMounted) {
            setSyncState('offline');
            setIsVisible(true);
            setTimeout(() => {
              if (isMounted) setIsVisible(false);
            }, 3000);
          }
        }
      } catch {
        if (timer) clearTimeout(timer);
        if (isMounted) {
          setSyncState('offline');
          setIsVisible(true);
          setTimeout(() => {
            if (isMounted) setIsVisible(false);
          }, 3000);
        }
      }
    };

    checkCloudEngineHealth();

    return () => {
      isMounted = false;
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (!isVisible || syncState === 'idle') return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        borderColor: 'rgba(226, 232, 240, 0.8)',
        color: '#1e293b',
      }}
      role="status"
      aria-live="polite"
    >
      {syncState === 'cold_starting' && (
        <>
          <div className="relative flex items-center justify-center w-5 h-5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
          </div>
          <div className="flex flex-col text-xs">
            <span className="font-semibold text-slate-800 flex items-center gap-1.5">
              <span>⚡</span> Waking up Cloud Engine...
            </span>
            <span className="text-slate-500 font-mono text-[10px]">
              Standalone Local Mode Ready
            </span>
          </div>
        </>
      )}

      {syncState === 'connected' && (
        <>
          <div className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 font-bold text-xs">
            ✓
          </div>
          <div className="flex flex-col text-xs">
            <span className="font-semibold text-emerald-800 flex items-center gap-1">
              Cloud Engine Connected
            </span>
            <span className="text-slate-500 font-mono text-[10px]">
              Cloud Run (asia-south1)
            </span>
          </div>
        </>
      )}

      {syncState === 'offline' && (
        <>
          <div className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 text-slate-500 font-bold text-xs">
            📱
          </div>
          <div className="flex flex-col text-xs">
            <span className="font-semibold text-slate-700">
              Standalone Offline Mode
            </span>
            <span className="text-slate-400 font-mono text-[10px]">
              100% Local Device Storage Active
            </span>
          </div>
        </>
      )}
    </div>
  );
};
