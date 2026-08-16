import React, { useState, useMemo } from 'react';
import { WorldClockItem } from './types';
import { CITY_PRESETS } from './timezoneData';
import {
  getTimeInTimezone,
  getTimezoneOffsetMinutes,
  generateMeetingOverlapTimeline,
} from './timezoneUtils';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/ui';
import { cn } from '../../utils';

interface TimeDifferenceCalculatorProps {
  savedClocks: WorldClockItem[];
  defaultBaseId?: string;
  defaultTargetId?: string;
}

export const TimeDifferenceCalculator: React.FC<TimeDifferenceCalculatorProps> = ({
  savedClocks,
  defaultBaseId,
  defaultTargetId,
}) => {
  const { toast } = useToast();

  // Combine saved clocks with city presets for a comprehensive list
  const allLocations = useMemo(() => {
    const map = new Map<string, { name: string; timezone: string; flag: string; abbr: string }>();

    savedClocks.forEach((c) => {
      map.set(c.timezone, {
        name: c.customLabel || c.cityName,
        timezone: c.timezone,
        flag: c.flag || '📍',
        abbr: c.abbreviation,
      });
    });

    CITY_PRESETS.forEach((p) => {
      if (!map.has(p.timezone)) {
        map.set(p.timezone, {
          name: p.cityName,
          timezone: p.timezone,
          flag: p.flag,
          abbr: p.abbreviation,
        });
      }
    });

    return Array.from(map.values());
  }, [savedClocks]);

  const defaultBaseTz = defaultBaseId
    ? savedClocks.find((c) => c.id === defaultBaseId)?.timezone || 'Asia/Kolkata'
    : 'Asia/Kolkata';

  const defaultTargetTz = defaultTargetId
    ? savedClocks.find((c) => c.id === defaultTargetId)?.timezone || 'Europe/London'
    : 'Europe/London';

  const [baseTz, setBaseTz] = useState<string>(defaultBaseTz);
  const [targetTz, setTargetTz] = useState<string>(defaultTargetTz);
  const [sliderHour, setSliderHour] = useState<number>(14); // default 2 PM

  const baseLoc = allLocations.find((l) => l.timezone === baseTz) || {
    name: 'Base City',
    timezone: baseTz,
    flag: '📍',
    abbr: 'TZ1',
  };

  const targetLoc = allLocations.find((l) => l.timezone === targetTz) || {
    name: 'Target City',
    timezone: targetTz,
    flag: '📍',
    abbr: 'TZ2',
  };

  // Swap cities
  const handleSwap = () => {
    const temp = baseTz;
    setBaseTz(targetTz);
    setTargetTz(temp);
  };

  // Time difference calculation
  const baseOffsetMinutes = getTimezoneOffsetMinutes(baseTz);
  const targetOffsetMinutes = getTimezoneOffsetMinutes(targetTz);
  const diffMinutes = targetOffsetMinutes - baseOffsetMinutes;
  const isAhead = diffMinutes > 0;
  const isSameTime = diffMinutes === 0;

  const absMinutes = Math.abs(diffMinutes);
  const diffHours = Math.floor(absMinutes / 60);
  const diffMins = absMinutes % 60;

  let differenceSentence = '';
  if (isSameTime) {
    differenceSentence = `${targetLoc.name} is in the same timezone as ${baseLoc.name}.`;
  } else {
    const timeParts = [];
    if (diffHours > 0) timeParts.push(`${diffHours} hour${diffHours > 1 ? 's' : ''}`);
    if (diffMins > 0) timeParts.push(`${diffMins} minute${diffMins > 1 ? 's' : ''}`);
    differenceSentence = `${targetLoc.name} is ${timeParts.join(' and ')} ${
      isAhead ? 'ahead of' : 'behind'
    } ${baseLoc.name}.`;
  }

  // Calculate target slider time from base slider hour
  const totalTargetMinutes = sliderHour * 60 + diffMinutes;
  const normalizedTargetMinutes = ((totalTargetMinutes % 1440) + 1440) % 1440;
  const targetHour = Math.floor(normalizedTargetMinutes / 60);
  const targetMinute = normalizedTargetMinutes % 60;

  // Formatting slider times
  const formatHour12 = (h: number, m = 0) => {
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    const minStr = m > 0 ? `:${m.toString().padStart(2, '0')}` : ':00';
    return `${displayH}${minStr} ${period}`;
  };

  const baseSliderTimeStr = formatHour12(sliderHour, 0);
  const targetSliderTimeStr = formatHour12(targetHour, targetMinute);

  // Day shift indicator
  let dayShiftBadge = 'Same day';
  if (totalTargetMinutes >= 1440) {
    dayShiftBadge = '+1 Day (Tomorrow)';
  } else if (totalTargetMinutes < 0) {
    dayShiftBadge = '-1 Day (Yesterday)';
  }

  // Overlap timeline
  const overlapSlots = useMemo(() => {
    return generateMeetingOverlapTimeline(baseTz, targetTz);
  }, [baseTz, targetTz]);

  // Find mutual overlap slots (9 to 18)
  const mutualSlots = overlapSlots.filter((s) => s.isMutualWorkHour);

  let meetingWindowSummary = 'No direct 9 AM - 6 PM working hours overlap on the same business day.';
  if (mutualSlots.length > 0) {
    const first = mutualSlots[0];
    const last = mutualSlots[mutualSlots.length - 1];
    meetingWindowSummary = `Optimal Meeting Window: ${first.sourceTimeFormatted} – ${formatHour12(
      last.sourceHour + 1
    )} (${baseLoc.name}) ⇄ ${first.targetTimeFormatted} – ${formatHour12(
      last.targetHour + 1
    )} (${targetLoc.name})`;
  }

  const handleCopyMeetingWindow = () => {
    navigator.clipboard.writeText(
      `${meetingWindowSummary}\nComparison: ${baseLoc.name} (${baseLoc.abbr}) ⇄ ${targetLoc.name} (${targetLoc.abbr})`
    );
    toast.success(
      'Copied to clipboard!',
      'Meeting overlap window copied for calendar invites.'
    );
  };

  return (
    <div className="pcc-diff-calculator" id="time-difference-calculator">
      <div className="pcc-diff-calculator__header">
        <div className="pcc-diff-calculator__header-left">
          <div className="pcc-diff-calculator__badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <span>Time Difference & Global Overlap Planner</span>
          </div>
          <h3 className="pcc-diff-calculator__title">Compare Any Two Timezones</h3>
        </div>

        {mutualSlots.length > 0 && (
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCopyMeetingWindow}
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            }
          >
            Copy Meeting Slot
          </Button>
        )}
      </div>

      {/* Selectors Bar */}
      <div className="pcc-diff-calculator__selectors">
        {/* Base City Selector */}
        <div className="pcc-diff-selector-card">
          <label className="pcc-diff-selector-card__label">Base Location (City 1)</label>
          <div className="pcc-diff-selector-card__select-wrapper">
            <span className="pcc-diff-selector-card__flag">{baseLoc.flag}</span>
            <select
              className="pcc-diff-select"
              value={baseTz}
              onChange={(e) => setBaseTz(e.target.value)}
              aria-label="Base city timezone"
            >
              {allLocations.map((loc) => (
                <option key={`base-${loc.timezone}`} value={loc.timezone}>
                  {loc.flag} {loc.name} ({loc.abbr})
                </option>
              ))}
            </select>
          </div>
          <div className="pcc-diff-selector-card__current-time">
            Current: {getTimeInTimezone(baseTz).formattedTime12}
          </div>
        </div>

        {/* Swap Button */}
        <button
          type="button"
          className="pcc-diff-swap-btn"
          onClick={handleSwap}
          title="Swap base and target locations"
          aria-label="Swap locations"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M7 16V4M7 4L3 8M7 4L11 8M17 8V20M17 20L21 16M17 20L13 16" />
          </svg>
        </button>

        {/* Target City Selector */}
        <div className="pcc-diff-selector-card">
          <label className="pcc-diff-selector-card__label">Target Location (City 2)</label>
          <div className="pcc-diff-selector-card__select-wrapper">
            <span className="pcc-diff-selector-card__flag">{targetLoc.flag}</span>
            <select
              className="pcc-diff-select"
              value={targetTz}
              onChange={(e) => setTargetTz(e.target.value)}
              aria-label="Target city timezone"
            >
              {allLocations.map((loc) => (
                <option key={`target-${loc.timezone}`} value={loc.timezone}>
                  {loc.flag} {loc.name} ({loc.abbr})
                </option>
              ))}
            </select>
          </div>
          <div className="pcc-diff-selector-card__current-time">
            Current: {getTimeInTimezone(targetTz).formattedTime12}
          </div>
        </div>
      </div>

      {/* Difference Headline Card */}
      <div className="pcc-diff-headline-card">
        <div className="pcc-diff-headline-card__icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <div className="pcc-diff-headline-card__content">
          <div className="pcc-diff-headline-card__sentence">{differenceSentence}</div>
          <div className="pcc-diff-headline-card__summary">{meetingWindowSummary}</div>
        </div>
      </div>

      {/* Interactive Time Slider Section */}
      <div className="pcc-diff-slider-section">
        <div className="pcc-diff-slider-section__header">
          <span className="pcc-diff-slider-section__title">
            Interactive Meeting Time Scrub Bar:
          </span>
          <div className="pcc-diff-slider-time-pills">
            <div className="pcc-diff-time-pill pcc-diff-time-pill--base">
              <span className="pcc-diff-time-pill__city">{baseLoc.name}:</span>
              <strong>{baseSliderTimeStr}</strong>
            </div>
            <span className="pcc-diff-time-pill__arrow">➔</span>
            <div className="pcc-diff-time-pill pcc-diff-time-pill--target">
              <span className="pcc-diff-time-pill__city">{targetLoc.name}:</span>
              <strong>{targetSliderTimeStr}</strong>
              <span className="pcc-diff-time-pill__shift">{dayShiftBadge}</span>
            </div>
          </div>
        </div>

        <input
          type="range"
          min="0"
          max="23"
          value={sliderHour}
          onChange={(e) => setSliderHour(parseInt(e.target.value, 10))}
          className="pcc-diff-range-slider"
          aria-label="Time slider in hours"
        />

        <div className="pcc-diff-slider-ticks">
          <span>12 AM</span>
          <span>3 AM</span>
          <span>6 AM</span>
          <span>9 AM</span>
          <span>12 PM</span>
          <span>3 PM</span>
          <span>6 PM</span>
          <span>9 PM</span>
          <span>11 PM</span>
        </div>
      </div>

      {/* 24-Hour Visual Overlap Timeline Matrix */}
      <div className="pcc-diff-matrix-wrapper">
        <div className="pcc-diff-matrix-legend">
          <span className="pcc-diff-matrix-legend__item">
            <span className="pcc-legend-dot pcc-legend-dot--mutual" /> Both Working (9am-6pm)
          </span>
          <span className="pcc-diff-matrix-legend__item">
            <span className="pcc-legend-dot pcc-legend-dot--single" /> One Side Working
          </span>
          <span className="pcc-diff-matrix-legend__item">
            <span className="pcc-legend-dot pcc-legend-dot--off" /> Off Hours / Night
          </span>
        </div>

        <div className="pcc-diff-matrix-grid">
          {overlapSlots.map((slot) => {
            const isSelected = slot.sourceHour === sliderHour;
            let slotClass = 'pcc-slot--off';
            if (slot.isMutualWorkHour) {
              slotClass = 'pcc-slot--mutual';
            } else if (slot.sourceIsWork || slot.targetIsWork) {
              slotClass = 'pcc-slot--single';
            }

            return (
              <div
                key={slot.hourIndex}
                className={cn(
                  'pcc-diff-slot',
                  slotClass,
                  isSelected && 'pcc-diff-slot--selected'
                )}
                onClick={() => setSliderHour(slot.sourceHour)}
                role="button"
                tabIndex={0}
                title={`At ${slot.sourceTimeFormatted} (${baseLoc.name}) = ${slot.targetTimeFormatted} (${targetLoc.name})`}
              >
                <div className="pcc-diff-slot__base-time">
                  {slot.sourceHour % 12 === 0 ? 12 : slot.sourceHour % 12}
                  <small>{slot.sourceHour >= 12 ? 'p' : 'a'}</small>
                </div>
                <div className="pcc-diff-slot__target-time">
                  {slot.targetHour % 12 === 0 ? 12 : slot.targetHour % 12}
                  <small>{slot.targetHour >= 12 ? 'p' : 'a'}</small>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
