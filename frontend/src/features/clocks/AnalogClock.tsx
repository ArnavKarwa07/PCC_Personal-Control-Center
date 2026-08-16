import React, { useId } from 'react';
import { getAnalogAngles } from './timezoneUtils';
import { DayNightPeriod } from './types';

interface AnalogClockProps {
  hours: number;
  minutes: number;
  seconds: number;
  dayNightPeriod?: DayNightPeriod;
  size?: 'sm' | 'md' | 'lg';
  showTicks?: boolean;
  showNumbers?: boolean;
  className?: string;
}

export const AnalogClock: React.FC<AnalogClockProps> = ({
  hours,
  minutes,
  seconds,
  dayNightPeriod = 'day',
  size = 'md',
  showTicks = true,
  showNumbers = true,
  className = '',
}) => {
  const uniqueId = useId().replace(/:/g, '-');
  const shadowFilterId = `clock-shadow-${uniqueId}`;
  const gradientId = `clock-face-grad-${uniqueId}`;

  const { hourAngle, minuteAngle, secondAngle } = getAnalogAngles(hours, minutes, seconds);

  const sizeMap = {
    sm: 110,
    md: 150,
    lg: 200,
  };

  const dimension = sizeMap[size];
  const center = dimension / 2;
  const radius = center - 8;

  // Generate 12 hour ticks
  const hourTicks = Array.from({ length: 12 }, (_, i) => {
    const angle = (i * 30 * Math.PI) / 180;
    const isMain = i % 3 === 0;
    const tickLength = isMain ? (size === 'sm' ? 6 : 9) : size === 'sm' ? 4 : 6;
    const outerR = radius - 2;
    const innerR = outerR - tickLength;

    return {
      x1: center + innerR * Math.sin(angle),
      y1: center - innerR * Math.cos(angle),
      x2: center + outerR * Math.sin(angle),
      y2: center - outerR * Math.cos(angle),
      isMain,
      index: i,
    };
  });

  // Numerals positions (12, 3, 6, 9)
  const numbers = [12, 3, 6, 9].map((num) => {
    const angle = (num * 30 * Math.PI) / 180;
    const numR = radius - (size === 'sm' ? 14 : 18);
    const x = center + numR * Math.sin(angle);
    const y = center - numR * Math.cos(angle);
    return { num, x, y };
  });

  // Theme based gradient classes
  const periodClass = `pcc-analog-clock--${dayNightPeriod}`;

  return (
    <div className={`pcc-analog-clock-wrapper ${periodClass} ${className}`}>
      <svg
        width={dimension}
        height={dimension}
        viewBox={`0 0 ${dimension} ${dimension}`}
        className="pcc-analog-clock-svg"
      >
        <defs>
          <filter id={shadowFilterId} x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.12" />
          </filter>
          <radialGradient id={gradientId} cx="50%" cy="50%" r="50%">
            {dayNightPeriod === 'night' ? (
              <>
                <stop offset="0%" stopColor="#1e1e38" />
                <stop offset="100%" stopColor="#101020" />
              </>
            ) : dayNightPeriod === 'dawn' ? (
              <>
                <stop offset="0%" stopColor="#fef3c7" />
                <stop offset="100%" stopColor="#fed7aa" />
              </>
            ) : dayNightPeriod === 'dusk' ? (
              <>
                <stop offset="0%" stopColor="#fde68a" />
                <stop offset="100%" stopColor="#fbcfe8" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#f1f5f9" />
              </>
            )}
          </radialGradient>
        </defs>

        {/* Outer Bezel */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          className="pcc-analog-clock__bezel"
          fill={`url(#${gradientId})`}
        />

        {/* Ticks */}
        {showTicks &&
          hourTicks.map((tick) => (
            <line
              key={tick.index}
              x1={tick.x1}
              y1={tick.y1}
              x2={tick.x2}
              y2={tick.y2}
              className={`pcc-analog-clock__tick ${tick.isMain ? 'pcc-analog-clock__tick--main' : ''}`}
            />
          ))}

        {/* Hour Numbers */}
        {showNumbers &&
          numbers.map(({ num, x, y }) => (
            <text
              key={num}
              x={x}
              y={y}
              className="pcc-analog-clock__number"
              dominantBaseline="central"
              textAnchor="middle"
              style={{ fontSize: size === 'sm' ? '8px' : size === 'md' ? '11px' : '13px' }}
            >
              {num}
            </text>
          ))}

        {/* Day/Night icon hint inside dial */}
        <g transform={`translate(${center - 8}, ${center + radius * 0.4})`} opacity="0.6">
          {dayNightPeriod === 'night' ? (
            <path
              d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"
              transform="scale(0.7)"
              fill="currentColor"
              className="pcc-analog-clock__night-symbol"
            />
          ) : (
            <circle
              cx="8"
              cy="8"
              r="4"
              fill="currentColor"
              className="pcc-analog-clock__day-symbol"
            />
          )}
        </g>

        {/* Hour Hand */}
        <line
          x1={center}
          y1={center}
          x2={center}
          y2={center - radius * 0.52}
          transform={`rotate(${hourAngle} ${center} ${center})`}
          className="pcc-analog-clock__hour-hand"
        />

        {/* Minute Hand */}
        <line
          x1={center}
          y1={center}
          x2={center}
          y2={center - radius * 0.76}
          transform={`rotate(${minuteAngle} ${center} ${center})`}
          className="pcc-analog-clock__minute-hand"
        />

        {/* Second Hand */}
        <line
          x1={center}
          y1={center + radius * 0.18}
          x2={center}
          y2={center - radius * 0.88}
          transform={`rotate(${secondAngle} ${center} ${center})`}
          className="pcc-analog-clock__second-hand"
        />

        {/* Center Pivot Pin */}
        <circle cx={center} cy={center} r={size === 'sm' ? 3.5 : 5} className="pcc-analog-clock__pin-outer" />
        <circle cx={center} cy={center} r={size === 'sm' ? 1.5 : 2.5} className="pcc-analog-clock__pin-inner" />
      </svg>
    </div>
  );
};
