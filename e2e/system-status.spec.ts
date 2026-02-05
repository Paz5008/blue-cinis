import { test, expect } from '@playwright/test';

test.describe('System status badge (DB down fallback)', () => {
  test('shows "Problèmes" when /api/health reports issues', async ({ page }) => {
    await page.route('**/api/health', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: false, issues: ['Database connectivity failed'], warnings: [] }),
      });
    });
    await page.goto('/');
    const badgeText = page.locator('text=Problèmes');
    await expect(badgeText).toBeVisible();
  });
});
