import { useState, useCallback } from 'react';

interface OnboardingProps {
  onComplete: () => void;
}

const SLIDES = [
  {
    visual: (
      <div className="relative w-48 h-36 mx-auto flex items-center justify-center">
        <div className="text-center">
          <p className="text-6xl font-bold text-accent-teal tracking-tight">30</p>
          <p className="text-sm text-text-secondary mt-1">minutes of REM sleep lost</p>
        </div>
      </div>
    ),
    title: 'Did you know?',
    body: 'Just 2 drinks before bed can cut your REM sleep by 30 minutes. That\u2019s a third of your most restorative sleep, gone.',
  },
  {
    visual: (
      <div className="relative w-48 h-36 mx-auto flex items-center justify-center">
        <div className="space-y-2.5 w-full">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06]">
            <span className="text-lg">😴</span>
            <div className="text-sm text-text-secondary">Grogginess that coffee can't fix</div>
          </div>
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06]">
            <span className="text-lg">🧠</span>
            <div className="text-sm text-text-secondary">Worse focus and memory</div>
          </div>
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06]">
            <span className="text-lg">😟</span>
            <div className="text-sm text-text-secondary">Lower mood the next day</div>
          </div>
        </div>
      </div>
    ),
    title: 'What that feels like',
    body: 'Poor REM sleep doesn\u2019t just mean tiredness. It affects your focus, mood, and how your brain processes the day.',
  },
  {
    visual: (
      <div className="relative w-48 h-36 mx-auto flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-text-secondary mb-1">Wait until</p>
          <p className="text-5xl font-bold text-accent-teal tracking-tight">11:30<span className="text-2xl ml-1">PM</span></p>
          <p className="text-sm text-text-secondary mt-1">for better sleep</p>
        </div>
      </div>
    ),
    title: 'Remedy shows the tradeoff',
    body: 'Log your drinks and see exactly when alcohol will stop affecting your sleep, so you can make an informed call.',
  },
  {
    visual: null,
    title: 'Before you start',
    body: '',
    isDisclaimer: true,
  },
];

export function Onboarding({ onComplete }: OnboardingProps) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const [animating, setAnimating] = useState(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);

  const disclaimerIndex = SLIDES.length - 1;
  const isLast = current === disclaimerIndex;
  const slide = SLIDES[current];
  const isDisclaimer = 'isDisclaimer' in slide && slide.isDisclaimer;

  const goTo = useCallback((next: number) => {
    if (animating || next === current) return;
    setDirection(next > current ? 'right' : 'left');
    setAnimating(true);
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

  return (
    <div className="min-h-dvh flex flex-col bg-bg-primary">
      {/* Skip — hidden on disclaimer slide */}
      <div className="flex justify-end px-5 pt-5">
        {!isDisclaimer && (
          <button
            onClick={() => goTo(disclaimerIndex)}
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
          {isDisclaimer ? (
            <div className="text-left">
              <h2 className="text-xl font-semibold text-text-primary mb-4 text-center">
                {slide.title}
              </h2>
              <div className="space-y-3 text-sm text-text-secondary leading-relaxed">
                <p>
                  Remedy is for <strong className="text-text-primary">informational and educational purposes only</strong>.
                  It is not a medical device and does not provide medical advice, diagnosis, or treatment.
                </p>
                <p>
                  BAC estimates are <strong className="text-text-primary">approximate</strong> and
                  vary based on factors not captured here, including food intake, medications, hydration,
                  liver health, tolerance, and genetic variation.
                </p>
                <p className="text-accent-red/90 font-medium">
                  Never use this app to determine whether it is safe to drive, operate machinery,
                  or make any safety-critical decision.
                </p>
                <p>
                  If you are concerned about your alcohol consumption, please consult a healthcare
                  professional.
                </p>
              </div>
              <button
                onClick={() => setDisclaimerAccepted(!disclaimerAccepted)}
                className="mt-5 flex items-center gap-3 w-full text-left"
              >
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors shrink-0 ${
                  disclaimerAccepted
                    ? 'bg-accent-teal border-accent-teal'
                    : 'border-white/30 bg-transparent'
                }`}>
                  {disclaimerAccepted && <span className="text-bg-primary text-xs font-bold">✓</span>}
                </div>
                <span className="text-sm text-text-secondary">
                  I understand this app is not medical advice
                </span>
              </button>
            </div>
          ) : (
            <>
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
            </>
          )}
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
          disabled={isDisclaimer && !disclaimerAccepted}
          className={`w-full py-3.5 rounded-2xl font-semibold text-base press-bounce transition-all duration-300 ${
            isDisclaimer && !disclaimerAccepted
              ? 'bg-white/10 text-text-muted cursor-not-allowed'
              : 'bg-accent-teal text-bg-primary'
          }`}
        >
          {isDisclaimer ? 'Get Started' : 'Next'}
        </button>
      </div>
    </div>
  );
}
