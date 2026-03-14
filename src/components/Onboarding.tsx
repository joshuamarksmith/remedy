import { useState, useCallback } from 'react';

interface OnboardingProps {
  onComplete: () => void;
}

const SLIDES = [
  {
    visual: (
      <div className="relative w-36 h-36 mx-auto">
        <svg viewBox="0 0 120 120" className="w-full h-full">
          {/* Outer ring */}
          <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(45,212,191,0.15)" strokeWidth="6" />
          <circle
            cx="60" cy="60" r="52" fill="none" stroke="#2dd4bf" strokeWidth="6"
            strokeDasharray="327" strokeDashoffset="82" strokeLinecap="round"
            transform="rotate(-90 60 60)"
            className="gauge-ring"
          />
          {/* Center text */}
          <text x="60" y="55" textAnchor="middle" fill="#f1f5f9" fontSize="24" fontWeight="700" fontFamily="system-ui">0.000</text>
          <text x="60" y="72" textAnchor="middle" fill="#94a3b8" fontSize="11" fontFamily="system-ui">BAC</text>
        </svg>
      </div>
    ),
    title: 'Track your BAC',
    body: 'Log drinks and see your blood alcohol level update in real time using the Widmark formula.',
  },
  {
    visual: (
      <div className="relative w-40 h-36 mx-auto flex items-center justify-center">
        <div className="text-center">
          <p className="text-5xl font-bold text-accent-yellow tracking-tight animate-glow">4h 22m</p>
          <p className="text-sm text-text-muted mt-2">until REM-safe sleep</p>
        </div>
      </div>
    ),
    title: 'Protect your REM sleep',
    body: 'See exactly when your sleep will be clear of alcohol\'s REM-suppressing effects, backed by research.',
  },
  {
    visual: (
      <div className="relative w-48 h-36 mx-auto flex items-center justify-center">
        <div className="space-y-2.5 w-full">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06]">
            <div className="w-8 h-8 rounded-full bg-accent-teal/20 flex items-center justify-center text-accent-teal text-xs font-bold">1</div>
            <div className="text-sm text-text-primary">Log a drink</div>
          </div>
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06]">
            <div className="w-8 h-8 rounded-full bg-accent-blue/20 flex items-center justify-center text-accent-blue text-xs font-bold">?</div>
            <div className="text-sm text-text-primary">"What if one more?"</div>
          </div>
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06]">
            <div className="w-8 h-8 rounded-full bg-accent-green/20 flex items-center justify-center text-accent-green text-xs font-bold">✓</div>
            <div className="text-sm text-text-primary">Sleep well</div>
          </div>
        </div>
      </div>
    ),
    title: 'Make better decisions',
    body: 'Plan ahead with the "what if" simulator and make informed choices about your night.',
  },
];

export function Onboarding({ onComplete }: OnboardingProps) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const [animating, setAnimating] = useState(false);

  const isLast = current === SLIDES.length - 1;

  const goTo = useCallback((next: number) => {
    if (animating || next === current) return;
    setDirection(next > current ? 'right' : 'left');
    setAnimating(true);
    // Short delay so CSS picks up the direction class before transition
    requestAnimationFrame(() => {
      setCurrent(next);
      setTimeout(() => setAnimating(false), 350);
    });
  }, [current, animating]);

  const next = useCallback(() => {
    if (isLast) {
      onComplete();
    } else {
      goTo(current + 1);
    }
  }, [current, isLast, goTo, onComplete]);

  const slide = SLIDES[current];

  return (
    <div className="min-h-dvh flex flex-col bg-bg-primary">
      {/* Skip */}
      <div className="flex justify-end px-5 pt-5">
        {!isLast && (
          <button
            onClick={onComplete}
            className="text-sm text-text-muted press-bounce px-2 py-1"
          >
            Skip
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        {/* Logo */}
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary mb-12 animate-fade-in">
          <span className="text-accent-teal">rem</span>edy
        </h1>

        {/* Slide */}
        <div
          key={current}
          className={`w-full max-w-sm ${
            direction === 'right' ? 'onboarding-slide-right' : 'onboarding-slide-left'
          }`}
        >
          {/* Visual */}
          <div className="mb-8">
            {slide.visual}
          </div>

          {/* Text */}
          <div className="text-center">
            <h2 className="text-xl font-semibold text-text-primary mb-2">
              {slide.title}
            </h2>
            <p className="text-sm text-text-secondary leading-relaxed">
              {slide.body}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="px-8 pb-10 space-y-6">
        {/* Dots */}
        <div className="flex justify-center gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`rounded-full transition-all duration-300 ${
                i === current
                  ? 'w-6 h-2 bg-accent-teal'
                  : 'w-2 h-2 bg-white/20'
              }`}
            />
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={next}
          className="w-full py-3.5 rounded-2xl font-semibold text-base press-bounce transition-all duration-300 bg-accent-teal text-bg-primary"
        >
          {isLast ? 'Get Started' : 'Next'}
        </button>
      </div>
    </div>
  );
}
