import { Page } from '@playwright/test';

/**
 * Helper functions useful for Playwright tests.
 * Provides common utilities for interactions and verifications.
 */

/**
 * Waits for element to be stable (not changing position) before interacting
 */
export async function waitForElementStable(page: Page, selector: string, timeout = 5000): Promise<void> {
	const element = page.locator(selector);
	await element.waitFor({ state: 'visible', timeout });

	let previousBox = await element.boundingBox();
	let stableCount = 0;
	const requiredStableIterations = 3;

	while (stableCount < requiredStableIterations) {
		await page.waitForTimeout(100);
		const currentBox = await element.boundingBox();

		if (previousBox && currentBox && previousBox.x === currentBox.x && previousBox.y === currentBox.y) {
			stableCount++;
		} else {
			stableCount = 0;
		}

		previousBox = currentBox;
	}
}

/**
 * Clicks element only if it's visible and clickable
 */
export async function safeClick(page: Page, selector: string): Promise<boolean> {
	try {
		const element = page.locator(selector);
		await element.waitFor({ state: 'visible', timeout: 5000 });
		await waitForElementStable(page, selector);
		await element.click();
		return true;
	} catch (error) {
		console.warn(`Safe click failed for selector ${selector}:`, error);
		return false;
	}
}

/**
 * Fills input field with error handling
 */
export async function safeFill(page: Page, selector: string, value: string): Promise<boolean> {
	try {
		const element = page.locator(selector);
		await element.waitFor({ state: 'visible', timeout: 5000 });
		await element.clear();
		await element.fill(value);
		return true;
	} catch (error) {
		console.warn(`Safe fill failed for selector ${selector}:`, error);
		return false;
	}
}

/**
 * Selects option from dropdown with error handling
 */
export async function safeSelect(page: Page, selector: string, value: string): Promise<boolean> {
	try {
		const element = page.locator(selector);
		await element.waitFor({ state: 'visible', timeout: 5000 });
		await element.selectOption(value);
		return true;
	} catch (error) {
		console.warn(`Safe select failed for selector ${selector}:`, error);
		return false;
	}
}

/**
 * Waits for any of multiple selectors to become visible
 */
export async function waitForAnySelector(page: Page, selectors: string[], timeout = 30000): Promise<string | null> {
	const promises = selectors.map(selector =>
		page
			.locator(selector)
			.waitFor({ state: 'visible', timeout })
			.then(() => selector)
	);

	try {
		return await Promise.race(promises);
	} catch (error) {
		console.warn('None of the selectors became visible:', selectors);
		return null;
	}
}

/**
 * Scrolls page to make element visible
 */
export async function scrollIntoView(page: Page, selector: string): Promise<boolean> {
	try {
		await page.locator(selector).scrollIntoViewIfNeeded();
		await page.waitForTimeout(500); // Wait for scroll completion
		return true;
	} catch (error) {
		console.warn(`Scroll into view failed for selector ${selector}:`, error);
		return false;
	}
}

/**
 * Checks if element contains specific text
 */
export async function hasText(page: Page, selector: string, expectedText: string): Promise<boolean> {
	try {
		const element = page.locator(selector);
		const actualText = await element.textContent();
		return actualText?.toLowerCase().includes(expectedText.toLowerCase()) || false;
	} catch (error) {
		console.warn(`Text check failed for selector ${selector}:`, error);
		return false;
	}
}

/**
 * Waits for element to contain specific text
 */
export async function waitForText(
	page: Page,
	selector: string,
	expectedText: string,
	timeout = 10000
): Promise<boolean> {
	try {
		await page.locator(selector).filter({ hasText: expectedText }).waitFor({
			state: 'visible',
			timeout
		});
		return true;
	} catch (error) {
		console.warn(`Wait for text failed for selector ${selector} with text "${expectedText}":`, error);
		return false;
	}
}

/**
 * Executes action with automatic retry
 */
export async function retryAction<T>(action: () => Promise<T>, maxRetries = 3, delay = 1000): Promise<T> {
	let lastError: Error;

	for (let attempt = 1; attempt <= maxRetries; attempt++) {
		try {
			return await action();
		} catch (error) {
			lastError = error as Error;
			console.warn(`Attempt ${attempt}/${maxRetries} failed:`, error);

			if (attempt < maxRetries) {
				await new Promise(resolve => setTimeout(resolve, delay));
			}
		}
	}

	throw lastError!;
}

/**
 * Generates random test data
 */
export const generateTestData = {
	email: () => `test-${Date.now()}@example.com`,
	firstName: () => `TestName${Math.random().toString(36).substring(7)}`,
	lastName: () => `TestSurname${Math.random().toString(36).substring(7)}`,
	phoneNumber: () =>
		`32${Math.floor(Math.random() * 100000000)
			.toString()
			.padStart(8, '0')}`,
	postalCode: () =>
		Math.floor(Math.random() * 99999)
			.toString()
			.padStart(5, '0'),
	location: () => ['Roma', 'Milano', 'Napoli', 'Torino', 'Palermo'][Math.floor(Math.random() * 5)]
};

/**
 * Formats date for Italian input fields
 */
export function formatDateForInput(date: Date): string {
	return date.toLocaleDateString('it-IT');
}

/**
 * Checks if page is in loading state
 */
export async function isPageLoading(page: Page): Promise<boolean> {
	const loadingSelectors = ['.loading', '.spinner', '[data-testid="loading"]', '.loader'];

	for (const selector of loadingSelectors) {
		if (await page.locator(selector).isVisible()) {
			return true;
		}
	}

	return false;
}

/**
 * Waits for page to finish loading
 */
export async function waitForPageLoad(page: Page, timeout = 30000): Promise<void> {
	await page.waitForLoadState('networkidle', { timeout });

	// Wait for loading indicators to disappear
	const startTime = Date.now();
	while ((await isPageLoading(page)) && Date.now() - startTime < timeout) {
		await page.waitForTimeout(500);
	}
}
