import { test, expect } from '@playwright/test';

test('Gallery page friendly fallback when DB down (simulated)', async ({ page }) => {
  await page.goto('/galerie?simulate=dbdown');
  await expect(page.getByRole('heading', { name: 'Galerie indisponible' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Réessayer' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Nous contacter' })).toBeVisible();
});
