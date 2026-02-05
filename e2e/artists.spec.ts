import { test, expect } from '@playwright/test'

test('artists page loads and shows heading', async ({ page }) => {
  const res = await page.goto('/artistes')
  expect(res?.ok()).toBeTruthy()
  await expect(page.getByRole('heading', { level: 1, name: /nos artistes/i })).toBeVisible()
})
