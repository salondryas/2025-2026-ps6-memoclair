import { test, expect } from '@playwright/test';
import { testUrl } from 'e2e/e2e.config';

test.describe('Home page display', () => {
  test('App renders router outlet without starter content', async ({ page }) => {
    await page.goto(testUrl);
    const starterDescription = page.getByText('Start your first app!');
    const showSuccessButton = page.getByRole('button', { name: 'Show success!' });
    const successMessage = page.getByText('Wow!');
    await expect(starterDescription).not.toBeVisible();
    await expect(showSuccessButton).not.toBeVisible();
    await expect(successMessage).not.toBeVisible();
  });
});
