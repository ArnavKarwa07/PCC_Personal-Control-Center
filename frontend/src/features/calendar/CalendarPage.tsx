import React, { useState, useEffect, useMemo } from 'react';
import { useCalendarStore } from '../../stores/calendarStore';
import { CalendarEvent } from '../../types';
import { Button, Spinner } from '../../components/ui';
import { EventDetailModal } from './EventDetailModal';
import { CreateEventModal } from './CreateEventModal';
import { cn } from '../../utils';
import './Calendar.css';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const CalendarPage: React.FC = () => {
  const {
    events,
    fetchEvents,
    isLoading,
    activeView,
    filterTypes,
    setActiveView,
    toggleFilterType,
  } = useCalendarStore();

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Today reference
  const todayDateStr = useMemo(() => new Date().toLocaleDateString('en-CA'), []);

  // Navigation state (defaults to current date)
  const [currentYear, setCurrentYear] = useState<number>(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(() => new Date().getMonth());
  const [weekAnchorDate, setWeekAnchorDate] = useState<Date>(() => new Date());

  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [clickedDate, setClickedDate] = useState<string>(() => todayDateStr);

  // Month & Week navigation helpers
  const handlePrev = () => {
    if (activeView === 'week') {
      const prevWeek = new Date(weekAnchorDate);
      prevWeek.setDate(prevWeek.getDate() - 7);
      setWeekAnchorDate(prevWeek);
      setCurrentMonth(prevWeek.getMonth());
      setCurrentYear(prevWeek.getFullYear());
    } else {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear((y) => y - 1);
      } else {
        setCurrentMonth((m) => m - 1);
      }
    }
  };

  const handleNext = () => {
    if (activeView === 'week') {
      const nextWeek = new Date(weekAnchorDate);
      nextWeek.setDate(nextWeek.getDate() + 7);
      setWeekAnchorDate(nextWeek);
      setCurrentMonth(nextWeek.getMonth());
      setCurrentYear(nextWeek.getFullYear());
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear((y) => y + 1);
      } else {
        setCurrentMonth((m) => m + 1);
      }
    }
  };

  const handleGoToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    setWeekAnchorDate(now);
    setClickedDate(now.toLocaleDateString('en-CA'));
  };

  const monthName = useMemo(() => {
    if (activeView === 'week') {
      const dayOfWeek = weekAnchorDate.getDay();
      const sunday = new Date(weekAnchorDate);
      sunday.setDate(weekAnchorDate.getDate() - dayOfWeek);
      const saturday = new Date(sunday);
      saturday.setDate(sunday.getDate() + 6);

      const sunMonth = sunday.toLocaleDateString(undefined, { month: 'short' });
      const satMonth = saturday.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
      return `${sunMonth} ${sunday.getDate()} - ${satMonth} ${saturday.getDate()}`;
    }
    return new Date(currentYear, currentMonth).toLocaleDateString(undefined, {
      month: 'long',
      year: 'numeric',
    });
  }, [activeView, currentYear, currentMonth, weekAnchorDate]);

  // Filter events based on active toggles
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (e.type === 'event' && !filterTypes.events) return false;
      if (e.type === 'task' && !filterTypes.tasks) return false;
      if (e.type === 'reminder' && !filterTypes.reminders) return false;
      return true;
    });
  }, [events, filterTypes]);

  // Calculate Month Grid (6 rows x 7 days)
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const days: Array<{
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
      const dateStr = `${prevYear}-${mStr}-${dStr}`;
      days.push({
        dayNumber: day,
        dateStr,
        isCurrentMonth: false,
        isToday: dateStr === todayDateStr,
      });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const mStr = String(currentMonth + 1).padStart(2, '0');
      const dStr = String(day).padStart(2, '0');
      const dateStr = `${currentYear}-${mStr}-${dStr}`;
      days.push({
        dayNumber: day,
        dateStr,
        isCurrentMonth: true,
        isToday: dateStr === todayDateStr,
      });
    }

    // Next month leading days
    const remaining = (7 - (days.length % 7)) % 7;
    for (let day = 1; day <= remaining; day++) {
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      const mStr = String(nextMonth + 1).padStart(2, '0');
      const dStr = String(day).padStart(2, '0');
      const dateStr = `${nextYear}-${mStr}-${dStr}`;
      days.push({
        dayNumber: day,
        dateStr,
        isCurrentMonth: false,
        isToday: dateStr === todayDateStr,
      });
    }

    return days;
  }, [currentYear, currentMonth, todayDateStr]);

  // Calculate Week Days dynamically based on weekAnchorDate
  const weekDays = useMemo(() => {
    const dayOfWeek = weekAnchorDate.getDay();
    const sunday = new Date(weekAnchorDate);
    sunday.setDate(weekAnchorDate.getDate() - dayOfWeek);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const date = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${date}`;
      days.push({
        name: WEEKDAYS[i],
        dateStr,
        dayNumber: d.getDate(),
        isToday: dateStr === todayDateStr,
      });
    }
    return days;
  }, [weekAnchorDate, todayDateStr]);

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

  return (
    <div className="pcc-calendar-page" id="calendar-page-root">
      {/* Calendar Top Toolbar */}
      <div className="pcc-calendar__header">
        <div className="pcc-calendar__nav">
          <h2 className="pcc-calendar__title">{monthName}</h2>
          <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
            <Button variant="ghost" size="sm" onClick={handlePrev} aria-label={activeView === 'week' ? 'Previous Week' : 'Previous Month'}>
              &larr;
            </Button>
            <Button variant="secondary" size="sm" onClick={handleGoToday}>
              Today
            </Button>
            <Button variant="ghost" size="sm" onClick={handleNext} aria-label={activeView === 'week' ? 'Next Week' : 'Next Month'}>
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
              setClickedDate(todayDateStr);
              setIsCreateModalOpen(true);
            }}
          >
            Add Event
          </Button>
        </div>
      </div>

      {isLoading && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '3rem 0' }}>
          <Spinner size="md" />
        </div>
      )}

      {!isLoading && activeView === 'month' && (
        <div className="pcc-calendar-grid-container" id="calendar-month-container">
          <div className="pcc-calendar-weekday-header">
            {WEEKDAYS.map((day) => (
              <div key={day} className="pcc-calendar-weekday-cell">
                {day}
              </div>
            ))}
          </div>

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

      {!isLoading && activeView === 'week' && (
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

      {!isLoading && activeView === 'day' && (
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

      {!isLoading && activeView === 'agenda' && (
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
