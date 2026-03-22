# Remedy - Alcohol & REM Sleep Tracker

## Overview
A mobile-native web app (PWA) that tracks alcohol consumption in real-time and shows exactly when your body will metabolize the alcohol, when you should go to sleep, and when you'll actually enter quality REM sleep. Each drink you log (or hypothetically add) instantly updates the timeline.

## Tech Stack
- **React** + **TypeScript** — component-based, fast iteration
- **Vite** — instant HMR for quick previews during development
- **Tailwind CSS** — beautiful, mobile-first styling out of the box
- **PWA** — installable on phone home screen, works offline
- **localStorage** — persist drink history across sessions (no backend needed)

## Science Model (Based on Published Research)

### Core Formulas
1. **BAC Estimation (Widmark Formula)**
   - `BAC = (drinks × 14g) / (bodyWeight_kg × r) - (eliminationRate × hours)`
   - `r` = 0.68 (male) / 0.55 (female) — body water constant
   - `eliminationRate` = 0.015 g/dL per hour (average)

2. **Alcohol Metabolism Timeline**
   - 1 standard drink ≈ 14g pure alcohol
   - Body eliminates ~1 standard drink per hour
   - Time to zero BAC = total drinks / elimination rate (adjusted for body weight)

3. **REM Sleep Impact Rules** (from Ebrahim et al. 2013, Colrain et al. 2014)
   - BAC > 0.02 at sleep onset → measurable REM suppression
   - BAC > 0.05 at sleep onset → significant REM suppression (30-50% reduction in first half of night)
   - REM suppression lasts ~4-5 hours after BAC reaches zero
   - REM rebound (fragmented, vivid dreams) occurs in second half of night
   - **Safe REM threshold**: BAC should be ≈ 0.00 for 1+ hours before sleep for minimal impact

4. **Sleep Timing Model**
   - Normal sleep onset to first REM cycle: ~90 minutes
   - Alcohol delays first REM cycle by 15-45 minutes depending on BAC
   - Full REM recovery requires BAC = 0 for ≈ 1 hour before sleep onset

## App Screens & Features

### Screen 1: Dashboard (Home)
- **Big countdown timer**: "REM-safe sleep in: 2h 14m"
- **Current BAC** estimate (animated gauge)
- **Quick-add drink button** (tap = +1 standard drink, long-press for custom amount)
- **"What if I drink one more?"** toggle — shows hypothetical impact
- **Today's drink tally** with timeline

### Screen 2: Timeline View
- Visual timeline showing:
  - Each drink logged (with timestamp)
  - BAC curve over time (line chart)
  - "Sober" marker
  - "REM-safe" marker
  - Projected sleep quality zones (green/yellow/red)

### Screen 3: Settings / Profile
- Body weight (kg/lbs)
- Sex (affects metabolism constant)
- Typical bedtime (for proactive warnings)
- Drink presets (beer, wine, cocktail, shot — with standard drink equivalents)

### Screen 4: History
- Past days/sessions with drink counts
- Sleep impact scores over time
- Trends and patterns

## Implementation Phases

### Phase 1: Core MVP (get something on screen fast)
- [ ] Vite + React + TypeScript + Tailwind setup
- [ ] Mobile-first layout shell with bottom nav
- [ ] Dashboard screen with drink counter
- [ ] BAC calculation engine (Widmark formula)
- [ ] Real-time countdown timers (sober time, REM-safe time)
- [ ] localStorage persistence
- **Checkpoint: can log drinks and see impact**

### Phase 2: Rich Visualization
- [ ] BAC curve chart (lightweight chart library or canvas)
- [ ] Timeline view with drink markers
- [ ] "What if" hypothetical drink mode
- [ ] Animated transitions and micro-interactions
- [ ] Color-coded status (green → yellow → red)

### Phase 3: Polish & PWA
- [ ] Settings/profile screen
- [ ] Drink presets with icons
- [ ] History view with past sessions
- [ ] PWA manifest + service worker (installable)
- [ ] Dark mode (default — it's a nighttime app)
- [ ] Haptic feedback on drink logging (where supported)

### Phase 4: Stretch Goals
- [ ] Push notifications ("You're REM-safe in 30 minutes!")
- [ ] Apple Health / Google Fit integration
- [ ] Social features (share your session)
- [ ] Weekly/monthly analytics

## Design Principles
- **Dark theme by default** — you're using this at night/at bars
- **One-handed operation** — big tap targets, bottom-anchored actions
- **Glanceable** — the key info is visible in <1 second
- **Non-judgmental** — informational, not preachy
- **Beautiful** — smooth animations, modern glass-morphism UI

## Quick Preview Strategy
After each phase, the app will be runnable via `npm run dev` and viewable in a browser (mobile-responsive). We'll use Vite's dev server for instant feedback.
