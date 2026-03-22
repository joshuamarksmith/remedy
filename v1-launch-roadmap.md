# Remedy v1 Launch Roadmap

Prioritized by impact on accuracy, retention, and first-impression quality.

---

## P0: Must-have before launch

### Drink-type presets
**Problem:** "Standard drinks" is a leaky abstraction. Users think in beers, glasses of wine, and cocktails. A craft IPA is 1.5-2x a standard drink. Users who don't know this will consistently undercount, get optimistic estimates, feel terrible the next morning, and blame the app.

**Solution:**
- Replace the single "+ 1 Standard Drink" button with a drink-type picker: Beer, Wine, Cocktail, Shot
- Each type maps to a sensible default standard-drink multiplier (e.g., Beer = 1.0, Wine = 1.2, Cocktail = 1.5, Shot = 1.0)
- Keep the custom amount input as a fallback for power users
- Show the equivalent standard drinks after selection so users learn over time

**Success metric:** Reduction in BAC underestimation (qualitative via user feedback).

### Copy cleanup
**Problem:** Several pieces of user-facing copy are clunky, redundant, or misleading.

**Changes:**
- Empty state (no drinks): Replace "Your sleep is on track tonight" with "Log your first drink to start tracking tonight's impact"
- Safe state (low BAC): Shorten "You're still processing alcohol, but it won't noticeably affect your sleep quality" to "Still clearing alcohol, but your sleep tonight should be fine"
- Tally: Replace "standard drink(s) logged" with proper singular/plural ("drink logged" / "drinks logged")
- Home reset: Rename "Reset session" to "Clear tonight's drinks"
- Settings reset: Keep "Reset everything" (already distinct enough with the full confirmation flow)

### Consolidate the Home screen
**Problem:** 6-7 interaction zones compete for attention. The primary loop (log a drink, see impact) gets lost.

**Changes:**
- Move the What-If toggle to the Timeline/Insights tab where the chart gives it visual context
- Collapse custom drink input behind the quick-add button (e.g., a small "Custom" link or long-press)
- Home becomes: gauge + status card + drink logging + tally. That's it.

---

## P1: High-impact, ship shortly after launch

### Restructure navigation to three tabs
**Problem:** The Log tab shows the same drinks as Home and Timeline in a less useful format. Four tabs dilute focus.

**Solution:**
- **Tonight** (current Home, streamlined): Gauge, status, drink logging, tally
- **Insights** (current Timeline, enhanced): Chart, what-if toggle, milestone cards, event list with swipe-to-delete
- **Settings**: Profile, notifications, sleep tracking, disclaimer, reset

**Migration:** Move drink-deletion from Log into Insights (swipe-to-delete on timeline events). Remove the Log tab entirely.

### Elevate milestones on the Insights tab
**Problem:** "Sleep clear at 11:30 PM" and "BAC reaches zero" are the most actionable pieces of information in the app, but they're styled as plain list items in the timeline.

**Solution:**
- Pull key milestones into prominent cards at the top of the Insights tab (above the chart)
- Style them like the sleep status card on Home: colored border, icon, clear time callout
- Keep them in the timeline event list as well for chronological context

### Soften the onboarding-to-profile transition
**Problem:** After the emotional arc of onboarding, landing on a Settings form is deflating. "Get Started" should mean "let me try this."

**Solution:**
- After onboarding, send users to Home (not Settings)
- Show a dismissible nudge card on Home: "For accurate estimates, set your weight and sex in Settings"
- App works with sensible defaults (75kg male, 23:00 bedtime) so users can explore first
- Nudge card persists across sessions until dismissed or until the user visits Settings

---

## P2: Retention and engagement

### Morning summary notification
**Problem:** The app has no re-engagement loop. Users only open it while drinking.

**Solution:**
- Morning after a drinking session (e.g., 8 AM or user-configured), send a local notification:
  "Last night: 3 drinks logged. Your REM was likely reduced by ~25 minutes."
- Tapping the notification opens a summary card (not a new screen, just a card on Home):
  - Drinks logged, peak BAC, estimated REM reduction, time BAC reached zero
- No user input required. All data already exists from the previous session.
- Opt-in toggle in Settings (default off, to respect notification fatigue)

**Success metric:** Day-2 and Day-7 retention rates.

### Onboarding rewrite: lead with the problem
**Problem:** Slides 2-4 sell features ("real-time BAC tracking," "time it right," "what-if") before the user feels the problem.

**Solution:**
- **Slide 1:** "Did you know?" + a striking stat (e.g., "2 drinks before bed can cut your REM sleep by 30 minutes")
- **Slide 2:** "What that feels like" + relatable next-day symptoms (grogginess, poor focus, worse mood)
- **Slide 3:** "Remedy shows you the tradeoff" + brief demo of the gauge and "wait until" time
- **Slide 4:** Disclaimer (unchanged)

Reduce from 5 slides to 4. Cut the what-if slide (users will discover it in-app).

### Collapsible disclaimer in Settings
**Problem:** The full disclaimer in Settings takes significant scroll real estate and is identical to the one in onboarding.

**Solution:**
- Replace with a single line: "Remedy is for educational purposes only." + "View full disclaimer" link
- Tapping the link expands the full text inline or opens a modal

---

## P3: Future considerations

### Weekly/monthly insights
- Surface trends from archived history data (already stored for 90 days)
- "This week: 8 drinks across 3 sessions. Average REM reduction: ~20 min/night"
- Natural replacement for the removed Log tab
- Requires no new data collection, just visualization of existing archives

### Science context for lay audiences
- Add participant count to the Gardiner et al. citation: "Based on research across 27 sleep studies and over 500 participants"
- Makes the science feel more substantial without adding complexity

### Metric/imperial toggle for weight
- Currently US-centric (pounds with kg conversion shown)
- Add a toggle in Settings for users who think in kg natively

### Food intake modifier
- Food significantly slows alcohol absorption
- A simple "Have you eaten recently?" toggle (yes/no) with a 0.6-0.8x absorption modifier would improve accuracy
- Low UI cost, meaningful accuracy gain

### Apple Health / Google Fit integration
- Auto-pull actual REM and deep sleep data instead of manual entry
- Would make the experimental sleep tracking feature viable as a core feature
- Removes friction from the morning re-engagement flow

---

## Summary

| Priority | Item | Type | Effort |
|----------|------|------|--------|
| P0 | Drink-type presets | Accuracy | Medium |
| P0 | Copy cleanup | Polish | Small |
| P0 | Consolidate Home screen | UX | Medium |
| P1 | Three-tab navigation | UX | Medium |
| P1 | Elevate milestones on Insights | UX | Small |
| P1 | Soften onboarding-to-profile flow | UX | Small |
| P2 | Morning summary notification | Retention | Medium |
| P2 | Onboarding rewrite | Conversion | Medium |
| P2 | Collapsible disclaimer in Settings | Polish | Small |
| P3 | Weekly/monthly insights | Engagement | Large |
| P3 | Science context for lay audiences | Trust | Small |
| P3 | Metric/imperial toggle | Accessibility | Small |
| P3 | Food intake modifier | Accuracy | Small |
| P3 | Health app integration | Accuracy/Retention | Large |
