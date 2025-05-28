import { test, expect } from '@playwright/test';
import { UserConfigPage } from '../pages/UserConfigPage';

test.describe('User Navigation and UI Interactions', () => {
	let userConfigPage: UserConfigPage;

	test.beforeEach(async ({ page }) => {
		userConfigPage = new UserConfigPage(page);
	});

	test('should handle direct navigation to account page without login', async ({ page }) => {
		// Try to navigate directly to account page
		await page.goto('http://localhost:3000/account');

		// Should be redirected to login or shown an access denied message
		await page.waitForTimeout(2000);

		const currentUrl = page.url();
		const isRedirectedToAuth =
			currentUrl.includes('/sign_in') || currentUrl.includes('/login') || currentUrl.includes('/users/sign_in');

		if (isRedirectedToAuth) {
			// Verify we're on login page
			await expect(page.getByRole('button', { name: 'Log in' })).toBeVisible();
		} else {
			// Check for access denied or authentication required message
			const authMessages = [
				page.getByText('Please log in'),
				page.getByText('Authentication required'),
				page.getByText('Access denied'),
				page.getByText('You need to sign in')
			];

			let authMessageFound = false;
			for (const message of authMessages) {
				if (await message.isVisible()) {
					authMessageFound = true;
					break;
				}
			}

			// Either redirected or got appropriate message
			expect(authMessageFound || isRedirectedToAuth).toBe(true);
		}
	});

	test('should handle browser back and forward navigation', async ({ page }) => {
		// Navigate through the application
		await userConfigPage.navigateToHomePage();

		const cookiesButton = page.getByRole('button', { name: 'Accept all' });
		if (await cookiesButton.isVisible()) {
			await userConfigPage.acceptCookies();
		}

		await userConfigPage.clickLoginLink();
		await userConfigPage.navigateToSignIn();
		await userConfigPage.loginAsAdmin();
		await userConfigPage.navigateToMyAccount();

		// Verify we're on account page
		expect(page.url()).toContain('/account');

		// Go back in browser history
		await page.goBack();
		await page.waitForTimeout(1000);

		// Go forward again
		await page.goForward();
		await page.waitForTimeout(1000);

		// Should still be able to access account functionality
		expect(page.url()).toContain('/account');
		await expect(page.getByRole('button', { name: 'Update account' })).toBeVisible();
	});

	test('should handle page refresh during form filling', async ({ page }) => {
		// Complete login and navigate to account
		await userConfigPage.navigateToHomePage();

		const cookiesButton = page.getByRole('button', { name: 'Accept all' });
		if (await cookiesButton.isVisible()) {
			await userConfigPage.acceptCookies();
		}

		await userConfigPage.clickLoginLink();
		await userConfigPage.navigateToSignIn();
		await userConfigPage.loginAsAdmin();
		await userConfigPage.navigateToMyAccount();

		// Fill some form fields
		await page.locator('#user_date_of_birth_date').fill('15/08/1995');
		await page.getByLabel('Gender*Required field Male').selectOption('male');
		await page.getByRole('textbox', { name: 'Postal code Required field' }).fill('54321');

		// Refresh the page
		await page.reload();

		// Verify we're still on the account page and fields are reset or preserved
		expect(page.url()).toContain('/account');
		await expect(page.getByRole('button', { name: 'Update account' })).toBeVisible();

		// Fields should be either empty (reset) or preserved based on application behavior
		const dateField = page.locator('#user_date_of_birth_date');
		await expect(dateField).toBeVisible();
	});
});
