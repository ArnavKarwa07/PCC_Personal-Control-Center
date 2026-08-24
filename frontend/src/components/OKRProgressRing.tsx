import React from 'react';
import './OKRProgressRing.css';

export interface OKRProgressRingProps {
  progress: number; // 0 to 100
  size?: number; // width & height in px, e.g. 84
  strokeWidth?: number; // ring stroke width in px, e.g. 8
  showPercentage?: boolean;
  status?: string;
  className?: string;
}

export const OKRProgressRing: React.FC<OKRProgressRingProps> = ({
  progress,
  size = 84,
  strokeWidth = 8,
  showPercentage = true,
  status,
  className = '',
}) => {
  const safeProgress = typeof progress === 'number' && !isNaN(progress) ? progress : 0;
  const normalizedProgress = Math.min(100, Math.max(0, safeProgress));
  // Keep stroke and linecaps safely inside container bounds
  const padding = 2; 
  const radius = (size - strokeWidth - padding * 2) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedProgress / 100) * circumference;

  // Determine dynamic high-contrast stroke color base
  const getStrokeVariantClass = () => {
    if (status === 'Completed' || normalizedProgress === 100) return 'okr-ring--completed';
    if (normalizedProgress >= 70) return 'okr-ring--high';
    if (normalizedProgress >= 40) return 'okr-ring--medium';
    return 'okr-ring--low';
  };

  const ringVariant = getStrokeVariantClass();
  const gradientId = `okr-grad-${Math.round(size)}-${Math.round(normalizedProgress)}`;

  return (
    <div
      className={`pcc-okr-ring-container ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
      role="progressbar"
      aria-valuenow={normalizedProgress}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className={`pcc-okr-ring-svg ${ringVariant}`}
      >
        <defs>
          <linearGradient id={`${gradientId}-high`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4f46e5" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
          <linearGradient id={`${gradientId}-completed`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#16a34a" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
          <linearGradient id={`${gradientId}-medium`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
          <linearGradient id={`${gradientId}-low`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
        </defs>

        {/* Background Track Circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          strokeWidth={strokeWidth}
          className="pcc-okr-ring__track"
        />

        {/* Animated Progress Circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="pcc-okr-ring__fill"
        />

        {/* Center Percentage Display */}
        {showPercentage && (
          <text
            x="50%"
            y="50%"
            dominantBaseline="central"
            textAnchor="middle"
            className="pcc-okr-ring__text"
          >
            {Math.round(normalizedProgress)}%
          </text>
        )}
      </svg>
    </div>
  );
};

export default OKRProgressRing;
