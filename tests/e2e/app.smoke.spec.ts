import { expect, test } from '@playwright/test';

test('renders markdown content from a file fixture', async ({ page }) => {
  await page.goto('/tests/e2e/harness.html');

  await expect(page.locator('#content h1')).toHaveText('Smoke Test Plan');
  await expect(page.locator('#content')).toContainText('Layered test coverage');
});

test('shows interactive controls and records accept decisions', async ({ page }) => {
  await page.goto('/tests/e2e/harness.html?interactive=1');

  await expect(page.locator('#action-bar')).toBeVisible();
  await page.locator('#note-input').fill('looks good');
  await page.locator('#btn-accept').click();

  await expect
    .poll(() =>
      page.evaluate(() => window.__HARNESS_DECISIONS__ ?? [])
    )
    .toEqual([{ accepted: true, note: 'looks good' }]);
});

test('hides interactive controls in non-interactive mode', async ({ page }) => {
  await page.goto('/tests/e2e/harness.html');

  await expect(page.locator('#action-bar')).toHaveCount(0);
});
