import React from 'react';
import { WorldClockItem, ClockViewMode, TimeFormat } from './types';
import { getTimeInTimezone } from './timezoneUtils';
import { AnalogClock } from './AnalogClock';
import { DigitalClock } from './DigitalClock';
import { cn } from '../../utils';

interface ClockCardProps {
  clock: WorldClockItem;
  currentTime: Date;
  viewMode: ClockViewMode;
  timeFormat: TimeFormat;
  onTogglePin: (id: string) => void;
  onRemove: (id: string) => void;
  onSelectForCompare?: (clock: WorldClockItem) => void;
}

export const ClockCard: React.FC<ClockCardProps> = ({
  clock,
  currentTime,
  viewMode,
  timeFormat,
  onTogglePin,
  onRemove,
  onSelectForCompare,
}) => {
  const timeData = getTimeInTimezone(clock.timezone, currentTime);

  const getDayNightIcon = () => {
    switch (timeData.dayNightPeriod) {
      case 'dawn':
        return (
          <span className="pcc-clock-daynight-icon pcc-clock-daynight-icon--dawn" title="Dawn / Early Morning">
            🌅
          </span>
        );
      case 'day':
        return (
          <span className="pcc-clock-daynight-icon pcc-clock-daynight-icon--day" title="Daytime (Sun up)">
            ☀️
          </span>
        );
      case 'dusk':
        return (
          <span className="pcc-clock-daynight-icon pcc-clock-daynight-icon--dusk" title="Dusk / Sunset">
            🌇
          </span>
        );
      case 'night':
      default:
        return (
          <span className="pcc-clock-daynight-icon pcc-clock-daynight-icon--night" title="Nighttime">
            🌙
          </span>
        );
    }
  };

  const getWorkingStatusBadge = () => {
    let statusClass = 'pcc-status-pill--off';
    let icon = '💤';

    if (timeData.workingStatusText.includes('Active Business')) {
      statusClass = 'pcc-status-pill--active';
      icon = '🟢';
    } else if (timeData.workingStatusText.includes('Early') || timeData.workingStatusText.includes('Evening')) {
      statusClass = 'pcc-status-pill--transitional';
      icon = '🟡';
    } else if (timeData.workingStatusText.includes('Weekend')) {
      statusClass = 'pcc-status-pill--weekend';
      icon = '🌴';
    }

    return (
      <div className={`pcc-status-pill ${statusClass}`}>
        <span className="pcc-status-pill__icon">{icon}</span>
        <span className="pcc-status-pill__text">{timeData.workingStatusText}</span>
      </div>
    );
  };

  const getDayRelationBadge = () => {
    if (timeData.dayRelation === 'tomorrow') {
      return <span className="pcc-day-relation-badge pcc-day-relation-badge--tomorrow">Tomorrow</span>;
    }
    if (timeData.dayRelation === 'yesterday') {
      return <span className="pcc-day-relation-badge pcc-day-relation-badge--yesterday">Yesterday</span>;
    }
    return <span className="pcc-day-relation-badge pcc-day-relation-badge--today">Today</span>;
  };

  return (
    <div
      className={cn(
        'pcc-clock-card',
        clock.pinned && 'pcc-clock-card--pinned',
        `pcc-clock-card--${timeData.dayNightPeriod}`
      )}
      id={`clock-card-${clock.id}`}
    >
      {/* Top Header Row */}
      <div className="pcc-clock-card__header">
        <div className="pcc-clock-card__title-group">
          <div className="pcc-clock-card__city-row">
            <span className="pcc-clock-card__flag" aria-hidden="true">
              {clock.flag || '📍'}
            </span>
            <h3 className="pcc-clock-card__city-name">
              {clock.customLabel || clock.cityName}
            </h3>
            {clock.customLabel && (
              <span className="pcc-clock-card__original-city">({clock.cityName})</span>
            )}
          </div>
          <div className="pcc-clock-card__meta">
            <span className="pcc-clock-card__country">{clock.country}</span>
            <span className="pcc-clock-card__dot">•</span>
            <span className="pcc-clock-card__tz-code">{clock.abbreviation}</span>
            <span className="pcc-clock-card__offset">({timeData.utcOffsetStr})</span>
          </div>
        </div>

        <div className="pcc-clock-card__actions">
          {getDayNightIcon()}

          <button
            type="button"
            className={cn('pcc-clock-card__pin-btn', clock.pinned && 'pcc-clock-card__pin-btn--active')}
            onClick={() => onTogglePin(clock.id)}
            title={clock.pinned ? 'Unpin clock' : 'Pin clock to top'}
            aria-label={clock.pinned ? 'Unpin clock' : 'Pin clock'}
          >
            <svg viewBox="0 0 24 24" fill={clock.pinned ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </button>

          <button
            type="button"
            className="pcc-clock-card__delete-btn"
            onClick={() => onRemove(clock.id)}
            title="Remove clock"
            aria-label="Remove clock"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Clock Content Display */}
      <div className={cn('pcc-clock-card__body', `pcc-clock-card__body--${viewMode}`)}>
        {(viewMode === 'analog' || viewMode === 'both') && (
          <div className="pcc-clock-card__analog-wrapper">
            <AnalogClock
              hours={timeData.hours24}
              minutes={timeData.minutes}
              seconds={timeData.seconds}
              dayNightPeriod={timeData.dayNightPeriod}
              size={viewMode === 'both' ? 'sm' : 'md'}
            />
          </div>
        )}

        {(viewMode === 'digital' || viewMode === 'both') && (
          <div className="pcc-clock-card__digital-wrapper">
            <DigitalClock
              hours12={timeData.hours12}
              hours24={timeData.hours24}
              minutes={timeData.minutes}
              seconds={timeData.seconds}
              period={timeData.period}
              timeFormat={timeFormat}
              size={viewMode === 'both' ? 'card' : 'hero'}
            />
            <div className="pcc-clock-card__date-row">
              <span className="pcc-clock-card__date">{timeData.formattedDate}</span>
              {getDayRelationBadge()}
            </div>
          </div>
        )}

        {viewMode === 'analog' && (
          <div className="pcc-clock-card__analog-subtext">
            <div className="pcc-clock-card__analog-digital-time">
              {timeFormat === '24h' ? timeData.formattedTime24 : timeData.formattedTime12}
            </div>
            <div className="pcc-clock-card__date-row">
              <span className="pcc-clock-card__date">{timeData.formattedDate}</span>
              {getDayRelationBadge()}
            </div>
          </div>
        )}
      </div>

      {/* Footer Info Row */}
      <div className="pcc-clock-card__footer">
        <div className="pcc-clock-card__diff-pill" title="Time relative to your local time">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span>{timeData.relativeDiffStr}</span>
        </div>

        {getWorkingStatusBadge()}

        {onSelectForCompare && (
          <button
            type="button"
            className="pcc-clock-card__compare-btn"
            onClick={() => onSelectForCompare(clock)}
            title="Compare time difference with another city"
          >
            Compare ⇄
          </button>
        )}
      </div>
    </div>
  );
};
