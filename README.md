# Pood

**An 8-week kettlebell program in your pocket — beginner to the Simple standard.**

Pood is a sleek, offline-first PWA that takes you from your first clean swing to a real,
durable kettlebell base over eight progressive weeks. Guided sessions, built-in interval and
EMOM timers, a full movement library, and progress tracking — all on-device, all yours.

> A *pood* is the traditional Russian unit kettlebells are measured in (≈16 kg). One pood is
> the classic starting bell.

## What it does

- **8-week progressive program** — 24 sessions across four phases: Foundations → Build →
  Strength & Power → Peak & Test. Each phase layers on skill and load, finishing with the
  StrongFirst "Simple" standard (100 swings + 10 get-ups) and the classic snatch test.
- **Guided session player** — step through every warm-up, working set, and finisher with a
  big, glanceable display. Automatic rest countdowns, work timers, and EMOM pacing with
  audio + haptic cues.
- **Scales to your bells** — tell Pood which kettlebells you own and your working weight, and
  every prescription resolves to a concrete load.
- **Movement library** — every lift with coaching cues, the common mistakes to avoid, and the
  progression/regression path (deadlift → swing → snatch, get-up to elbow → full Turkish
  get-up, and more).
- **Progress tracking** — streaks, lifetime swings, volume lifted, a per-week program map, and
  a history of every session with RPE and notes.

## Your data is yours

Everything lives on your device — no account, no servers, works fully offline.

- **Automatic local backup** — every change is written to two on-device keys, so a single
  glitch never wipes your history.
- **Export / import to a file** — download a complete JSON backup any time and restore it on
  any device. (Settings → Your data.)

## The method

Pood is built on established hardstyle kettlebell methodology (Tsatsouline / StrongFirst,
Dan John) and current strength research on hip-hinge mechanics and ballistic power:

- The **hip hinge** is patterned with the deadlift before any ballistic work.
- **Swings** build explosive posterior-chain power and conditioning; volume is delivered in
  low-fatigue EMOM blocks to keep every rep powerful.
- The **Turkish get-up** develops total-body stability and overhead control.
- The program peaks into the **snatch**, complexes (Dan John's Armor Building Complex), and a
  measurable test week.

*Pood is an educational training tool, not medical advice. Train within your ability, scale
loads sensibly, and stop if something hurts.*

## Stack

- **React 19** + **TypeScript** (strict)
- **Vite 8** + **Tailwind CSS v4**
- **PWA** — web app manifest, installable, offline service worker
- Hand-rolled SVG charts and Web Audio timer cues — no runtime UI dependencies
- Icons generated at build time with a dependency-free PNG rasterizer

## Develop

```bash
npm install
npm run dev        # local dev server
npm run build      # type-check + production build
npm test           # unit tests (vitest)
npm run lint       # eslint
npm run icons      # regenerate app icons into public/icons
```

The production build in `dist/` is a static PWA — deploy it to any static host (Cloudflare
Pages config is included via `wrangler.toml`).
