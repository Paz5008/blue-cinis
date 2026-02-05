import { test, expect } from '@playwright/test';

test.describe('Theme mode persistence', () => {
  test('toggles dark mode and persists preference', async ({ page, context }) => {
    await page.goto('/');

    const enableDark = page.getByRole('button', { name: /Mode sombre/i });
    await enableDark.click();

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    await expect.poll(async () => {
      const cookies = await context.cookies();
      return cookies.find((cookie) => cookie.name === 'theme')?.value;
    }).toBe('dark');

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    const disableDark = page.getByRole('button', { name: /Mode clair/i });
    await disableDark.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

    await expect.poll(async () => {
      const cookies = await context.cookies();
      return cookies.find((cookie) => cookie.name === 'theme')?.value;
    }).toBe('light');
  });
});