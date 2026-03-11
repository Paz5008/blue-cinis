import { test, expect } from '@playwright/test'

test.describe('Editor UX sandbox', () => {
  test('can add blocks from palette and see them on canvas', async ({ page }) => {
    // Intercept save API to avoid 404 during tests
    await page.route('**/api/artist/customization**', async route => {
      if (route.request().method() === 'PUT') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) })
      }
      return route.continue()
    })
    const res = await page.goto('/e2e/editor-sandbox')
    expect(res?.ok()).toBeTruthy()
    // Editor header visible
    await expect(page.getByRole('heading', { name: /Sandbox Éditeur/i })).toBeVisible()

    // Add a text block from the palette
    await page.getByTestId('palette-item-text').click()
    await expect(page.getByText('Nouveau texte').first()).toBeVisible()

    // Add an image block to trigger ALT guard later
    await page.getByTestId('palette-item-image').click()
    await expect(page.getByText('Image').first()).toBeVisible()

    // Try to publish -> ALT guard modal should appear
    await page.getByTestId('editor-publish-button').click()
    await expect(page.getByTestId('alt-guard-modal')).toBeVisible()

    // Publish anyway
    await page.getByRole('button', { name: /Publier quand même/i }).click()
    // The modal should disappear
    await expect(page.getByTestId('alt-guard-modal')).toBeHidden()
  })

  test('publishing sends a publish action payload to the keyed endpoint', async ({ page }) => {
    let payload: any = null
    await page.route('**/api/artist/customization/**', async route => {
      if (route.request().method() === 'PUT') {
        payload = JSON.parse(route.request().postData() || '{}')
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) })
      }
      return route.continue()
    })
    await page.goto('/e2e/editor-sandbox')
    await page.getByTestId('palette-item-text').click()
    await page.getByTestId('palette-item-image').click()
    await page.getByTestId('editor-publish-button').click()
    await page.getByRole('button', { name: /Publier quand même/i }).click()
    await expect(page.getByTestId('alt-guard-modal')).toBeHidden()
    expect(payload?.action).toBe('publish')
    expect(Array.isArray(payload?.blocks)).toBe(true)
  })

  test('can open theme panel from More menu', async ({ page }) => {
    await page.goto('/e2e/editor-sandbox')
    // Open the more menu (gear)
    await page.getByRole('button', { name: /Plus/i }).click()
    // Open theme panel
    await page.getByTestId('editor-theme-button').click()
    await expect(page.getByRole('heading', { name: /Thème/i })).toBeVisible()
  })

  test('inline text editing: H1 formatting', async ({ page }) => {
    await page.goto('/e2e/editor-sandbox')
    await page.getByTestId('palette-item-text').click()
    const editable = page.getByTestId('text-editable').first()
    await editable.click()
    // Select all and apply H1
    await page.keyboard.down('Control')
    await page.keyboard.press('KeyA')
    await page.keyboard.up('Control')
    await page.getByTestId('text-toolbar-h1').click()
    const html = await editable.innerHTML()
    expect(html.toLowerCase()).toContain('<h1')
  })

  test('inline text editing: bold toggle', async ({ page }) => {
    await page.goto('/e2e/editor-sandbox')
    await page.getByTestId('palette-item-text').click()
    const editable = page.getByTestId('text-editable').first()
    await editable.click()
    await page.keyboard.type('Texte test')
    // Select all then bold
    await page.keyboard.down('Control')
    await page.keyboard.press('KeyA')
    await page.keyboard.up('Control')
    await page.getByTestId('text-toolbar-bold').click()
    const html = await editable.innerHTML()
    const l = html.toLowerCase()
    expect(l.includes('<b') || l.includes('<strong')).toBeTruthy()
  })

  test('inline text editing: center alignment', async ({ page }) => {
    await page.goto('/e2e/editor-sandbox')
    await page.getByTestId('palette-item-text').click()
    const editable = page.getByTestId('text-editable').first()
    await page.getByTestId('text-toolbar-align-center').click()
    await expect(editable).toHaveCSS('text-align', 'center')
  })

  test('inline text editing: keyboard bold shortcut', async ({ page }) => {
    await page.goto('/e2e/editor-sandbox')
    await page.getByTestId('palette-item-text').click()
    const editable = page.getByTestId('text-editable').first()
    await editable.click()
    await page.keyboard.type('Raccourci bold')
    // Select all, then Ctrl/Cmd+B
    await page.keyboard.down('Control')
    await page.keyboard.press('KeyA')
    await page.keyboard.press('KeyB')
    await page.keyboard.up('Control')
    const html = (await editable.innerHTML()).toLowerCase()
    expect(html.includes('<b') || html.includes('<strong')).toBeTruthy()
  })

  test('inline text editing: clear format removes bold', async ({ page }) => {
    await page.goto('/e2e/editor-sandbox')
    await page.getByTestId('palette-item-text').click()
    const editable = page.getByTestId('text-editable').first()
    await editable.click()
    await page.keyboard.type('Texte net')
    // Bold via toolbar
    await page.keyboard.down('Control')
    await page.keyboard.press('KeyA')
    await page.keyboard.up('Control')
    await page.getByTestId('text-toolbar-bold').click()
    let html = (await editable.innerHTML()).toLowerCase()
    expect(html.includes('<b') || html.includes('<strong')).toBeTruthy()
    // Clear format
    await page.keyboard.down('Control')
    await page.keyboard.press('KeyA')
    await page.keyboard.up('Control')
    await page.getByTestId('text-toolbar-clear').click()
    html = (await editable.innerHTML()).toLowerCase()
    expect(!html.includes('<b') && !html.includes('<strong')).toBeTruthy()
  })

  test('inline text editing: italic shortcut and clear on heading with remove heading', async ({ page }) => {
    await page.goto('/e2e/editor-sandbox')
    await page.getByTestId('palette-item-text').click()
    const editable = page.getByTestId('text-editable').first()
    await editable.click()
    await page.keyboard.type('Texte italique')
    // Select all then Ctrl/Cmd+I
    await page.keyboard.down('Control')
    await page.keyboard.press('KeyA')
    await page.keyboard.press('KeyI')
    await page.keyboard.up('Control')
    let html = (await editable.innerHTML()).toLowerCase()
    expect(html.includes('<i') || html.includes('<em')).toBeTruthy()

    // Apply H1
    await page.keyboard.down('Control')
    await page.keyboard.press('KeyA')
    await page.keyboard.up('Control')
    await page.getByTestId('text-toolbar-h1').click()
    html = (await editable.innerHTML()).toLowerCase()
    expect(html).toContain('<h1')

    // Clear format (note: block-level heading typically remains)
    await page.keyboard.down('Control')
    await page.keyboard.press('KeyA')
    await page.keyboard.up('Control')
    await page.getByTestId('text-toolbar-clear').click()
    html = (await editable.innerHTML()).toLowerCase()
    expect(html).toContain('<h1')

    // Remove heading (force P)
    await page.getByTestId('text-toolbar-remove-heading').click()
    html = (await editable.innerHTML()).toLowerCase()
    expect(html).toContain('<p')
    expect(!html.includes('<h1') && !html.includes('<h2')).toBeTruthy()
  })
})
