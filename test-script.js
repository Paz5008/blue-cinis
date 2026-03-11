const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    const errors = [];
    page.on('pageerror', exception => {
        errors.push(`Uncaught exception: ${exception}`);
        console.error(`PageError: ${exception}`);
    });
    page.on('console', msg => {
        if (msg.type() === 'error') {
            errors.push(`Console error: ${msg.text()}`);
            console.error(`ConsoleErr: ${msg.text()}`);
        }
    });

    try {
        console.log('Navigating to login...');
        // NextAuth usually redirects from /dashboard-artist to /auth/signin, 
        // let's just go there directly.
        await page.goto('http://localhost:3000/auth/signin');
        await page.fill('input[name="email"]', 'test_artist@bluecinis.com');
        await page.fill('input[name="password"]', 'artist123');
        await page.click('button[type="submit"]');

        console.log('Waiting for URL change after login...');
        await page.waitForTimeout(2000);

        console.log('Navigating to customization...');
        await page.goto('http://localhost:3000/dashboard-artist/customization/profile');

        // Attendre un peu pour laisser crasher React
        await page.waitForTimeout(4000);

        console.log('Errors captured:', errors);
    } catch (err) {
        console.error('Script error:', err);
    } finally {
        await browser.close();
    }
})();
