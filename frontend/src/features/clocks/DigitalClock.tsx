import React from 'react';
import { TimeFormat } from './types';

interface DigitalClockProps {
  hours12: number;
  hours24: number;
  minutes: number;
  seconds: number;
  period: 'AM' | 'PM';
  timeFormat?: TimeFormat;
  size?: 'hero' | 'card' | 'sm';
  showSeconds?: boolean;
  className?: string;
}

export const DigitalClock: React.FC<DigitalClockProps> = ({
  hours12,
  hours24,
  minutes,
  seconds,
  period,
  timeFormat = '12h',
  size = 'card',
  showSeconds = true,
  className = '',
}) => {
  const is24h = timeFormat === '24h';
  const displayHours = is24h
    ? hours24.toString().padStart(2, '0')
    : hours12.toString().padStart(2, '0');
  const displayMinutes = minutes.toString().padStart(2, '0');
  const displaySeconds = seconds.toString().padStart(2, '0');

  return (
    <div className={`pcc-digital-clock pcc-digital-clock--${size} ${className}`}>
      <div className="pcc-digital-clock__digits">
        <span className="pcc-digital-clock__hours">{displayHours}</span>
        <span className="pcc-digital-clock__separator">:</span>
        <span className="pcc-digital-clock__minutes">{displayMinutes}</span>
        {showSeconds && (
          <span className="pcc-digital-clock__seconds">:{displaySeconds}</span>
        )}
      </div>

      {!is24h && (
        <span className={`pcc-digital-clock__period pcc-digital-clock__period--${period.toLowerCase()}`}>
          {period}
        </span>
      )}
    </div>
  );
};
