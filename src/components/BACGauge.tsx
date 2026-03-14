import { memo } from 'react';
import { formatBAC } from '../lib/bac';
import { COLORS, type SleepQuality } from '../lib/theme';

interface BACGaugeProps {
  bac: number;
  quality: SleepQuality;
}

export const BACGauge = memo(function BACGauge({ bac, quality }: BACGaugeProps) {
  const color = COLORS[quality].hex;
  const glow = `rgba(${COLORS[quality].rgb}, 0.15)`;

  return (
    <div
      className="flex flex-col items-center justify-center rounded-2xl py-6 px-8"
      style={{ backgroundColor: glow }}
    >
      <span
        className="text-5xl font-bold tracking-tight transition-colors duration-500"
        style={{ color }}
      >
        {formatBAC(bac)}
      </span>
      <span className="text-sm text-text-muted mt-1">BAC</span>
    </div>
  );
});
