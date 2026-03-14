import { useRef, useEffect, useMemo, memo } from 'react';
import { generateBACCurve, type Drink, type UserProfile } from '../lib/bac';
import {
  COLORS,
  BAC_THRESHOLD_CAUTION,
  BAC_THRESHOLD_DANGER,
  qualityFromBAC,
  getQualityStroke,
  getQualityFill,
  formatTime,
} from '../lib/theme';

interface BACChartProps {
  drinks: Drink[];
  profile: UserProfile;
  hypotheticalDrinks?: Drink[];
}

interface Viewport {
  pad: { top: number; right: number; bottom: number; left: number };
  plotW: number;
  plotH: number;
  minTime: number;
  maxTime: number;
  maxBAC: number;
}

function timeToX(v: Viewport, t: number): number {
  return v.pad.left + ((t - v.minTime) / (v.maxTime - v.minTime)) * v.plotW;
}

function bacToY(v: Viewport, b: number): number {
  return v.pad.top + v.plotH - (b / v.maxBAC) * v.plotH;
}

export const BACChart = memo(function BACChart({
  drinks,
  profile,
  hypotheticalDrinks = [],
}: BACChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const allDrinks = useMemo(
    () => [...drinks, ...hypotheticalDrinks],
    [drinks, hypotheticalDrinks]
  );

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

    ctx.clearRect(0, 0, w, h);

    const activeCurve = hypotheticalCurve.length > 0 ? hypotheticalCurve : realCurve;
    if (activeCurve.length === 0) return;

    const vp: Viewport = {
      pad: { top: 20, right: 16, bottom: 36, left: 40 },
      plotW: w - 40 - 16,
      plotH: h - 20 - 36,
      minTime: activeCurve[0].time,
      maxTime: activeCurve[activeCurve.length - 1].time,
      maxBAC: Math.max(0.02, ...activeCurve.map((p) => p.bac)) * 1.15,
    };

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (const step of [BAC_THRESHOLD_CAUTION, BAC_THRESHOLD_DANGER, 0.08, 0.10]) {
      if (step > vp.maxBAC) continue;
      const y = bacToY(vp, step);
      ctx.beginPath();
      ctx.moveTo(vp.pad.left, y);
      ctx.lineTo(w - vp.pad.right, y);
      ctx.stroke();

      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.font = '10px -apple-system, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(step.toFixed(2), vp.pad.left - 6, y + 3);
    }

    // Time labels
    const totalMs = vp.maxTime - vp.minTime;
    const hourMs = 60 * 60 * 1000;
    const timeStep = totalMs > 6 * hourMs ? 2 * hourMs : hourMs;
    const firstHour = Math.ceil(vp.minTime / timeStep) * timeStep;

    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.font = '10px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    for (let t = firstHour; t <= vp.maxTime; t += timeStep) {
      const x = timeToX(vp, t);
      ctx.fillText(formatTime(t), x, h - vp.pad.bottom + 16);
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.beginPath();
      ctx.moveTo(x, vp.pad.top);
      ctx.lineTo(x, vp.pad.top + vp.plotH);
      ctx.stroke();
    }

    // REM threshold zones
    const yDanger = bacToY(vp, BAC_THRESHOLD_DANGER);
    const yCaution = bacToY(vp, BAC_THRESHOLD_CAUTION);
    const yZero = bacToY(vp, 0);

    if (BAC_THRESHOLD_DANGER < vp.maxBAC) {
      ctx.fillStyle = `rgba(${COLORS.danger.rgb}, 0.06)`;
      ctx.fillRect(vp.pad.left, vp.pad.top, vp.plotW, yDanger - vp.pad.top);
    }

    ctx.fillStyle = `rgba(${COLORS.caution.rgb}, 0.04)`;
    ctx.fillRect(vp.pad.left, yDanger, vp.plotW, yCaution - yDanger);

    ctx.fillStyle = `rgba(${COLORS.safe.rgb}, 0.03)`;
    ctx.fillRect(vp.pad.left, yCaution, vp.plotW, yZero - yCaution);

    // Zone labels
    ctx.font = '9px -apple-system, sans-serif';
    ctx.textAlign = 'right';
    if (BAC_THRESHOLD_DANGER < vp.maxBAC) {
      ctx.fillStyle = `rgba(${COLORS.danger.rgb}, 0.5)`;
      ctx.fillText('REM blocked', w - vp.pad.right - 4, yDanger + 12);
    }
    ctx.fillStyle = `rgba(${COLORS.caution.rgb}, 0.4)`;
    ctx.fillText('REM reduced', w - vp.pad.right - 4, yCaution - 4);
    ctx.fillStyle = `rgba(${COLORS.safe.rgb}, 0.4)`;
    ctx.fillText('REM safe', w - vp.pad.right - 4, yZero - 6);

    // Draw hypothetical curve (behind real)
    if (hypotheticalCurve.length > 0) {
      drawCurve(ctx, vp, hypotheticalCurve, {
        stroke: `rgba(${COLORS.accent.rgb}, 0.4)`,
        fill: `rgba(${COLORS.accent.rgb}, 0.08)`,
        dashed: true,
      });
    }

    // Draw real curve
    if (realCurve.length > 0) {
      const peakBAC = Math.max(...realCurve.map((p) => p.bac));
      const quality = qualityFromBAC(peakBAC);
      drawCurve(ctx, vp, realCurve, {
        stroke: getQualityStroke(quality),
        fill: getQualityFill(quality),
        dashed: false,
      });
    }

    // Drink markers
    for (const drink of drinks) {
      const x = timeToX(vp, drink.timestamp);
      if (x < vp.pad.left || x > w - vp.pad.right) continue;
      ctx.beginPath();
      ctx.arc(x, vp.pad.top + vp.plotH + 2, 3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${COLORS.teal.rgb}, 0.8)`;
      ctx.fill();
    }

    // Hypothetical drink markers
    for (const drink of hypotheticalDrinks) {
      const x = timeToX(vp, drink.timestamp);
      if (x < vp.pad.left || x > w - vp.pad.right) continue;
      ctx.beginPath();
      ctx.setLineDash([2, 2]);
      ctx.arc(x, vp.pad.top + vp.plotH + 2, 3, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${COLORS.accent.rgb}, 0.6)`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // "Now" marker
    const now = Date.now();
    if (now >= vp.minTime && now <= vp.maxTime) {
      const nowX = timeToX(vp, now);
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 1;
      ctx.moveTo(nowX, vp.pad.top);
      ctx.lineTo(nowX, vp.pad.top + vp.plotH);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = '9px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('now', nowX, vp.pad.top - 6);
    }
  }, [realCurve, hypotheticalCurve, drinks, hypotheticalDrinks]);

  if (drinks.length === 0 && hypotheticalDrinks.length === 0) {
    return (
      <div className="card p-6 text-center">
        <p className="text-text-muted text-sm">Log a drink to see your BAC curve</p>
      </div>
    );
  }

  return (
    <div className="card p-3 animate-fade-in">
      <p className="text-xs text-text-secondary mb-2 px-1">BAC over time</p>
      <canvas ref={canvasRef} className="w-full" style={{ height: 200 }} />
    </div>
  );
});

function drawCurve(
  ctx: CanvasRenderingContext2D,
  vp: Viewport,
  points: { time: number; bac: number }[],
  style: { stroke: string; fill: string; dashed: boolean }
) {
  if (style.dashed) ctx.setLineDash([4, 4]);

  // Fill area
  ctx.beginPath();
  ctx.moveTo(timeToX(vp, points[0].time), bacToY(vp, 0));
  for (const p of points) ctx.lineTo(timeToX(vp, p.time), bacToY(vp, p.bac));
  ctx.lineTo(timeToX(vp, points[points.length - 1].time), bacToY(vp, 0));
  ctx.closePath();
  ctx.fillStyle = style.fill;
  ctx.fill();

  // Stroke
  ctx.beginPath();
  ctx.moveTo(timeToX(vp, points[0].time), bacToY(vp, points[0].bac));
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(timeToX(vp, points[i].time), bacToY(vp, points[i].bac));
  }
  ctx.strokeStyle = style.stroke;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.setLineDash([]);
}
