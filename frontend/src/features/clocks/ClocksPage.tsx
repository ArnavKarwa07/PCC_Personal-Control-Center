import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { WorldClockItem, ClockViewMode, TimeFormat } from './types';
import { DEFAULT_CLOCKS } from './timezoneData';
import { getTimeInTimezone } from './timezoneUtils';
import { ClockCard } from './ClockCard';
import { AddTimezoneModal } from './AddTimezoneModal';
import { TimeDifferenceCalculator } from './TimeDifferenceCalculator';
import { Button, Input, EmptyState } from '../../components/ui';
import { useToast } from '../../hooks/useToast';
import { cn } from '../../utils';
import './ClocksPage.css';

const LOCAL_STORAGE_KEY = 'pcc_world_clocks_v1';
const VIEW_MODE_STORAGE_KEY = 'pcc_clock_view_mode';
const TIME_FORMAT_STORAGE_KEY = 'pcc_clock_time_format';

export const ClocksPage: React.FC = () => {
  const { toast } = useToast();

  // Clocks state initialized from localStorage
  const [clocks, setClocks] = useState<WorldClockItem[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fall back to defaults on parsing error
    }
    return DEFAULT_CLOCKS;
  });

  // View mode & format preferences
  const [viewMode, setViewMode] = useState<ClockViewMode>(() => {
    const saved = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    return (saved as ClockViewMode) || 'both';
  });

  const [timeFormat, setTimeFormat] = useState<TimeFormat>(() => {
    const saved = localStorage.getItem(TIME_FORMAT_STORAGE_KEY);
    return (saved as TimeFormat) || '12h';
  });

  const [searchFilter, setSearchFilter] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showCalculator, setShowCalculator] = useState(true);
  const [compareTargetClock, setCompareTargetClock] = useState<WorldClockItem | null>(null);

  // Live ticking clock state
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Save clocks to localStorage
  const saveClocks = useCallback((newClocks: WorldClockItem[]) => {
    setClocks(newClocks);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newClocks));
    } catch {
      // Ignore storage quota errors
    }
  }, []);

  // Save view mode
  const handleViewModeChange = (mode: ClockViewMode) => {
    setViewMode(mode);
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
  };

  // Save time format
  const handleTimeFormatChange = (fmt: TimeFormat) => {
    setTimeFormat(fmt);
    localStorage.setItem(TIME_FORMAT_STORAGE_KEY, fmt);
  };

  // Add clock handler
  const handleAddClock = (newClock: WorldClockItem) => {
    const updated = [newClock, ...clocks];
    saveClocks(updated);
    toast.success(
      'Timezone Added',
      `${newClock.cityName} (${newClock.abbreviation}) added to your world clocks.`
    );
  };

  // Remove clock handler
  const handleRemoveClock = (id: string) => {
    const clockToRemove = clocks.find((c) => c.id === id);
    const updated = clocks.filter((c) => c.id !== id);
    saveClocks(updated);
    toast.info(
      'Timezone Removed',
      `${clockToRemove?.cityName || 'Clock'} has been removed.`
    );
  };

  // Pin toggle handler
  const handleTogglePin = (id: string) => {
    const updated = clocks.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c));
    saveClocks(updated);
  };

  // Reset to default clocks
  const handleResetDefaults = () => {
    saveClocks(DEFAULT_CLOCKS);
    toast.info(
      'Defaults Restored',
      'World clocks have been reset to default global hubs.'
    );
  };

  // Compare in calculator action from a card
  const handleSelectForCompare = (clock: WorldClockItem) => {
    setCompareTargetClock(clock);
    setShowCalculator(true);
    const calcEl = document.getElementById('time-difference-calculator');
    if (calcEl) {
      calcEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Local device timezone info
  const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const localTimeData = getTimeInTimezone(localTimezone, currentTime);

  // Sorted and filtered clocks
  const filteredClocks = useMemo(() => {
    const query = searchFilter.trim().toLowerCase();
    const list = clocks.filter((c) => {
      if (!query) return true;
      return (
        c.cityName.toLowerCase().includes(query) ||
        c.country.toLowerCase().includes(query) ||
        c.abbreviation.toLowerCase().includes(query) ||
        c.timezone.toLowerCase().includes(query) ||
        (c.customLabel && c.customLabel.toLowerCase().includes(query))
      );
    });

    // Pinned clocks first, preserving order
    return [...list].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return 0;
    });
  }, [clocks, searchFilter]);

  // Summary statistics for hero
  const stats = useMemo(() => {
    let workingCount = 0;
    let dayCount = 0;
    let nightCount = 0;

    clocks.forEach((c) => {
      const data = getTimeInTimezone(c.timezone, currentTime);
      if (data.isWorkingHours) workingCount++;
      if (data.dayNightPeriod === 'day' || data.dayNightPeriod === 'dawn') {
        dayCount++;
      } else {
        nightCount++;
      }
    });

    return {
      total: clocks.length,
      workingCount,
      dayCount,
      nightCount,
    };
  }, [clocks, currentTime]);

  return (
    <div className="pcc-clocks-page" id="clocks-page-root">
      {/* Top Hero Section */}
      <div className="pcc-clocks-hero">
        <div className="pcc-clocks-hero__left">
          <div className="pcc-clocks-hero__badge">
            <span className="pcc-clocks-hero__badge-dot" />
            <span>Local Time ({localTimezone})</span>
          </div>

          <div className="pcc-clocks-hero__digital-display">
            <span className="pcc-clocks-hero__time">
              {timeFormat === '24h'
                ? localTimeData.formattedTime24
                : `${localTimeData.hours12.toString().padStart(2, '0')}:${localTimeData.minutes
                    .toString()
                    .padStart(2, '0')}`}
            </span>
            <span className="pcc-clocks-hero__seconds">{localTimeData.formattedSeconds}</span>
            {timeFormat === '12h' && (
              <span className="pcc-clocks-hero__period">{localTimeData.period}</span>
            )}
          </div>

          <div className="pcc-clocks-hero__date-row">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>{localTimeData.formattedDate}</span>
            <span className="pcc-clocks-hero__dot">•</span>
            <span className="pcc-clocks-hero__offset">{localTimeData.utcOffsetStr}</span>
          </div>
        </div>

        <div className="pcc-clocks-hero__right">
          {/* Quick Metrics */}
          <div className="pcc-clocks-hero-stats">
            <div className="pcc-hero-stat-card">
              <span className="pcc-hero-stat-card__value">{stats.total}</span>
              <span className="pcc-hero-stat-card__label">Tracked Clocks</span>
            </div>
            <div className="pcc-hero-stat-card">
              <span className="pcc-hero-stat-card__value pcc-hero-stat-card__value--success">
                {stats.workingCount}
              </span>
              <span className="pcc-hero-stat-card__label">In Business Hours</span>
            </div>
            <div className="pcc-hero-stat-card">
              <span className="pcc-hero-stat-card__value">
                {stats.dayCount} ☀️ / {stats.nightCount} 🌙
              </span>
              <span className="pcc-hero-stat-card__label">Day / Night Split</span>
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="pcc-clocks-hero__actions">
            <Button
              id="btn-add-timezone"
              variant="primary"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              }
              onClick={() => setIsAddModalOpen(true)}
            >
              Add Timezone
            </Button>
          </div>
        </div>
      </div>

      {/* Control Bar & Filters */}
      <div className="pcc-clocks-controls-bar">
        <div className="pcc-clocks-controls-bar__search">
          <Input
            placeholder="Filter saved clocks (city, country, code)..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            }
          />
        </div>

        <div className="pcc-clocks-controls-bar__options">
          {/* View Mode Switcher */}
          <div className="pcc-button-group" role="group" aria-label="Clock visual mode">
            <button
              type="button"
              className={cn(
                'pcc-button-group__btn',
                viewMode === 'both' && 'pcc-button-group__btn--active'
              )}
              onClick={() => handleViewModeChange('both')}
              title="Show Both Analog & Digital"
            >
              Hybrid
            </button>
            <button
              type="button"
              className={cn(
                'pcc-button-group__btn',
                viewMode === 'digital' && 'pcc-button-group__btn--active'
              )}
              onClick={() => handleViewModeChange('digital')}
              title="Digital Clocks only"
            >
              Digital
            </button>
            <button
              type="button"
              className={cn(
                'pcc-button-group__btn',
                viewMode === 'analog' && 'pcc-button-group__btn--active'
              )}
              onClick={() => handleViewModeChange('analog')}
              title="Analog Clocks only"
            >
              Analog
            </button>
          </div>

          {/* Time Format Switcher (12h vs 24h) */}
          <div className="pcc-button-group" role="group" aria-label="Time format">
            <button
              type="button"
              className={cn(
                'pcc-button-group__btn',
                timeFormat === '12h' && 'pcc-button-group__btn--active'
              )}
              onClick={() => handleTimeFormatChange('12h')}
            >
              12H
            </button>
            <button
              type="button"
              className={cn(
                'pcc-button-group__btn',
                timeFormat === '24h' && 'pcc-button-group__btn--active'
              )}
              onClick={() => handleTimeFormatChange('24h')}
            >
              24H
            </button>
          </div>

          {/* Calculator Section Toggle */}
          <Button
            variant={showCalculator ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setShowCalculator((prev) => !prev)}
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            }
          >
            {showCalculator ? 'Hide Planner' : 'Show Planner'}
          </Button>

          {/* Reset Defaults */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetDefaults}
            title="Reset to default world hubs"
          >
            Reset
          </Button>
        </div>
      </div>

      {/* World Clocks Grid */}
      <div className="pcc-clocks-grid-container">
        {filteredClocks.length === 0 ? (
          <div className="pcc-clocks-empty-wrapper">
            <EmptyState
              title={clocks.length === 0 ? 'No world clocks saved' : 'No matching clocks found'}
              description={
                clocks.length === 0
                  ? 'Track global teammates, international offices, and client timezones in real time.'
                  : `No saved clock matched "${searchFilter}".`
              }
              actionLabel={clocks.length === 0 ? 'Add Your First Clock' : 'Reset Search'}
              onAction={() => {
                if (clocks.length === 0) {
                  setIsAddModalOpen(true);
                } else {
                  setSearchFilter('');
                }
              }}
            />
          </div>
        ) : (
          <div className="pcc-clocks-grid">
            {filteredClocks.map((clock) => (
              <ClockCard
                key={clock.id}
                clock={clock}
                currentTime={currentTime}
                viewMode={viewMode}
                timeFormat={timeFormat}
                onTogglePin={handleTogglePin}
                onRemove={handleRemoveClock}
                onSelectForCompare={handleSelectForCompare}
              />
            ))}
          </div>
        )}
      </div>

      {/* Time Difference & Meeting Overlap Calculator Section */}
      {showCalculator && (
        <TimeDifferenceCalculator
          savedClocks={clocks}
          defaultBaseId={clocks[0]?.id}
          defaultTargetId={compareTargetClock?.id || clocks[1]?.id}
        />
      )}

      {/* Add Timezone Modal */}
      <AddTimezoneModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddClock={handleAddClock}
        existingClocks={clocks}
      />
    </div>
  );
};

export default ClocksPage;
