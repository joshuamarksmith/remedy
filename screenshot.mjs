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

// Screenshot empty home screen
await page.screenshot({ path: '/home/user/remedy/screenshot-home.png', fullPage: true });

// Add 3 drinks to show the app in action
await page.click('text=+ Add Drink');
await page.waitForTimeout(400);
await page.click('text=+ Add Drink');
await page.waitForTimeout(400);
await page.click('text=+ Add Drink');
await page.waitForTimeout(1500);

await page.screenshot({ path: '/home/user/remedy/screenshot-with-drinks.png', fullPage: true });

// Toggle what-if mode
const toggle = page.locator('button').filter({ has: page.locator('div.rounded-full') });
await toggle.first().click();
await page.waitForTimeout(800);
await page.screenshot({ path: '/home/user/remedy/screenshot-whatif.png', fullPage: true });

// Go to log tab
await page.locator('text=Log').last().click();
await page.waitForTimeout(500);
await page.screenshot({ path: '/home/user/remedy/screenshot-log.png', fullPage: true });

// Go to settings tab
await page.locator('text=Settings').last().click();
await page.waitForTimeout(500);
await page.screenshot({ path: '/home/user/remedy/screenshot-settings.png', fullPage: true });

await browser.close();
console.log('All screenshots saved!');
