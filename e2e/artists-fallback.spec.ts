import { test, expect } from '@playwright/test';

test('Artists page friendly fallback when DB down (simulated)', async ({ page }) => {
  await page.goto('/artistes?simulate=dbdown');
  await expect(page.getByRole('heading', { name: 'Artistes indisponibles' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Réessayer' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Nous contacter' })).toBeVisible();
});
