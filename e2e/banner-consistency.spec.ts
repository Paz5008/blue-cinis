import { test, expect } from '@playwright/test';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

const ARTIST_SLUG = process.env.E2E_BANNER_SLUG ?? 'jules-paz';
const DIFF_THRESHOLD = Number.parseFloat(process.env.E2E_BANNER_DIFF_THRESHOLD ?? '0.015');

type Viewport = { width: number; height: number };

function compareScreenshots(
  baseline: Buffer,
  candidate: Buffer,
  label: string,
  testInfo: import('@playwright/test').TestInfo,
) {
  const imgA = PNG.sync.read(baseline);
  const imgB = PNG.sync.read(candidate);

  if (imgA.width !== imgB.width || imgA.height !== imgB.height) {
    throw new Error(
      `Les dimensions diffèrent pour ${label} (CMS ${imgA.width}×${imgA.height} vs Home ${imgB.width}×${imgB.height}).`,
    );
  }

  const diff = new PNG({ width: imgA.width, height: imgA.height });
  const mismatched = pixelmatch(imgA.data, imgB.data, diff.data, imgA.width, imgA.height, {
    threshold: 0.1,
    includeAA: false,
  });
  const ratio = mismatched / (imgA.width * imgA.height);

  if (ratio > DIFF_THRESHOLD) {
    const diffBuffer = PNG.sync.write(diff);
    testInfo.attach(`banner-diff-${label}`, {
      body: diffBuffer,
      contentType: 'image/png',
    });
  }

  return ratio;
}

async function captureCmsBanner(page: import('@playwright/test').Page, slug: string) {
  const locator = page.getByTestId('banner-preview-html');
  const count = await locator.count();
  if (count === 0) {
    test.skip(true, `Pas de canevas publié pour l'artiste "${slug}".`);
  }
  const section = locator.locator('.artist-theme').first();
  await section.waitFor({ state: 'visible' });
  await section.evaluate((node) => node.scrollIntoView({ block: 'center', inline: 'center' }));
  return section.screenshot({ type: 'png' });
}

async function captureHomeBanner(page: import('@playwright/test').Page, slug: string) {
  const card = page.locator(`.home-banner-card[data-artist-slug="${slug}"]`).first();
  const count = await card.count();
  if (count === 0) {
    test.skip(true, `La home ne contient pas de carte pour "${slug}".`);
  }
  const canvas = card.locator('.artist-theme').first();
  await canvas.waitFor({ state: 'visible' });
  await canvas.scrollIntoViewIfNeeded();
  await page.evaluate(() => {
    const style = document.createElement('style');
    style.id = 'snapshot-freeze';
    style.innerHTML = `
      *, *::before, *::after {
        animation: none !important;
        transition: none !important;
      }
      [data-banner-preset] {
        transform: none !important;
      }
    `;
    document.head.appendChild(style);
  });
  return canvas.screenshot({ type: 'png' });
}

async function assertBannerParity(
  page: import('@playwright/test').Page,
  testInfo: import('@playwright/test').TestInfo,
  viewport: Viewport,
  label: string,
) {
  await page.setViewportSize(viewport);

  await page.goto(`/e2e/banner-preview/${ARTIST_SLUG}`);
  const cmsShot = await captureCmsBanner(page, ARTIST_SLUG);

  await page.goto('/');
  const homeShot = await captureHomeBanner(page, ARTIST_SLUG);

  const diffRatio = compareScreenshots(cmsShot, homeShot, label, testInfo);
  testInfo.annotations.push({
    type: 'info',
    description: `Différence ${label}: ${(diffRatio * 100).toFixed(3)}% (seuil ${DIFF_THRESHOLD * 100}%)`,
  });
  expect(diffRatio).toBeLessThanOrEqual(DIFF_THRESHOLD);
}

test.describe('Parité bandeau CMS ↔ Home', () => {
  test('Rendu desktop identique', async ({ page }, testInfo) => {
    await assertBannerParity(page, testInfo, { width: 1440, height: 900 }, 'desktop');
  });

  test('Rendu mobile identique', async ({ page }, testInfo) => {
    await assertBannerParity(page, testInfo, { width: 430, height: 932 }, 'mobile');
  });
});
