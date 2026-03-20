# App Store Screenshots

## How to capture

Apple requires screenshots at these sizes for iPhone:

| Device           | Resolution     | Points   |
|------------------|---------------|----------|
| iPhone 6.7"      | 1290 × 2796  | 430 × 932 |
| iPhone 6.5"      | 1284 × 2778  | 428 × 926 |
| iPhone 5.5"      | 1242 × 2208  | 414 × 736 |

### Quick method (Simulator)

1. `npm run cap:sync` to build and sync
2. `npm run cap:open` to open in Xcode
3. Run on iPhone 15 Pro Max simulator (6.7")
4. Use the app to log 2-3 drinks to populate the UI
5. Cmd+S in Simulator to save screenshots

### Recommended screenshots (5 max for App Store)

1. **Hero** — Main screen showing BAC gauge + "Sleep clear by" countdown
2. **Chart** — BAC curve with REM threshold zones visible
3. **Timeline** — Timeline view showing drink events → sleep clear
4. **What-if** — "What if one more?" simulator active
5. **Onboarding** — "Sleep better tonight" slide (or the disclaimer for trust)

### Frame templates

Use [Screenshots Pro](https://screenshots.pro) or Figma to add device frames and captions:

- "Know when alcohol stops hurting your sleep"
- "Real-time BAC tracking"
- "Plan your night with what-if"
- "Science-backed REM impact estimates"
- "Your data stays on your device"
