/* ==========================================================================
   PCC (Personal Control Center) - World Clocks Types
   ========================================================================== */

export type ClockViewMode = 'both' | 'analog' | 'digital';
export type TimeFormat = '12h' | '24h';

export interface WorldClockItem {
  id: string;
  cityName: string;
  country: string;
  timezone: string; // IANA timezone string, e.g. 'Asia/Kolkata'
  abbreviation: string; // e.g. 'IST', 'UTC', 'EST'
  pinned?: boolean;
  customLabel?: string;
  flag?: string;
  color?: string;
}

export type RegionCategory =
  | 'All'
  | 'Asia'
  | 'Americas'
  | 'Europe'
  | 'Pacific'
  | 'Africa'
  | 'Middle East'
  | 'UTC';

export interface CityPreset {
  cityName: string;
  country: string;
  timezone: string;
  abbreviation: string;
  region: 'Asia' | 'Americas' | 'Europe' | 'Pacific' | 'Africa' | 'Middle East' | 'UTC';
  flag: string;
  popular?: boolean;
}

export type DayNightPeriod = 'night' | 'dawn' | 'day' | 'dusk';

export interface FormattedTimezoneTime {
  hours24: number;
  hours12: number;
  minutes: number;
  seconds: number;
  period: 'AM' | 'PM';
  formattedTime12: string;
  formattedTime24: string;
  formattedTimeShort: string;
  formattedSeconds: string;
  dayPeriod: string;
  formattedDate: string;
  dayName: string;
  utcOffsetStr: string;
  offsetMinutes: number;
  relativeDiffMinutes: number;
  relativeDiffStr: string;
  dayRelation: 'today' | 'tomorrow' | 'yesterday';
  dayNightPeriod: DayNightPeriod;
  isWorkingHours: boolean;
  workingStatusText: string;
}

export interface MeetingOverlapSlot {
  hourIndex: number; // 0 to 23
  sourceHour: number;
  sourceTimeFormatted: string;
  sourceIsWork: boolean;
  targetHour: number;
  targetTimeFormatted: string;
  targetIsWork: boolean;
  isMutualWorkHour: boolean;
}
