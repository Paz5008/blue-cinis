import { test, expect } from '@playwright/test'

test.describe('Checkout to cancel (sandbox)', () => {
  test('can visit cancel page', async ({ page }) => {
    test.skip(process.env.E2E !== '1', 'E2E disabled by default')
    await page.goto('/cancel')
    await expect(page.getByRole('heading', { name: /Paiement annulé/i })).toBeVisible()
  })
})
