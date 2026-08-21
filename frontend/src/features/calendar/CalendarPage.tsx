import React, { useState } from 'react';
import { useCalendarStore } from '../../stores/calendarStore';
import { CalendarEvent } from '../../types';
import { Button } from '../../components/ui';
import { EventDetailModal } from './EventDetailModal';
import { CreateEventModal } from './CreateEventModal';
import { cn } from '../../utils';
import './Calendar.css';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const CalendarPage: React.FC = () => {
  const {
    events,
    activeView,
    filterTypes,
    setActiveView,
    toggleFilterType,
  } = useCalendarStore();

  // Navigation state (Default August 2026)
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonth, setCurrentMonth] = useState<number>(7); // 0-indexed, 7 = August

  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [clickedDate, setClickedDate] = useState<string>('2026-08-15');

  // Month navigation helpers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleGoToday = () => {
    setCurrentYear(2026);
    setCurrentMonth(7); // August 2026
  };

  const monthName = new Date(currentYear, currentMonth).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  // Filter events based on active toggles
  const filteredEvents = events.filter((e) => {
    if (e.type === 'event' && !filterTypes.events) return false;
    if (e.type === 'task' && !filterTypes.tasks) return false;
    if (e.type === 'reminder' && !filterTypes.reminders) return false;
    return true;
  });

  // Calculate Month Grid (6 rows x 7 days)
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  const calendarDays: Array<{
    dayNumber: number;
    dateStr: string;
    isCurrentMonth: boolean;
    isToday: boolean;
  }> = [];

  // Previous month trailing days
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const mStr = String(prevMonth + 1).padStart(2, '0');
    const dStr = String(day).padStart(2, '0');
    calendarDays.push({
      dayNumber: day,
      dateStr: `${prevYear}-${mStr}-${dStr}`,
      isCurrentMonth: false,
      isToday: false,
    });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const mStr = String(currentMonth + 1).padStart(2, '0');
    const dStr = String(day).padStart(2, '0');
    const dateStr = `${currentYear}-${mStr}-${dStr}`;
    const isToday = dateStr === '2026-08-15'; // Today in PCC time
    calendarDays.push({
      dayNumber: day,
      dateStr,
      isCurrentMonth: true,
      isToday,
    });
  }

  // Next month leading days (fill up to 35 or 42 cells)
  const remaining = (7 - (calendarDays.length % 7)) % 7;
  for (let day = 1; day <= remaining; day++) {
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    const mStr = String(nextMonth + 1).padStart(2, '0');
    const dStr = String(day).padStart(2, '0');
    calendarDays.push({
      dayNumber: day,
      dateStr: `${nextYear}-${mStr}-${dStr}`,
      isCurrentMonth: false,
      isToday: false,
    });
  }

  const handleDayClick = (dateStr: string) => {
    setClickedDate(dateStr);
    setIsCreateModalOpen(true);
  };

  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEvent(event);
    setIsDetailModalOpen(true);
  };

  const getEventsForDay = (dateStr: string) => {
    return filteredEvents.filter((e) => e.startDate.startsWith(dateStr));
  };

  // Week View calculation (Aug 10 - Aug 16, 2026)
  const weekDays = [
    { name: 'Sun', dateStr: '2026-08-10', dayNumber: 10, isToday: false },
    { name: 'Mon', dateStr: '2026-08-11', dayNumber: 11, isToday: false },
    { name: 'Tue', dateStr: '2026-08-12', dayNumber: 12, isToday: false },
    { name: 'Wed', dateStr: '2026-08-13', dayNumber: 13, isToday: false },
    { name: 'Thu', dateStr: '2026-08-14', dayNumber: 14, isToday: false },
    { name: 'Fri', dateStr: '2026-08-15', dayNumber: 15, isToday: true },
    { name: 'Sat', dateStr: '2026-08-16', dayNumber: 16, isToday: false },
  ];

  return (
    <div className="pcc-calendar-page" id="calendar-page-root">
      {/* Calendar Top Toolbar */}
      <div className="pcc-calendar__header">
        <div className="pcc-calendar__nav">
          <h2 className="pcc-calendar__title">{monthName}</h2>
          <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
            <Button variant="ghost" size="sm" onClick={handlePrevMonth} aria-label="Previous Month">
              &larr;
            </Button>
            <Button variant="secondary" size="sm" onClick={handleGoToday}>
              Today
            </Button>
            <Button variant="ghost" size="sm" onClick={handleNextMonth} aria-label="Next Month">
              &rarr;
            </Button>
          </div>
        </div>

        <div className="pcc-calendar__controls-right">
          {/* Filter Toggles */}
          <div className="pcc-calendar__filters">
            <button
              type="button"
              className={cn(
                'pcc-calendar-filter-btn',
                filterTypes.events && 'pcc-calendar-filter-btn--active'
              )}
              onClick={() => toggleFilterType('events')}
            >
              <span className="pcc-calendar-filter-dot pcc-calendar-filter-dot--events" />
              Events
            </button>

            <button
              type="button"
              className={cn(
                'pcc-calendar-filter-btn',
                filterTypes.tasks && 'pcc-calendar-filter-btn--active'
              )}
              onClick={() => toggleFilterType('tasks')}
            >
              <span className="pcc-calendar-filter-dot pcc-calendar-filter-dot--tasks" />
              Tasks
            </button>

            <button
              type="button"
              className={cn(
                'pcc-calendar-filter-btn',
                filterTypes.reminders && 'pcc-calendar-filter-btn--active'
              )}
              onClick={() => toggleFilterType('reminders')}
            >
              <span className="pcc-calendar-filter-dot pcc-calendar-filter-dot--reminders" />
              Reminders
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="pcc-calendar-view-toggle">
            {(['month', 'week', 'day', 'agenda'] as const).map((view) => (
              <button
                key={view}
                type="button"
                className={cn(
                  'pcc-calendar-view-btn',
                  activeView === view && 'pcc-calendar-view-btn--active'
                )}
                onClick={() => setActiveView(view)}
              >
                {view.charAt(0).toUpperCase() + view.slice(1)}
              </button>
            ))}
          </div>

          <Button
            variant="primary"
            size="sm"
            id="btn-add-event"
            icon={
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            }
            onClick={() => {
              setClickedDate('2026-08-15');
              setIsCreateModalOpen(true);
            }}
          >
            Add Event
          </Button>
        </div>
      </div>

      {/* Month View Grid */}
      {activeView === 'month' && (
        <div className="pcc-calendar-grid-container" id="calendar-month-container">
          {/* Weekday Header */}
          <div className="pcc-calendar-weekday-header">
            {WEEKDAYS.map((day) => (
              <div key={day} className="pcc-calendar-weekday-cell">
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="pcc-calendar-month-grid">
            {calendarDays.map((cd, idx) => {
              const dayEvents = getEventsForDay(cd.dateStr);

              return (
                <div
                  key={`${cd.dateStr}-${idx}`}
                  id={`cal-day-${cd.dateStr}`}
                  className={cn(
                    'pcc-calendar-day-cell',
                    !cd.isCurrentMonth && 'pcc-calendar-day-cell--other-month',
                    cd.isToday && 'pcc-calendar-day-cell--today'
                  )}
                  onClick={() => handleDayClick(cd.dateStr)}
                >
                  <div className="pcc-calendar-day-header">
                    <span
                      className={cn(
                        'pcc-calendar-day-number',
                        cd.isToday && 'pcc-calendar-day-number--today'
                      )}
                    >
                      {cd.dayNumber}
                    </span>
                  </div>

                  <div className="pcc-calendar-day-events">
                    {dayEvents.map((evt) => (
                      <div
                        key={evt.id}
                        id={`cal-event-${evt.id}`}
                        className={cn(
                          'pcc-calendar-event-chip',
                          `pcc-calendar-event-chip--${evt.type}`,
                          evt.completed && 'pcc-calendar-event-chip--completed'
                        )}
                        onClick={(e) => handleEventClick(evt, e)}
                        title={`${evt.title} (${evt.type})`}
                      >
                        <span className="pcc-calendar-event-title">{evt.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Week View Grid */}
      {activeView === 'week' && (
        <div className="pcc-calendar-week-grid" id="calendar-week-container">
          {weekDays.map((wd) => {
            const dayEvents = getEventsForDay(wd.dateStr);

            return (
              <div
                key={wd.dateStr}
                className={cn(
                  'pcc-calendar-week-col',
                  wd.isToday && 'pcc-calendar-week-col--today'
                )}
                onClick={() => handleDayClick(wd.dateStr)}
              >
                <div className="pcc-calendar-week-col-header">
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>
                    {wd.name}
                  </span>
                  <span
                    className={cn(
                      'pcc-calendar-day-number',
                      wd.isToday && 'pcc-calendar-day-number--today'
                    )}
                  >
                    {wd.dayNumber}
                  </span>
                </div>

                <div className="pcc-calendar-week-items-list">
                  {dayEvents.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: '11px', padding: 'var(--space-4) 0' }}>
                      Free day
                    </div>
                  ) : (
                    dayEvents.map((evt) => (
                      <div
                        key={evt.id}
                        className={cn(
                          'pcc-calendar-week-item',
                          `pcc-calendar-event-chip--${evt.type}`,
                          evt.completed && 'pcc-calendar-event-chip--completed'
                        )}
                        onClick={(e) => handleEventClick(evt, e)}
                      >
                        <strong className="pcc-calendar-event-title" style={{ fontSize: 'var(--font-size-xs)' }}>{evt.title}</strong>
                        {evt.description && (
                          <span className="pcc-calendar-event-desc" style={{ fontSize: '11px', opacity: 0.8 }}>
                            {evt.description}
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Day View (Mobile Optimized) */}
      {activeView === 'day' && (
        <div className="pcc-calendar-day-view" id="calendar-day-container">
          <div className="pcc-calendar-day-ribbon">
            {weekDays.map((wd) => (
              <button
                key={wd.dateStr}
                type="button"
                className={cn(
                  'pcc-calendar-ribbon-btn',
                  clickedDate === wd.dateStr && 'pcc-calendar-ribbon-btn--active',
                  wd.isToday && 'pcc-calendar-ribbon-btn--today'
                )}
                onClick={() => setClickedDate(wd.dateStr)}
              >
                <span className="pcc-calendar-ribbon-day">{wd.name}</span>
                <span className="pcc-calendar-ribbon-num">{wd.dayNumber}</span>
              </button>
            ))}
          </div>

          <div className="pcc-calendar-day-details">
            <div className="pcc-calendar-day-details-header">
              <h3>Schedule for {clickedDate}</h3>
              <Button size="sm" variant="secondary" onClick={() => setIsCreateModalOpen(true)}>
                + Add
              </Button>
            </div>

            <div className="pcc-calendar-day-events-list">
              {getEventsForDay(clickedDate).length === 0 ? (
                <div className="pcc-calendar-empty-day">
                  No events or reminders scheduled for this date.
                </div>
              ) : (
                getEventsForDay(clickedDate).map((evt) => (
                  <div
                    key={evt.id}
                    className={cn(
                      'pcc-calendar-agenda-item',
                      `pcc-calendar-event-chip--${evt.type}`,
                      evt.completed && 'pcc-calendar-event-chip--completed'
                    )}
                    onClick={(e) => handleEventClick(evt, e)}
                  >
                    <div className="pcc-calendar-agenda-item-header">
                      <span className="pcc-calendar-agenda-badge">{evt.type}</span>
                      <span className="pcc-calendar-event-title">{evt.title}</span>
                    </div>
                    {evt.description && (
                      <p className="pcc-calendar-agenda-desc">{evt.description}</p>
                    )}
                    {evt.location && (
                      <div className="pcc-calendar-agenda-loc">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        <span>{evt.location}</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Agenda View (Mobile / Compressed Screen View) */}
      {activeView === 'agenda' && (
        <div className="pcc-calendar-agenda-view" id="calendar-agenda-container">
          <div className="pcc-calendar-agenda-list">
            {filteredEvents.length === 0 ? (
              <div className="pcc-calendar-empty-day">No upcoming items match active filters.</div>
            ) : (
              filteredEvents.map((evt) => (
                <div
                  key={evt.id}
                  className={cn(
                    'pcc-calendar-agenda-card',
                    `pcc-calendar-event-chip--${evt.type}`,
                    evt.completed && 'pcc-calendar-event-chip--completed'
                  )}
                  onClick={(e) => handleEventClick(evt, e)}
                >
                  <div className="pcc-calendar-agenda-date-badge">
                    {evt.startDate.split('T')[0]}
                  </div>
                  <div className="pcc-calendar-agenda-main">
                    <div className="pcc-calendar-agenda-title-row">
                      <span className="pcc-calendar-agenda-type-dot" />
                      <span className="pcc-calendar-event-title">{evt.title}</span>
                    </div>
                    {evt.description && <p className="pcc-calendar-agenda-desc">{evt.description}</p>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Event Detail Modal */}
      <EventDetailModal
        event={selectedEvent}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedEvent(null);
        }}
      />

      {/* Create Event Modal */}
      <CreateEventModal
        initialDate={clickedDate}
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
};

export default CalendarPage;
