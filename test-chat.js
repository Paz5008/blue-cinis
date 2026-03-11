const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const errors = [];
  page.on('pageerror', exception => {
    errors.push(`Uncaught exception: ${exception}`);
    console.error(`[PageError] ${exception}`);
  });
  page.on('console', msg => {
    if (msg.type() === 'error') {
        const text = msg.text();
        if(!text.includes('400 (Bad Request)')) {
          errors.push(`Console error: ${msg.text()}`);
          console.error(`[ConsoleErr] ${msg.text()}`);
        }
    } else {
        console.log(`[Browser] ${msg.text()}`);
    }
  });

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
    
    // Attendre un peu pour le chargement du composant React
    await page.waitForTimeout(4000); 

    console.log('Typing into chat input');
    await page.fill('textarea', 'Fais un test');

    console.log('Submitting via enter key...');
    await page.focus('textarea');
    await page.keyboard.press('Enter');

    await page.waitForTimeout(3000);
    console.log('Errors captured:', errors);
  } catch (err) {
    console.error('Script error:', err);
  } finally {
    await browser.close();
  }
})();
