/* ==========================================================================
   PCC (Personal Control Center) - Timezone Utilities
   ========================================================================== */

import {
  FormattedTimezoneTime,
  DayNightPeriod,
  MeetingOverlapSlot,
} from './types';

/**
 * Calculates UTC offset in minutes for any IANA timezone at a specific date
 */
export function getTimezoneOffsetMinutes(timeZone: string, date: Date = new Date()): number {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false,
    });
    const parts = formatter.formatToParts(date);
    const getPart = (type: string) => parseInt(parts.find((p) => p.type === type)?.value || '0', 10);

    const year = getPart('year');
    const month = getPart('month') - 1;
    const day = getPart('day');
    let hour = getPart('hour');
    if (hour === 24) hour = 0;
    const minute = getPart('minute');
    const second = getPart('second');

    const tzAsUtcMs = Date.UTC(year, month, day, hour, minute, second);
    const realUtcMs = date.getTime();
    return Math.round((tzAsUtcMs - realUtcMs) / 60000);
  } catch {
    return 0;
  }
}

/**
 * Formats minute offset to standard string, e.g. "+05:30", "-04:00", "UTC+00:00"
 */
export function formatUtcOffset(offsetMinutes: number): string {
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const absMinutes = Math.abs(offsetMinutes);
  const hours = Math.floor(absMinutes / 60);
  const minutes = absMinutes % 60;
  return `UTC${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Formats relative time difference between a target timezone and local client time
 */
export function formatRelativeDifference(diffMinutes: number): string {
  if (diffMinutes === 0) {
    return 'Same time as you';
  }

  const isAhead = diffMinutes > 0;
  const absMinutes = Math.abs(diffMinutes);
  const hours = Math.floor(absMinutes / 60);
  const mins = absMinutes % 60;

  let timePart = '';
  if (hours > 0 && mins > 0) {
    timePart = `${hours}h ${mins}m`;
  } else if (hours > 0) {
    timePart = `${hours} hr${hours > 1 ? 's' : ''}`;
  } else {
    timePart = `${mins} min${mins > 1 ? 's' : ''}`;
  }

  return `${timePart} ${isAhead ? 'ahead' : 'behind'}`;
}

/**
 * Computes comprehensive time details for a given timezone
 */
export function getTimeInTimezone(timeZone: string, date: Date = new Date()): FormattedTimezoneTime {
  let targetDate = date;
  let tzOptions: Intl.DateTimeFormatOptions = {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  };

  // Safe fallback if invalid timezone is passed
  let parts: Intl.DateTimeFormatPart[] = [];
  try {
    const formatter = new Intl.DateTimeFormat('en-US', tzOptions);
    parts = formatter.formatToParts(targetDate);
  } catch {
    tzOptions.timeZone = 'UTC';
    const fallbackFormatter = new Intl.DateTimeFormat('en-US', tzOptions);
    parts = fallbackFormatter.formatToParts(targetDate);
  }

  let hour24Str = '00';
  let minuteStr = '00';
  let secondStr = '00';
  let dayStr = '01';
  let monthStr = 'Jan';
  let yearStr = '2026';
  let weekdayStr = 'Sun';

  for (const part of parts) {
    if (part.type === 'hour') hour24Str = part.value;
    else if (part.type === 'minute') minuteStr = part.value;
    else if (part.type === 'second') secondStr = part.value;
    else if (part.type === 'day') dayStr = part.value;
    else if (part.type === 'month') monthStr = part.value;
    else if (part.type === 'year') yearStr = part.value;
    else if (part.type === 'weekday') weekdayStr = part.value;
  }

  const hours24 = parseInt(hour24Str, 10) % 24;
  const minutes = parseInt(minuteStr, 10);
  const seconds = parseInt(secondStr, 10);
  const period: 'AM' | 'PM' = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;

  const formattedTime12 = `${hours12.toString().padStart(2, '0')}:${minuteStr} ${period}`;
  const formattedTime24 = `${hours24.toString().padStart(2, '0')}:${minuteStr}`;
  const formattedTimeShort = `${hours12.toString().padStart(2, '0')}:${minuteStr}`;
  const formattedSeconds = `:${secondStr}`;
  const formattedDate = `${weekdayStr}, ${monthStr} ${dayStr}, ${yearStr}`;

  // UTC offset
  const offsetMinutes = getTimezoneOffsetMinutes(tzOptions.timeZone || 'UTC', targetDate);
  const utcOffsetStr = formatUtcOffset(offsetMinutes);

  // Local client offset
  const localOffsetMinutes = -targetDate.getTimezoneOffset();
  const relativeDiffMinutes = offsetMinutes - localOffsetMinutes;
  const relativeDiffStr = formatRelativeDifference(relativeDiffMinutes);

  // Determine day relation (today, tomorrow, yesterday) compared to client local date
  const localYear = targetDate.getFullYear();
  const localMonth = targetDate.getMonth(); // 0-indexed
  const localDay = targetDate.getDate();

  // Convert parsed target date
  const targetYearNum = parseInt(yearStr, 10);
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const targetMonthNum = monthNames.indexOf(monthStr);
  const targetDayNum = parseInt(dayStr, 10);

  let dayRelation: 'today' | 'tomorrow' | 'yesterday' = 'today';
  const localEpochDay = Math.floor(Date.UTC(localYear, localMonth, localDay) / 86400000);
  const targetEpochDay = Math.floor(Date.UTC(targetYearNum, targetMonthNum, targetDayNum) / 86400000);

  if (targetEpochDay > localEpochDay) {
    dayRelation = 'tomorrow';
  } else if (targetEpochDay < localEpochDay) {
    dayRelation = 'yesterday';
  }

  // Day/Night period
  let dayNightPeriod: DayNightPeriod = 'day';
  if (hours24 >= 5 && hours24 < 7) {
    dayNightPeriod = 'dawn';
  } else if (hours24 >= 7 && hours24 < 18) {
    dayNightPeriod = 'day';
  } else if (hours24 >= 18 && hours24 < 20) {
    dayNightPeriod = 'dusk';
  } else {
    dayNightPeriod = 'night';
  }

  // Working hours
  const isWeekend = weekdayStr === 'Sat' || weekdayStr === 'Sun';
  const isWorkingHours = !isWeekend && hours24 >= 9 && hours24 < 18;

  let workingStatusText = 'Working Hours (9:00 - 18:00)';
  if (isWeekend) {
    workingStatusText = 'Weekend';
  } else if (hours24 >= 9 && hours24 < 18) {
    workingStatusText = 'Active Business Hours';
  } else if (hours24 >= 6 && hours24 < 9) {
    workingStatusText = 'Early Morning';
  } else if (hours24 >= 18 && hours24 < 22) {
    workingStatusText = 'Evening / After Hours';
  } else {
    workingStatusText = 'Night / Off Hours';
  }

  return {
    hours24,
    hours12,
    minutes,
    seconds,
    period,
    formattedTime12,
    formattedTime24,
    formattedTimeShort,
    formattedSeconds,
    dayPeriod: period,
    formattedDate,
    dayName: weekdayStr,
    utcOffsetStr,
    offsetMinutes,
    relativeDiffMinutes,
    relativeDiffStr,
    dayRelation,
    dayNightPeriod,
    isWorkingHours,
    workingStatusText,
  };
}

/**
 * Calculates rotation angles for SVG analog clock hands
 */
export function getAnalogAngles(hours: number, minutes: number, seconds: number) {
  const secondAngle = seconds * 6; // 360 deg / 60 sec = 6 deg/sec
  const minuteAngle = (minutes + seconds / 60) * 6; // 360 / 60
  const hourAngle = ((hours % 12) + minutes / 60 + seconds / 3600) * 30; // 360 / 12 = 30 deg/hr

  return {
    hourAngle,
    minuteAngle,
    secondAngle,
  };
}

/**
 * Generates 24-hour overlap timeline comparison between two timezones
 */
export function generateMeetingOverlapTimeline(
  sourceTz: string,
  targetTz: string,
  baseDate: Date = new Date()
): MeetingOverlapSlot[] {
  const slots: MeetingOverlapSlot[] = [];

  const sourceOffset = getTimezoneOffsetMinutes(sourceTz, baseDate);
  const targetOffset = getTimezoneOffsetMinutes(targetTz, baseDate);
  const offsetDiffMinutes = targetOffset - sourceOffset;

  // Use baseDate midnight in source timezone
  for (let hour = 0; hour < 24; hour++) {
    const sourceHour = hour;
    const sourceIsWork = sourceHour >= 9 && sourceHour < 18;
    const sourcePeriod = sourceHour >= 12 ? 'PM' : 'AM';
    const source12 = sourceHour % 12 === 0 ? 12 : sourceHour % 12;
    const sourceTimeFormatted = `${source12}:00 ${sourcePeriod}`;

    // Target hour calculated via minute difference
    const totalTargetMinutes = sourceHour * 60 + offsetDiffMinutes;
    // Normalize to 0-1439
    const normalizedMinutes = ((totalTargetMinutes % 1440) + 1440) % 1440;
    const targetHour = Math.floor(normalizedMinutes / 60);
    const targetMinute = normalizedMinutes % 60;
    const targetIsWork = targetHour >= 9 && targetHour < 18;
    const targetPeriod = targetHour >= 12 ? 'PM' : 'AM';
    const target12 = targetHour % 12 === 0 ? 12 : targetHour % 12;
    const minPad = targetMinute > 0 ? `:${targetMinute.toString().padStart(2, '0')}` : ':00';
    const targetTimeFormatted = `${target12}${minPad} ${targetPeriod}`;

    const isMutualWorkHour = sourceIsWork && targetIsWork;

    slots.push({
      hourIndex: hour,
      sourceHour,
      sourceTimeFormatted,
      sourceIsWork,
      targetHour,
      targetTimeFormatted,
      targetIsWork,
      isMutualWorkHour,
    });
  }

  return slots;
}
