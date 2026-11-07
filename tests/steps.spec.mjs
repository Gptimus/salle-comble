import { test, expect } from '@playwright/test';
import { openPage, goToStep } from './helpers.mjs';

test('every step loads, holds its default load and shows a capacity', async ({ page }) => {
  const problems = await openPage(page);
  await expect(page).toHaveTitle(/18 étapes/);
  for (let n = 1; n <= 18; n++) {
    await goToStep(page, n);
    await expect(page.locator('#hudTitle')).not.toBeEmpty();
    await expect(page.locator(`[data-cap="${n - 1}"]`)).toHaveText(/fans|hors ligne/);
    // Default settings of every step hold the default load without errors.
    await expect(page.locator('#mErr'), `step ${n}`).toHaveText('0 %');
  }
  expect(problems).toEqual([]);
});

test('the load slider drives the simulation into saturation', async ({ page }) => {
  await openPage(page);
  await goToStep(page, 2);
  // 10 million fans on a single server (range inputs cannot be typed into).
  await page.locator('#users').evaluate((r) => { r.value = '1000'; r.dispatchEvent(new Event('input', { bubbles: true })); });
  await expect(page.locator('#verdict')).toContainText(/Saturé|Hors ligne|perdues/);
});
