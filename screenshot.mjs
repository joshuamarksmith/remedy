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

// Screenshot empty home
await page.screenshot({ path: '/home/user/remedy/assets/screenshot-home.png', fullPage: true });

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
await page.screenshot({ path: '/home/user/remedy/assets/screenshot-with-drinks.png', fullPage: true });

// Scroll down to show the reset button area
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(500);

// Click "Reset session"
await page.click('text=Reset session');
await page.waitForTimeout(500);
await page.screenshot({ path: '/home/user/remedy/assets/screenshot-reset-confirm.png', fullPage: true });

// Cancel the reset
await page.click('text=Cancel');
await page.waitForTimeout(300);

// Toggle what-if mode
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(300);
const toggle = page.locator('button').filter({ has: page.locator('div.rounded-full') });
await toggle.first().click();
await page.waitForTimeout(1000);
await page.screenshot({ path: '/home/user/remedy/assets/screenshot-whatif.png', fullPage: true });

// Timeline tab
await page.locator('nav button', { hasText: 'Timeline' }).click();
await page.waitForTimeout(800);
await page.screenshot({ path: '/home/user/remedy/assets/screenshot-timeline.png', fullPage: true });

// Log tab
await page.locator('nav button', { hasText: 'Log' }).click();
await page.waitForTimeout(500);
await page.screenshot({ path: '/home/user/remedy/assets/screenshot-log.png', fullPage: true });

// Settings tab
await page.locator('nav button', { hasText: 'Settings' }).click();
await page.waitForTimeout(500);
await page.screenshot({ path: '/home/user/remedy/assets/screenshot-settings.png', fullPage: true });

await browser.close();
console.log('All screenshots saved!');
