import { expect, test } from '@playwright/test';
import { SearchPage } from '../pages/GooglePage';

/**
 * Demonstrative smoke test for Google Search functionality
 */
test.describe('Google Search', () => {
	test('should search for a term and display results', async ({ page }) => {
		const searchPage = new SearchPage(page);
		await searchPage.goto();
		await searchPage.search('Playwright');

		// Verify the URL contains the search query
		await expect(page).toHaveURL(/search\?q=Playwright/);

		// Verify that search results are visible
		await expect(page.locator('#search')).toBeVisible();

		// Optionally check that the first result contains the term
		const firstResult = page.locator('h3').first();
		await expect(firstResult).toContainText('Playwright');
	});
});
