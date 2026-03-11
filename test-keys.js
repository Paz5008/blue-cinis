const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('Navigating to login...');
    await page.goto('http://localhost:3000/auth/signin');
    await page.fill('input[name="email"]', 'test_artist@bluecinis.com');
    await page.fill('input[name="password"]', 'artist123');
    await page.click('button[type="submit"]');

    console.log('Waiting for URL change after login...');
    await page.waitForTimeout(2000); 

    console.log('Navigating to customization...');
    await page.goto('http://localhost:3000/dashboard-artist/customization/profile');
    
    await page.waitForTimeout(4000); 

    const keys = await page.evaluate(() => {
        return window.__chatKeys || [];
    });
    console.log('[KEYS DUMP]', keys);

    // Now try to submit
    await page.fill('textarea', 'Test AI Error');
    await page.focus('textarea');
    await page.keyboard.press('Enter');

    await page.waitForTimeout(4000); 

    // Check errors
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
