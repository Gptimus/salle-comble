// Runs on desktop and on a phone viewport.
import { test, expect } from '@playwright/test';
import { openPage } from './helpers.mjs';

test('no horizontal scroll, SEO tags present', async ({ page }) => {
  const problems = await openPage(page);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://gptimus.github.io/salle-comble/');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /og\.png$/);
  const ld = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent());
  expect(ld['@type']).toBe('LearningResource');
  expect(problems).toEqual([]);
});

test('static files are served', async ({ request }) => {
  for (const path of ['robots.txt', 'sitemap.xml', 'og.png']) {
    const res = await request.get(path);
    expect(res.status(), path).toBe(200);
  }
});
