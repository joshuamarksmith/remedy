import { chromium } from 'playwright';

const browser = await chromium.launch({
  executablePath: '/root/.cache/ms-playwright/chromium-1194/chrome-linux/chrome',
});
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  colorScheme: 'dark',
});
const page = await context.newPage();

await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

// --- NUX Onboarding ---
// Should show first slide ("Sleep better tonight")
await page.screenshot({ path: 'assets/screenshot-onboarding-1.png' });

// Slide 2: Disclaimer
await page.click('button:has-text("Next")');
await page.waitForTimeout(500);
await page.screenshot({ path: 'assets/screenshot-onboarding-2.png' });

// Accept disclaimer and advance
await page.click('text=I understand this app is not medical advice');
await page.waitForTimeout(300);
await page.click('button:has-text("I Agree")');
await page.waitForTimeout(500);

// Slide 3: Real-time BAC tracking
await page.screenshot({ path: 'assets/screenshot-onboarding-3.png' });

// Advance through remaining slides
await page.click('button:has-text("Next")');
await page.waitForTimeout(500);

// Slide 4: Know when to stop
await page.click('button:has-text("Next")');
await page.waitForTimeout(500);

// Slide 5: Make better decisions — click Get Started
await page.click('button:has-text("Get Started")');
await page.waitForTimeout(1000);

// --- Main App Screenshots ---

// Screenshot empty home
await page.screenshot({ path: 'assets/screenshot-home.png' });

// Add 3 standard drinks
for (let i = 0; i < 3; i++) {
  await page.click('text=+ 1 Standard Drink');
  await page.waitForTimeout(400);
}
await page.waitForTimeout(1000);

// Add a custom 1.5 drink
await page.fill('input[type="number"]', '1.5');
await page.waitForTimeout(300);
await page.click('button:has-text("Add")');
await page.waitForTimeout(1500);

// Home with drinks
await page.screenshot({ path: 'assets/screenshot-with-drinks.png' });

// Toggle what-if mode
const toggle = page.locator('button').filter({ has: page.locator('div.rounded-full') });
await toggle.first().click();
await page.waitForTimeout(1000);
await page.screenshot({ path: 'assets/screenshot-whatif.png' });

// Timeline tab
await page.locator('nav button', { hasText: 'Timeline' }).click();
await page.waitForTimeout(800);
await page.screenshot({ path: 'assets/screenshot-timeline.png' });

// Log tab
await page.locator('nav button', { hasText: 'Log' }).click();
await page.waitForTimeout(500);
await page.screenshot({ path: 'assets/screenshot-log.png' });

// Settings tab
await page.locator('nav button', { hasText: 'Settings' }).click();
await page.waitForTimeout(500);
await page.screenshot({ path: 'assets/screenshot-settings.png' });

await browser.close();
console.log('All screenshots saved!');
