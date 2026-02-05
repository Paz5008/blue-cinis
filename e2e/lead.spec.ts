import { test, expect } from '@playwright/test'

test.describe('Lead flow (sandbox)', () => {
  test('user can submit the contact form with fallback', async ({ page }) => {
    test.skip(process.env.E2E !== '1', 'E2E disabled by default')
    let requestBody: Record<string, any> | null = null
    await page.route('**/api/leads', async (route) => {
      requestBody = route.request().postDataJSON()
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'lead_123' }),
      })
    })

    await page.goto('/contact')
    await page.getByLabel('Nom complet').fill('Test User')
    await page.getByLabel('Email').fill('test@example.com')
    await page.getByLabel('Sujet').fill('Renseignements')
    await page.getByLabel('Message').fill('Pouvez-vous me rappeler ?')
    await page.getByRole('button', { name: /fallback manuel/i }).click()
    await page.getByLabel(/Je confirme être humain/i).check()
    await page.getByRole('button', { name: /Envoyer le message/i }).click()
    await expect(
      page.getByText('Merci pour votre message, nous revenons vers vous rapidement.').first(),
    ).toBeVisible()

    let body: Record<string, any>
    if (!requestBody) {
      throw new Error('Le corps de requête n’a pas été intercepté')
    }
    body = requestBody
    expect(body).toMatchObject({
      name: 'Test User',
      email: 'test@example.com',
    })
    expect(body.message).toContain('Renseignements')
    expect(body.message).toContain('Pouvez-vous me rappeler ?')
  })
})
