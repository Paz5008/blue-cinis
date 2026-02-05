import { test, expect } from '@playwright/test';

test.describe('Home Artworks section', () => {
  test('renders featured artworks section with server data', async ({ page }) => {
    await page.goto('/');
    const section = page.locator('#home-artworks');
    await expect(section).toBeVisible();

    const heading = section.getByRole('heading', { name: /œuvres/i }).first();
    await expect(heading).toBeVisible();

    const cards = await section.locator('a[href^="/galerie"]').count();
    if (cards > 0) {
      await expect(section.locator('a[href^="/galerie"]').first()).toBeVisible();
    } else {
      await expect(section).toContainText('Aucune œuvre en vedette');
    }
  });
});
