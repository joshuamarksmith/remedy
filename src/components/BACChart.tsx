import { useRef, useEffect, useMemo } from 'react';
import { generateBACCurve, type Drink, type UserProfile } from '../lib/bac';

interface BACChartProps {
  drinks: Drink[];
  profile: UserProfile;
  hypotheticalDrinks?: Drink[];
}

export function BACChart({ drinks, profile, hypotheticalDrinks = [] }: BACChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const allDrinks = useMemo(() => [...drinks, ...hypotheticalDrinks], [drinks, hypotheticalDrinks]);

  const realCurve = useMemo(
    () => (drinks.length > 0 ? generateBACCurve(drinks, profile, undefined, undefined, 2) : []),
    [drinks, profile]
  );

  const hypotheticalCurve = useMemo(
    () =>
      hypotheticalDrinks.length > 0 && allDrinks.length > 0
        ? generateBACCurve(allDrinks, profile, undefined, undefined, 2)
        : [],
    [allDrinks, profile, hypotheticalDrinks.length]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 2;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const pad = { top: 20, right: 16, bottom: 36, left: 40 };
    const plotW = w - pad.left - pad.right;
    const plotH = h - pad.top - pad.bottom;

    // Clear
    ctx.clearRect(0, 0, w, h);

    const activeCurve = hypotheticalCurve.length > 0 ? hypotheticalCurve : realCurve;
    if (activeCurve.length === 0) return;

    // Determine ranges
    const minTime = activeCurve[0].time;
    const maxTime = activeCurve[activeCurve.length - 1].time;
    const maxBAC = Math.max(0.02, ...activeCurve.map((p) => p.bac)) * 1.15;

    const timeToX = (t: number) => pad.left + ((t - minTime) / (maxTime - minTime)) * plotW;
    const bacToY = (b: number) => pad.top + plotH - (b / maxBAC) * plotH;

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    const bacSteps = [0.02, 0.05, 0.08, 0.10];
    for (const step of bacSteps) {
      if (step > maxBAC) continue;
      const y = bacToY(step);
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(w - pad.right, y);
      ctx.stroke();

      // Label
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.font = '10px -apple-system, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(step.toFixed(2), pad.left - 6, y + 3);
    }

    // Time labels
    const totalMs = maxTime - minTime;
    const hourMs = 60 * 60 * 1000;
    const timeStep = totalMs > 6 * hourMs ? 2 * hourMs : hourMs;
    const firstHour = Math.ceil(minTime / timeStep) * timeStep;

    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.font = '10px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    for (let t = firstHour; t <= maxTime; t += timeStep) {
      const x = timeToX(t);
      const date = new Date(t);
      const label = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      ctx.fillText(label, x, h - pad.bottom + 16);

      // Tick
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.beginPath();
      ctx.moveTo(x, pad.top);
      ctx.lineTo(x, pad.top + plotH);
      ctx.stroke();
    }

    // REM threshold zones
    // Red zone: BAC > 0.05
    const y005 = bacToY(0.05);
    const y002 = bacToY(0.02);
    const yZero = bacToY(0);

    // Red zone above 0.05
    if (0.05 < maxBAC) {
      ctx.fillStyle = 'rgba(248, 113, 113, 0.06)';
      ctx.fillRect(pad.left, pad.top, plotW, y005 - pad.top);
    }

    // Yellow zone 0.02-0.05
    ctx.fillStyle = 'rgba(251, 191, 36, 0.04)';
    ctx.fillRect(pad.left, y005, plotW, y002 - y005);

    // Green zone below 0.02
    ctx.fillStyle = 'rgba(52, 211, 153, 0.03)';
    ctx.fillRect(pad.left, y002, plotW, yZero - y002);

    // Zone labels on right edge
    ctx.font = '9px -apple-system, sans-serif';
    ctx.textAlign = 'right';
    if (0.05 < maxBAC) {
      ctx.fillStyle = 'rgba(248, 113, 113, 0.5)';
      ctx.fillText('REM blocked', w - pad.right - 4, y005 + 12);
    }
    ctx.fillStyle = 'rgba(251, 191, 36, 0.4)';
    ctx.fillText('REM reduced', w - pad.right - 4, y002 - 4);
    ctx.fillStyle = 'rgba(52, 211, 153, 0.4)';
    ctx.fillText('REM safe', w - pad.right - 4, yZero - 6);

    // Draw hypothetical curve first (behind real)
    if (hypotheticalCurve.length > 0) {
      drawCurve(ctx, hypotheticalCurve, minTime, maxTime, maxBAC, pad, plotW, plotH, {
        stroke: 'rgba(167, 139, 250, 0.4)',
        fill: 'rgba(167, 139, 250, 0.08)',
        dashed: true,
      });
    }

    // Draw real curve
    if (realCurve.length > 0) {
      drawCurve(ctx, realCurve, minTime, maxTime, maxBAC, pad, plotW, plotH, {
        stroke: getStrokeColor(realCurve),
        fill: getFillColor(realCurve),
        dashed: false,
      });
    }

    // Draw drink markers
    for (const drink of drinks) {
      const x = timeToX(drink.timestamp);
      if (x < pad.left || x > w - pad.right) continue;

      ctx.beginPath();
      ctx.arc(x, pad.top + plotH + 2, 3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(167, 139, 250, 0.8)';
      ctx.fill();
    }

    // Hypothetical drink markers
    for (const drink of hypotheticalDrinks) {
      const x = timeToX(drink.timestamp);
      if (x < pad.left || x > w - pad.right) continue;

      ctx.beginPath();
      ctx.setLineDash([2, 2]);
      ctx.arc(x, pad.top + plotH + 2, 3, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(167, 139, 250, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // "Now" marker
    const now = Date.now();
    if (now >= minTime && now <= maxTime) {
      const nowX = timeToX(now);
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 1;
      ctx.moveTo(nowX, pad.top);
      ctx.lineTo(nowX, pad.top + plotH);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = '9px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('now', nowX, pad.top - 6);
    }
  }, [realCurve, hypotheticalCurve, drinks, hypotheticalDrinks]);

  if (drinks.length === 0 && hypotheticalDrinks.length === 0) {
    return (
      <div className="glass p-6 text-center">
        <p className="text-text-muted text-sm">Log a drink to see your BAC curve</p>
      </div>
    );
  }

  return (
    <div className="glass p-3 animate-fade-in">
      <p className="text-xs text-text-secondary mb-2 px-1">BAC over time</p>
      <canvas
        ref={canvasRef}
        className="w-full"
        style={{ height: 200 }}
      />
    </div>
  );
}

function drawCurve(
  ctx: CanvasRenderingContext2D,
  points: { time: number; bac: number }[],
  minTime: number,
  maxTime: number,
  maxBAC: number,
  pad: { top: number; right: number; bottom: number; left: number },
  plotW: number,
  plotH: number,
  style: { stroke: string; fill: string; dashed: boolean }
) {
  const timeToX = (t: number) => pad.left + ((t - minTime) / (maxTime - minTime)) * plotW;
  const bacToY = (b: number) => pad.top + plotH - (b / maxBAC) * plotH;

  if (style.dashed) {
    ctx.setLineDash([4, 4]);
  }

  // Fill area
  ctx.beginPath();
  ctx.moveTo(timeToX(points[0].time), bacToY(0));
  for (const p of points) {
    ctx.lineTo(timeToX(p.time), bacToY(p.bac));
  }
  ctx.lineTo(timeToX(points[points.length - 1].time), bacToY(0));
  ctx.closePath();
  ctx.fillStyle = style.fill;
  ctx.fill();

  // Stroke line
  ctx.beginPath();
  ctx.moveTo(timeToX(points[0].time), bacToY(points[0].bac));
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(timeToX(points[i].time), bacToY(points[i].bac));
  }
  ctx.strokeStyle = style.stroke;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.setLineDash([]);
}

function getStrokeColor(points: { bac: number }[]): string {
  const maxBac = Math.max(...points.map((p) => p.bac));
  if (maxBac > 0.05) return 'rgba(248, 113, 113, 0.9)';
  if (maxBac > 0.02) return 'rgba(251, 191, 36, 0.9)';
  return 'rgba(52, 211, 153, 0.9)';
}

function getFillColor(points: { bac: number }[]): string {
  const maxBac = Math.max(...points.map((p) => p.bac));
  if (maxBac > 0.05) return 'rgba(248, 113, 113, 0.12)';
  if (maxBac > 0.02) return 'rgba(251, 191, 36, 0.10)';
  return 'rgba(52, 211, 153, 0.08)';
}
