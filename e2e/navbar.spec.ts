import { test, expect } from '@playwright/test';

test.describe('Navbar', () => {
  test('displays gallery dropdown with categories', async ({ page }) => {
    await page.goto('/');
    const galleryButton = page.getByRole('button', { name: /Galerie/i });
    await galleryButton.click();
    await expect(page.getByRole('link', { name: /Peintures/i })).toBeVisible();
    await expect(page.getByRole('navigation', { name: /Menu principal/i })).toBeVisible();
  });

  test('shows account modal when unauthenticated', async ({ page }) => {
    await page.goto('/');
    const accountButton = page.getByRole('button', { name: /Se connecter/i });
    await accountButton.click();
    await expect(page.getByRole('dialog')).toBeVisible();
  });
});
