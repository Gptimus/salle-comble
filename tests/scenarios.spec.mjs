// Behavioural checks: each lesson of the notice must still play out in the simulation.
import { test, expect } from '@playwright/test';
import { openPage, goToStep, pick, expectErrors } from './helpers.mjs';

test.describe.configure({ mode: 'parallel' });

test('12 · a booking peak fills the queue instead of failing payments', async ({ page }) => {
  await openPage(page);
  await goToStep(page, 12);
  await pick(page, 11, 'mode', 'queue');
  await page.locator('#peakBtn').click();
  await expect(page.locator('#qline')).toContainText(/Queue [1-9]/);
  await expectErrors(page, (e) => e < 1, 'queued bookings should not fail');
});

test('14 · Kubernetes recreates a killed pod', async ({ page }) => {
  await openPage(page);
  await goToStep(page, 14);
  // Record the short "7 ready" state as it happens, so a slow runner cannot miss it.
  await page.evaluate(() => {
    const qline = document.querySelector('#qline');
    window.seenSevenReady = false;
    const observer = new MutationObserver(() => {
      if (qline.textContent.includes('7 prêts')) {
        window.seenSevenReady = true;
        observer.disconnect();
      }
    });
    observer.observe(qline, { childList: true, subtree: true, characterData: true });
  });
  await page.locator('#killPodBtn').click();
  await expect.poll(() => page.evaluate(() => window.seenSevenReady)).toBe(true);
  await expect(page.locator('#qline')).toContainText('8 prêts');
});

test('15 · recreate goes offline, canary rolls back a buggy release', async ({ page }) => {
  await openPage(page);
  await goToStep(page, 15);
  await pick(page, 14, 'strategy', 'recreate');
  await page.locator('#deployBtn').click();
  await expect(page.locator('#verdict')).toContainText('Hors ligne');
  await expect(page.locator('#depHint')).toContainText('v2 en ligne');

  await pick(page, 14, 'strategy', 'canary');
  await page.locator('#bugBtn').click();
  await page.locator('#deployBtn').click();
  await expect(page.locator('#depHint')).toContainText('Retour automatique', { timeout: 30_000 });
});

test('16 · a slow dependency cascades; the circuit breaker contains it', async ({ page }) => {
  await openPage(page);
  await goToStep(page, 16);
  await page.locator('#depSlowBtn').click();
  await expectErrors(page, (e) => e >= 50, 'no timeout: the whole site should fail');
  await pick(page, 15, 'timeout', '250');
  await pick(page, 15, 'retry', 'backoff');
  await pick(page, 15, 'cb', 'on');
  await expect(page.locator('#qline')).toContainText('disjoncteur ouvert');
  await expectErrors(page, (e) => e < 2, 'circuit breaker should serve fallbacks');
});

test('17 · losing Paris fails over to Montréal', async ({ page }) => {
  await openPage(page);
  await goToStep(page, 17);
  await page.locator('#regDownBtn').click();
  await expect(page.locator('#verdict')).toContainText('Hors ligne');
  await page.locator('#regDownBtn').click();
  await pick(page, 16, 'topo', 'multi');
  await page.locator('#regDownBtn').click();
  await expect(page.locator('#qline')).toContainText('primaire Montréal', { timeout: 20_000 });
});

test('18 · an unprotected incident pages the on-call', async ({ page }) => {
  await openPage(page);
  await goToStep(page, 18);
  await pick(page, 17, 'cb', 'off');
  await page.locator('#depSlowBtn2').click();
  await expect(page.locator('#qline')).toContainText('astreinte appelée', { timeout: 30_000 });
  await expect(page.locator('#obsLog')).toContainText('ALERTE critique');
  await expect(page.locator('#traceSvg')).toContainText('service-places');
});
