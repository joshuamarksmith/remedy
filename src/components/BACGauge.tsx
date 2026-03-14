import { memo } from 'react';
import { formatBAC } from '../lib/bac';
import { COLORS, type SleepQuality } from '../lib/theme';

interface BACGaugeProps {
  bac: number;
  quality: SleepQuality;
}

export const BACGauge = memo(function BACGauge({ bac, quality }: BACGaugeProps) {
  const size = 200;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const maxBAC = 0.15;
  const percent = Math.min(bac / maxBAC, 1);
  const offset = circumference * (1 - percent);

  const color = COLORS[quality].hex;
  const glow = `rgba(${COLORS[quality].rgb}, 0.3)`;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="gauge-ring"
          style={{ filter: `drop-shadow(0 0 8px ${glow})` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold tracking-tight" style={{ color }}>
          {formatBAC(bac)}
        </span>
        <span className="text-xs text-text-muted mt-1">BAC</span>
      </div>
    </div>
  );
});
