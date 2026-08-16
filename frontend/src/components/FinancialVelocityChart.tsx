import React, { useState, useRef } from 'react';
import './FinancialVelocityChart.css';

export interface VelocityDataPoint {
  month: string;
  income: number;
  expenses: number;
  velocity: number; // Net cashflow velocity = income - expenses
}

export interface FinancialVelocityChartProps {
  data?: VelocityDataPoint[];
  title?: string;
  subtitle?: string;
  height?: number;
  className?: string;
}

const DEFAULT_DATA: VelocityDataPoint[] = [
  { month: 'Mar', income: 145000, expenses: 58000, velocity: 87000 },
  { month: 'Apr', income: 155000, expenses: 52000, velocity: 103000 },
  { month: 'May', income: 160000, expenses: 55000, velocity: 105000 },
  { month: 'Jun', income: 172000, expenses: 49000, velocity: 123000 },
  { month: 'Jul', income: 180000, expenses: 44000, velocity: 136000 },
  { month: 'Aug', income: 185000, expenses: 42000, velocity: 143000 },
];

export const FinancialVelocityChart: React.FC<FinancialVelocityChartProps> = ({
  data = DEFAULT_DATA,
  title = '6-Month Cashflow Velocity Trend',
  subtitle = 'Smooth net income trajectory & area fill (INR ₹)',
  height = 240,
  className = '',
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const viewBoxWidth = 640;
  const viewBoxHeight = height;
  const paddingLeft = 60;
  const paddingRight = 40;
  const paddingTop = 30;
  const paddingBottom = 45;

  const chartWidth = viewBoxWidth - paddingLeft - paddingRight;
  const chartHeight = viewBoxHeight - paddingTop - paddingBottom;

  // Min and Max calculation with padding
  const minVelocity = Math.min(...data.map((d) => d.velocity));
  const maxVelocity = Math.max(...data.map((d) => d.velocity));
  const minVal = Math.floor((minVelocity * 0.85) / 10000) * 10000;
  const maxVal = Math.ceil((maxVelocity * 1.1) / 10000) * 10000;
  const range = maxVal - minVal || 1;

  // Calculate coordinates for points
  const points = data.map((d, i) => {
    const x = paddingLeft + (i / (data.length - 1)) * chartWidth;
    const y = paddingTop + chartHeight - ((d.velocity - minVal) / range) * chartHeight;
    return { x, y, data: d };
  });

  const baselineY = paddingTop + chartHeight;

  // Smooth Bezier path calculation
  const getSmoothPath = () => {
    if (points.length === 0) return { linePath: '', areaPath: '' };
    if (points.length === 1) return { linePath: `M ${points[0].x} ${points[0].y}`, areaPath: '' };

    let linePath = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? i : i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      linePath += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }

    const firstPt = points[0];
    const lastPt = points[points.length - 1];
    const areaPath = `${linePath} L ${lastPt.x.toFixed(1)} ${baselineY.toFixed(1)} L ${firstPt.x.toFixed(1)} ${baselineY.toFixed(1)} Z`;

    return { linePath, areaPath };
  };

  const { linePath, areaPath } = getSmoothPath();

  // Grid tick values (4 horizontal lines)
  const ticks = [0, 0.33, 0.66, 1].map((ratio) => {
    const val = minVal + ratio * range;
    const y = paddingTop + chartHeight - ratio * chartHeight;
    return { val, y };
  });

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const svgX = (mouseX / rect.width) * viewBoxWidth;

    let closestIndex = 0;
    let minDist = Infinity;
    points.forEach((pt, idx) => {
      const dist = Math.abs(pt.x - svgX);
      if (dist < minDist) {
        minDist = dist;
        closestIndex = idx;
      }
    });

    setHoveredIndex(closestIndex);
  };

  const activePoint = hoveredIndex !== null ? points[hoveredIndex] : null;

  return (
    <div className={`pcc-velocity-chart-wrapper ${className}`}>
      {(title || subtitle) && (
        <div className="pcc-velocity-chart-header">
          {title && <h3 className="pcc-velocity-chart-title">{title}</h3>}
          {subtitle && <p className="pcc-velocity-chart-subtitle">{subtitle}</p>}
        </div>
      )}

      <div className="pcc-velocity-chart-container">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
          className="pcc-velocity-chart-svg"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredIndex(null)}
          role="img"
          aria-label="6-Month Cashflow Velocity Line Chart"
        >
          <defs>
            <linearGradient id="velocityAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-accent, #4f46e5)" stopOpacity="0.4" />
              <stop offset="60%" stopColor="var(--color-accent, #4f46e5)" stopOpacity="0.1" />
              <stop offset="100%" stopColor="var(--color-accent, #4f46e5)" stopOpacity="0.0" />
            </linearGradient>

            <linearGradient id="velocityLineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="50%" stopColor="#4f46e5" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>

            <filter id="pccGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="var(--color-accent, #4f46e5)" floodOpacity="0.35" />
            </filter>
          </defs>

          {/* Grid lines and y-axis labels */}
          {ticks.map((tick, idx) => (
            <g key={idx} className="velocity-grid-group">
              <line
                x1={paddingLeft}
                y1={tick.y}
                x2={viewBoxWidth - paddingRight}
                y2={tick.y}
                className="velocity-grid-line"
              />
              <text
                x={paddingLeft - 10}
                y={tick.y + 4}
                className="velocity-axis-label velocity-axis-label--y"
                textAnchor="end"
              >
                ₹{(tick.val / 1000).toFixed(0)}k
              </text>
            </g>
          ))}

          {/* Gradient Area Fill */}
          <path d={areaPath} fill="url(#velocityAreaGradient)" />

          {/* Smooth Line */}
          <path
            d={linePath}
            fill="none"
            stroke="url(#velocityLineGradient)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#pccGlow)"
          />

          {/* X-axis Month Labels */}
          {points.map((pt, i) => (
            <text
              key={i}
              x={pt.x}
              y={baselineY + 22}
              className={`velocity-axis-label velocity-axis-label--x ${hoveredIndex === i ? 'velocity-axis-label--active' : ''}`}
              textAnchor="middle"
            >
              {pt.data.month}
            </text>
          ))}

          {/* Data Points */}
          {points.map((pt, i) => {
            const isHovered = hoveredIndex === i;
            return (
              <g key={i} className="velocity-point-group">
                {/* Hitbox area */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={14}
                  fill="transparent"
                  className="velocity-hitbox"
                  onMouseEnter={() => setHoveredIndex(i)}
                />
                {/* Point circle */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 6 : 4}
                  className={`velocity-point ${isHovered ? 'velocity-point--active' : ''}`}
                />
              </g>
            );
          })}

          {/* Interactive Hover Vertical Guide & Tooltip */}
          {activePoint && (
            <g className="velocity-active-overlay">
              {/* Dashed vertical indicator line */}
              <line
                x1={activePoint.x}
                y1={paddingTop}
                x2={activePoint.x}
                y2={baselineY}
                className="velocity-active-line"
              />

              {/* Halo circle */}
              <circle
                cx={activePoint.x}
                cy={activePoint.y}
                r={9}
                className="velocity-halo-ring"
              />

              {/* Floating Tooltip Box */}
              {(() => {
                const tooltipWidth = 165;
                const tooltipHeight = 72;
                let tooltipX = activePoint.x - tooltipWidth / 2;
                if (tooltipX < paddingLeft) tooltipX = paddingLeft;
                if (tooltipX + tooltipWidth > viewBoxWidth - paddingRight) {
                  tooltipX = viewBoxWidth - paddingRight - tooltipWidth;
                }
                const tooltipY = Math.max(paddingTop, activePoint.y - tooltipHeight - 12);

                return (
                  <g transform={`translate(${tooltipX}, ${tooltipY})`} className="velocity-tooltip-card">
                    <rect
                      width={tooltipWidth}
                      height={tooltipHeight}
                      rx={8}
                      className="velocity-tooltip-bg"
                    />
                    <text x={12} y={20} className="velocity-tooltip-title">
                      {activePoint.data.month} Cashflow Velocity
                    </text>
                    <text x={12} y={40} className="velocity-tooltip-value">
                      Net: +₹{activePoint.data.velocity.toLocaleString('en-IN')}
                    </text>
                    <text x={12} y={58} className="velocity-tooltip-details">
                      In: ₹{(activePoint.data.income / 1000).toFixed(0)}k • Out: ₹{(activePoint.data.expenses / 1000).toFixed(0)}k
                    </text>
                  </g>
                );
              })()}
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};

export default FinancialVelocityChart;
