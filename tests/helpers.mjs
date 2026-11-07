import { expect } from '@playwright/test';

/** Opens the page and fails the test on any console error or uncaught exception. */
export async function openPage(page) {
  const problems = [];
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') problems.push(`console: ${m.text()}`); });
  await page.goto('/');
  await expect(page.locator('#stepnav button')).toHaveCount(18);
  return problems;
}

/** Goes to step n (1-based) through the step navigation. */
export async function goToStep(page, n) {
  await page.locator('#stepnav button').nth(n - 1).click();
  await expect(page.locator('#hudEyebrow')).toHaveText(`Fig. ${n} / 18`);
}

/** Clicks a segmented-control option: step index (0-based), key, value. */
export async function pick(page, k, key, val) {
  await page.locator(`.seg[data-step="${k}"][data-key="${key}"] button[data-val="${val}"]`).click();
}

/** Error rate shown in the HUD, as a number between 0 and 100. */
export async function errorRate(page) {
  const t = (await page.locator('#mErr').textContent()).replace(',', '.');
  return parseFloat(t);
}

/** Waits until the HUD error rate satisfies a predicate. */
export async function expectErrors(page, predicate, message) {
  await expect.poll(() => errorRate(page), { message, timeout: 25_000 }).toSatisfy(predicate);
}
