import { test, expect } from '@playwright/test';

test.describe('Editor Drag & Drop', () => {
  test('drag from palette to canvas adds block', async ({ page }) => {
    // 1. Go to sandbox
    const res = await page.goto('/e2e/editor-sandbox');
    expect(res?.ok()).toBeTruthy();

    // 2. Locate palette item
    const paletteItem = page.getByTestId('palette-item-text');
    await expect(paletteItem).toBeVisible();

    // 3. Locate canvas (drop target)
    // We target the inner main which acts as the canvas frame (has resize-x class)
    const canvas = page.locator('main.resize-x').first(); 

    // 4. Perform Drag & Drop
    // Use Playwright's native dragAndDrop for HTML5 DnD compatibility
    await paletteItem.dragTo(canvas);
    
    // Alternative if dragTo doesn't work (force events):
    // await page.dragAndDrop('[data-testid="palette-item-text"]', 'main.resize-x');

    // 5. Verify Text Block appears
    // The default text block usually contains "Nouveau texte" or is editable.
    await expect(page.getByText('Nouveau texte').first()).toBeVisible({ timeout: 10000 });
  });
});
