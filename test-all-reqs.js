const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('request', req => {
      if (req.method() === 'POST' || req.method() === 'PUT') {
          console.log(`[REQ] ${req.method()} ${req.url()}`);
      }
  });

  page.on('response', async (res) => {
    if (res.request().method() === 'POST') {
      console.log(`[RES] ${res.status()} ${res.url()}`);
      if (!res.ok() && res.status() !== 200) {
        try {
            console.log(`[RES BODY]`, await res.text());
        } catch(e) {}
      }
    }
  });

  page.on('console', msg => {
    if (msg.type() === 'error') {
       console.error(`[ConsoleErr] ${msg.text()}`);
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

    await page.waitForTimeout(5000);
  } catch (err) {
    console.error('Script error:', err);
  } finally {
    await browser.close();
  }
})();
