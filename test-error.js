const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.text().includes('[AI SDK ERROR DETECTED]')) {
      console.log(`[Captured] ${msg.text()}`);
    }
  });

  try {
    await page.goto('http://localhost:3000/auth/signin');
    await page.fill('input[name="email"]', 'test_artist@bluecinis.com');
    await page.fill('input[name="password"]', 'artist123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    await page.goto('http://localhost:3000/dashboard-artist/customization/profile');
    await page.waitForTimeout(4000);

    await page.fill('textarea', 'Test AI Error');
    await page.focus('textarea');
    await page.keyboard.press('Enter');

    await page.waitForTimeout(4000); // Wait for the error UI

    // Check if the error div is rendered
    const errorText = await page.evaluate(() => {
      const errorDiv = document.querySelector('.bg-amber-50');
      return errorDiv ? errorDiv.innerText : 'NO ERROR DIV';
    });
    console.log('[UI ERROR]', errorText);
  } catch (err) {
    console.error('Script error:', err);
  } finally {
    await browser.close();
  }
})();
