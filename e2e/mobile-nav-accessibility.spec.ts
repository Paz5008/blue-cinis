import { test, expect } from '@playwright/test';

test.describe('Mobile navigation accessibility', () => {
  test('focus is trapped inside the mobile menu and restored on close', async ({ page }) => {
    await page.setViewportSize({ width: 420, height: 900 });
    await page.goto('/');

    const toggleButton = page.getByRole('button', { name: /Ouvrir le menu/i });
    await expect(toggleButton).toBeVisible();

    await toggleButton.click();

    const panel = page.getByRole('dialog', { name: /Menu/i });
    await expect(panel).toBeVisible();

    const activeWithinPanel = await page.evaluate(() => {
      const active = document.activeElement as HTMLElement | null;
      return active?.closest('[role="dialog"]')?.id ?? null;
    });
    expect(activeWithinPanel).toBe('mobile-nav-panel');

    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden({ timeout: 2000 });
    await expect(toggleButton).toBeFocused();
    await expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
  });
});