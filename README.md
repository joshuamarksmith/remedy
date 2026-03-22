# **rem**edy

Track your drinks. Protect your REM sleep.

**remedy** is a mobile-first PWA that logs alcoholic drinks and shows you in real time how they affect your sleep. It calculates your BAC, estimates how much REM sleep you'll lose, and tells you when it's safe to sleep without impact.

<p align="center">
  <img src="assets/screenshot-onboarding-1.png" width="200" alt="Onboarding intro" />
  <img src="assets/screenshot-home.png" width="200" alt="Home screen" />
  <img src="assets/screenshot-with-drinks.png" width="200" alt="With drinks logged" />
  <img src="assets/screenshot-timeline.png" width="200" alt="Timeline view" />
</p>

## Disclaimer

**Remedy is for informational and educational purposes only.** BAC calculations are approximate estimates based on the Widmark formula and do not account for all individual factors (food intake, medications, hydration, liver health, tolerance, or genetic variation).

**This app should never be used to determine whether it is safe to drive, operate machinery, or make safety-critical decisions.** Always err on the side of caution. When in doubt, don't drive.

If you are concerned about your alcohol consumption, please consult a healthcare professional or contact [SAMHSA's National Helpline](https://www.samhsa.gov/find-help/national-helpline) at 1-800-662-4357 (free, confidential, 24/7).

## What it does

- **Log drinks** and see real-time BAC, REM impact, and a countdown to REM-safe sleep
- **"What if I have one more?"** — toggle a hypothetical drink to preview the impact
- **BAC curve chart** with color-coded REM zones and a timeline of milestones

## The science

BAC is estimated using the **Widmark formula**, the standard in forensic toxicology. Alcohol elimination is modeled as zero-order (constant rate of ~0.015 g/dL/hr).

REM impact is based on the **Gardiner et al. 2024** meta-analysis of 27 studies: each g/kg of alcohol reduces REM sleep by approximately 40 minutes. The REM-safe threshold adds a 1-hour buffer after BAC reaches zero for sleep architecture to normalize.

Sources: Ebrahim et al. 2013, Colrain et al. 2014, Gardiner et al. 2024, Ohayon et al. 2004.

## Run locally

```
npm install
npm run dev
```

## Deploy

Configured for Cloudflare Pages:

```
npm run deploy
```

## Tech

React 19, TypeScript, Vite 8, Tailwind CSS v4. No chart library — the BAC curve is drawn on canvas. All data stays in localStorage.
