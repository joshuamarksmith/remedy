# Remedy Product Review

## What's Working Well

### The core value prop is sharp
"How will tonight's drinking affect tonight's sleep?" is a specific, actionable question that no mainstream app answers well. The framing around REM sleep (not sobriety, not shame) is a genuinely differentiated angle. It sidesteps the moralizing of most alcohol-tracking apps and meets the user where they are: mid-evening, drink in hand, wondering if one more is a bad idea.

### The "What If" feature is the killer differentiator
Most trackers are backward-looking. The hypothetical toggle turns the app into a forward-looking decision tool. This is the feature worth building around.

### The science citation is unusually strong for a consumer app
Gardiner et al. 2024 meta-analysis, Widmark formula, specific coefficients. The "How it works" card in Settings gives the right amount of detail without overwhelming. This builds trust.

### Privacy-first, offline-only is the right call
Weight + biological sex is sensitive data. Zero-backend eliminates an entire class of trust objections and keeps the app fast.

---

## Issues Worth Addressing

### 1. The onboarding sells features, not the problem

The four content slides (sleep better, real-time BAC, time it right, what-if) read like a feature list. A user who just installed the app doesn't care about features yet. They care about the problem.

**Slide 1** ("Alcohol suppresses REM sleep for hours") is the strongest because it's about *them*. But slides 2-4 immediately shift to "here's what our app does." Consider leading with the insight longer: *how much* REM are you losing? What does that feel like the next day? Let the user feel the problem before showing the solution.

### 2. Post-onboarding Settings redirect is jarring

After the emotional arc of onboarding (learn, understand, accept), the user lands on a form. The setup prompt banner helps, but the transition from "Get Started" to a weight input field is deflating. The user's mental model after "Get Started" is "let me try this thing," not "fill out a profile."

**Recommendation:** Let users go straight to Home with sensible defaults, and show a softer nudge ("Your estimates will be more accurate with your weight and sex. Set up profile") as a dismissible card on the Home screen. Users who care about accuracy will tap it. Users who want to explore first can.

### 3. The Home screen tries to do too much

Home currently holds: BAC gauge, sleep status card, drink logging (quick + custom), undo toast, what-if toggle with counter, today's tally with reset, and optionally sleep entry. That's 6-7 distinct interaction zones on one screen.

The primary action loop is: **log a drink, see the impact.** Everything else competes for attention. The what-if toggle, while valuable, sits below the fold on most phones and may go undiscovered. The custom drink input adds visual noise for a minority use case.

**Recommendation:** The quick-add button and gauge should dominate the screen. What-if could live on the Timeline tab where the chart context makes it more intuitive. Custom amounts could collapse behind the quick-add (long-press or a small "custom" link).

### 4. "Standard drinks" is a leaky abstraction

The app converts everything to standard drinks (14g ethanol), but most users think in terms of "beers," "glasses of wine," or "shots." The equivalence note ("12oz beer, 5oz wine, 1.5oz liquor") helps, but a craft IPA is 1.5-2 standard drinks, and a heavy pour of wine is closer to 1.5. Users who don't know this will consistently undercount.

This is the single biggest accuracy risk in the app. A user who logs "3 drinks" but actually consumed 5 standard drinks worth of alcohol will get dangerously optimistic BAC and REM estimates.

**Recommendation:** Offer drink-type presets (beer/wine/cocktail/shot) with sensible default multipliers, or at minimum a more prominent callout that drink strength varies.

### 5. The Log tab adds little value

The Log tab shows the same drinks visible on Home (today's tally) and Timeline (event list), just in a flat list with delete buttons. Three tabs showing the same data in slightly different formats dilutes each one.

**Recommendation:** Merge delete functionality into the Timeline (swipe-to-delete on drink events) and repurpose the Log tab for something users actually need a separate view for, like a weekly summary or historical view. Or remove it entirely and go to three tabs.

### 6. The Timeline tab undersells itself

The timeline is the most information-dense screen but it buries its best content. The chart is excellent, but the event list below it is a wall of small text. The milestones ("Sleep clear in 2h 15m", "BAC reaches zero") are the most actionable pieces of information in the entire app, yet they're styled the same as every other event.

**Recommendation:** Pull the key milestones out into their own prominent cards (similar to the sleep status card on Home). "Sleep clear at 11:30 PM" deserves headline treatment, not a line item.

### 7. No re-engagement loop

The app has no reason to bring the user back the next day unless they're drinking again. The experimental sleep tracking is a start, but it's hidden behind a toggle and marked experimental, which signals "don't trust this."

The most natural re-engagement would be a morning insight: "Last night you logged 3 drinks. Based on timing, your REM was likely reduced by ~25 minutes." This requires zero user input (the data is already there) and reinforces the value prop every morning, even on nights the user didn't use the app while drinking.

### 8. Copy inconsistencies and missed opportunities

- **"Your sleep is on track tonight"** appears even with zero drinks. A user who opens the app sober doesn't need reassurance. Consider a different empty state: "Log your first drink to start tracking tonight's impact."
- **"You're still processing alcohol, but it won't noticeably affect your sleep quality"** is a mouthful. Something like "Still clearing alcohol, but your sleep tonight should be fine" is more conversational.
- **"standard drink(s) logged"** uses a parenthetical plural hedge that feels clunky. Just use "drinks" for >1 and "drink" for exactly 1.
- **"Reset session"** vs **"Reset app to first-run state"** are two different resets with similar language. "Clear tonight's drinks" vs "Reset everything" would be clearer.

### 9. The disclaimer could use a lighter touch

The full legal disclaimer appears twice (onboarding + Settings) and is quite long. The onboarding placement is correct and the checkbox gate is necessary. But the Settings repeat takes up significant scroll real estate.

**Recommendation:** Collapse it behind a "View full disclaimer" link in Settings.

### 10. Missing: social proof or context for the science

The Gardiner et al. citation is great for credibility, but most users won't know what a meta-analysis of 27 studies means. A single line of human context would help: "Based on research across 27 sleep studies and over 500 participants" (or whatever the actual N is) makes the same citation feel more substantial to a lay audience.

---

## Strategic Observations

### Accuracy perception is the biggest risk
If a user logs 3 "drinks" that were actually 5 standard drinks, the app will tell them their sleep is fine when it isn't. The next morning they'll feel terrible and blame the app. Drink-type selection with multipliers would materially reduce this risk.

### The morning after is the biggest opportunity
Right now Remedy is an evening-only tool. A lightweight morning summary ("Here's what last night's drinking likely did to your sleep") would double the touchpoints and reinforce habit formation without requiring any new user input.

### The three-tab question
Home, Timeline, Log, Settings is four tabs. The app probably wants three: **Tonight** (gauge + logging + status), **Insights** (chart + milestones + what-if), **Settings**. This would sharpen each screen's purpose and eliminate the redundant Log view.
