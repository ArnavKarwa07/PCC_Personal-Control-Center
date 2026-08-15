import React, { useState, useEffect } from 'react';
import { DesktopLayout } from './DesktopLayout';
import { MobileLayout } from './MobileLayout';
import { ToastContainer } from '../components/ui/Toast';
import { CommandPalette } from '../components/CommandPalette';
import { useUIStore } from '../stores/uiStore';
import './AppShell.css';

export const AppShell: React.FC = () => {
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );
  const { commandPaletteOpen, setCommandPaletteOpen } = useUIStore();

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

  return (
    <div className="pcc-app-shell">
      {isDesktop ? <DesktopLayout /> : <MobileLayout />}

      {/* Global Toast Notification Container */}
      <ToastContainer />

      {/* Global Command Palette & Fuzzy Search */}
      <CommandPalette />
    </div>
  );
};
