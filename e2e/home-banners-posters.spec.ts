import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 1440, height: 900 } });

test.describe('Home page artist highlights', () => {
  test('renders new artists marquee with banner previews', async ({ page }) => {
    await page.goto('/');
    const section = page.locator('#home-new-artists');
    await expect(section).toBeVisible();
    const cards = section.locator('.home-banner-card');
    await expect(cards.first()).toBeVisible();

    const htmlCard = cards.filter({
      has: section.locator('.artist-banner-canvas [data-canvas-page="banner"]'),
    }).first();
    if (await htmlCard.count()) {
      await expect(htmlCard.locator('.artist-banner-canvas [data-canvas-page="banner"]')).toBeVisible();
      const size = await htmlCard.evaluate((el) => {
        const rect = el.getBoundingClientRect();
        return { width: Math.round(rect.width), height: Math.round(rect.height) };
      });
      expect.soft(size.width).toBeLessThanOrEqual(1282);
      expect.soft(size.width).toBeGreaterThanOrEqual(1250);
      expect.soft(size.height).toBeGreaterThanOrEqual(318);
      expect.soft(size.height).toBeLessThanOrEqual(322);
    } else {
      const fallback = cards.first();
      const size = await fallback.evaluate((el) => {
        const rect = el.getBoundingClientRect();
        return { width: Math.round(rect.width), height: Math.round(rect.height) };
      });
      expect.soft(size.height).toBeGreaterThanOrEqual(318);
      expect.soft(size.height).toBeLessThanOrEqual(322);
    }
  });

  test('renders artist posters spotlight cards', async ({ page }) => {
    await page.goto('/');
    const section = page.locator('#home-artist-posters');
    await expect(section).toBeVisible();
    const article = section.locator('article').first();
    await expect(article).toBeVisible();

    const htmlPreview = article.locator('.artist-poster-preview');
    if (await htmlPreview.count()) {
      const preview = htmlPreview.first();
      await expect(preview).toBeVisible();
      const size = await preview.evaluate((el) => {
        const rect = el.getBoundingClientRect();
        return { width: Math.round(rect.width), height: Math.round(rect.height) };
      });
      expect.soft(size.height).toBeGreaterThanOrEqual(698);
      expect.soft(size.height).toBeLessThanOrEqual(702);
    } else {
      await expect(article.locator('img').first()).toBeVisible();
    }
  });
});
