interface BACGaugeProps {
  bac: number;
  quality: 'green' | 'yellow' | 'red';
}

export function BACGauge({ bac, quality }: BACGaugeProps) {
  // Ring parameters
  const size = 200;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // BAC typically 0-0.15 range, map to 0-100%
  const maxBAC = 0.15;
  const percent = Math.min(bac / maxBAC, 1);
  const offset = circumference * (1 - percent);

  const colorMap = {
    green: '#34d399',
    yellow: '#fbbf24',
    red: '#f87171',
  };
  const glowMap = {
    green: 'rgba(52, 211, 153, 0.3)',
    yellow: 'rgba(251, 191, 36, 0.3)',
    red: 'rgba(248, 113, 113, 0.3)',
  };

  const color = colorMap[quality];
  const glow = glowMap[quality];

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        {/* Colored progress ring */}
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
          style={{
            filter: `drop-shadow(0 0 8px ${glow})`,
          }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-4xl font-bold tracking-tight"
          style={{ color }}
        >
          {bac < 0.001 ? '0.000' : bac.toFixed(3)}
        </span>
        <span className="text-xs text-text-muted mt-1">BAC</span>
      </div>
    </div>
  );
}
