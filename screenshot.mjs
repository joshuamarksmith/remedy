import { chromium } from 'playwright';

const VIEWPORT_WIDTH = 390;
const CLIP_HEIGHT = 844; // iPhone 14/15/16 ratio (19.5:9)

const browser = await chromium.launch({
  executablePath: '/root/.cache/ms-playwright/chromium-1194/chrome-linux/chrome',
});
const context = await browser.newContext({
  viewport: { width: VIEWPORT_WIDTH, height: 844 },
  deviceScaleFactor: 2,
  colorScheme: 'dark',
});
const page = await context.newPage();

const clip = { x: 0, y: 0, width: VIEWPORT_WIDTH, height: CLIP_HEIGHT };

await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

// --- NUX Onboarding ---
// Slide 1
await page.screenshot({ path: 'assets/screenshot-onboarding-1.png', clip });

// Slide 2
await page.click('button:has-text("Next")');
await page.waitForTimeout(500);
await page.screenshot({ path: 'assets/screenshot-onboarding-2.png', clip });

// Slide 3
await page.click('button:has-text("Next")');
await page.waitForTimeout(500);
await page.screenshot({ path: 'assets/screenshot-onboarding-3.png', clip });

// Slide 4 + more until disclaimer
await page.click('button:has-text("Next")');
await page.waitForTimeout(500);

// Slide 5: Disclaimer — accept and Get Started
await page.click('button:has-text("Next")');
await page.waitForTimeout(500);
await page.click('text=I understand this app is not medical advice');
await page.waitForTimeout(300);
await page.click('button:has-text("Get Started")');
await page.waitForTimeout(1000);

// --- Main App Screenshots ---

// After onboarding, app now lands on Tonight with profile nudge
await page.screenshot({ path: 'assets/screenshot-tonight-empty.png', clip });

// Add drinks using the new preset buttons
await page.click('button:has-text("Beer")');
await page.waitForTimeout(400);
await page.click('button:has-text("Beer")');
await page.waitForTimeout(400);
await page.click('button:has-text("Wine")');
await page.waitForTimeout(400);
await page.click('button:has-text("Cocktail")');
await page.waitForTimeout(1500);

// Tonight with drinks
await page.screenshot({ path: 'assets/screenshot-tonight-drinks.png', clip });

// Insights tab — milestone cards, what-if, chart, timeline
await page.locator('nav button', { hasText: 'Insights' }).click();
await page.waitForTimeout(800);
await page.screenshot({ path: 'assets/screenshot-insights.png', clip });

// Toggle what-if mode on Insights
const toggle = page.locator('button').filter({ has: page.locator('div.rounded-full') });
await toggle.first().click();
await page.waitForTimeout(1000);
await page.screenshot({ path: 'assets/screenshot-insights-whatif.png', clip });

// Settings tab
await page.locator('nav button', { hasText: 'Settings' }).click();
await page.waitForTimeout(500);
await page.screenshot({ path: 'assets/screenshot-settings.png', clip });

await browser.close();
console.log('All screenshots saved!');
