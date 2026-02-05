import { defineConfig } from '@playwright/test';

export default defineConfig({
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  testDir: 'e2e',
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
  webServer: {
    command: process.env.PRISMA_MOCK === '1' ? 'npm run build:mock && npm run start' : 'npm run build && npm run start',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  retries: 0,
});
