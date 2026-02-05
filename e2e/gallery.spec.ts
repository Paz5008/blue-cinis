import { test, expect } from '@playwright/test'

test('gallery page loads and shows heading', async ({ page }) => {
  const res = await page.goto('/galerie')
  expect(res?.ok()).toBeTruthy()
  await expect(page.getByRole('heading', { level: 1, name: /galerie/i })).toBeVisible()
})
