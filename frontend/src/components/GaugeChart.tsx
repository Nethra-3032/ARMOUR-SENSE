import React from 'react';

interface GaugeChartProps {
  value: number; // 0 to 100
  label?: string;
  size?: number;
  sublabel?: string;
}

export const GaugeChart: React.FC<GaugeChartProps> = ({
  value,
  label = 'RISK SCORE',
  size = 200,
  sublabel
}) => {
  // Clamp value between 0 and 100
  const clamped = Math.min(100, Math.max(0, value));
  
  // Color determination based on risk thresholds
  let color = '#10b981'; // Green
  let glowColor = 'rgba(16, 185, 129, 0.4)';
  let statusText = 'NOMINAL';

  if (clamped >= 70) {
    color = '#ef4444'; // Red
    glowColor = 'rgba(239, 68, 68, 0.6)';
    statusText = 'CRITICAL';
  } else if (clamped >= 40) {
    color = '#f97316'; // Orange
    glowColor = 'rgba(249, 115, 22, 0.5)';
    statusText = 'HIGH RISK';
  } else if (clamped >= 15) {
    color = '#f59e0b'; // Amber
    glowColor = 'rgba(245, 158, 11, 0.4)';
    statusText = 'MODERATE';
  }

  // Semi-circle arc SVG math
  const strokeWidth = 14;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = Math.PI * radius; // 180 deg semi circle
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center relative select-none">
      <svg
        width={size}
        height={size / 2 + 30}
        viewBox={`0 0 ${size} ${size / 2 + 30}`}
        className="overflow-visible"
      >
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="35%" stopColor="#f59e0b" />
            <stop offset="65%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Background Track */}
        <path
          d={`M ${strokeWidth} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth} ${size / 2}`}
          fill="none"
          stroke="#1e293b"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Foreground Progress Arc */}
        <path
          d={`M ${strokeWidth} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth} ${size / 2}`}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{
            transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.4s ease',
            filter: `drop-shadow(0 0 8px ${glowColor})`,
          }}
        />

        {/* Tick marks */}
        {[0, 25, 50, 75, 100].map((tick) => {
          const angle = Math.PI * (1 - tick / 100);
          const r1 = radius - 16;
          const r2 = radius - 22;
          const cx = size / 2;
          const cy = size / 2;
          const x1 = cx + r1 * Math.cos(angle);
          const y1 = cy - r1 * Math.sin(angle);
          const x2 = cx + r2 * Math.cos(angle);
          const y2 = cy - r2 * Math.sin(angle);
          return (
            <line
              key={tick}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#475569"
              strokeWidth="2"
            />
          );
        })}
      </svg>

      {/* Central Readout */}
      <div
        className="absolute flex flex-col items-center justify-center text-center"
        style={{ top: `${size / 2 - 38}px` }}
      >
        <span className="text-3xl lg:text-4xl font-extrabold font-orbitron tracking-tight text-white drop-shadow-md">
          {clamped.toFixed(1)}
          <span className="text-sm font-sans font-normal text-slate-400 ml-0.5">%</span>
        </span>
        <span
          className="text-[11px] font-mono-code font-bold tracking-wider px-2 py-0.5 rounded uppercase mt-0.5"
          style={{ color, backgroundColor: `${color}15`, border: `1px solid ${color}30` }}
        >
          {statusText}
        </span>
      </div>

      <div className="mt-2 text-center">
        <p className="text-xs font-mono-code uppercase tracking-wider text-slate-400 font-semibold">
          {label}
        </p>
        {sublabel && (
          <p className="text-[11px] text-slate-500 font-mono-code">{sublabel}</p>
        )}
      </div>
    </div>
  );
};
