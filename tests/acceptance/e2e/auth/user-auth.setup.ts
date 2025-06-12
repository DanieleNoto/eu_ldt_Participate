import { LoginPage } from '@pages/auth/LoginPage';
import { HeaderComponent } from '@pages/shared/HeaderComponent';
import { test as setup } from '@playwright/test';
import { STORAGE_STATE, TEST_SELECTORS } from '../utils/constants';

/**
 * Global setup for user authentication.
 * This file is executed before tests to create authentication states.
 */

// Setup authentication for normal user
setup('authenticate as user', async ({ page }) => {
	console.log('Setting up user authentication...');

	await page.goto('/');
	const headerComponent = new HeaderComponent(page);

	// Accept cookies if present
	await headerComponent.acceptCookies();

	// Navigate to login page
	await headerComponent.goToLoginPage();

	const loginPage = new LoginPage(page);

	// Fill login form

	await loginPage.loginAsUser();

	// Wait for login completion
	await loginPage.waitForLoadState('networkidle');
	await page.waitForSelector(TEST_SELECTORS.HEADER.USER_MENU, { timeout: 10000 });

	// Save authentication state
	await page.context().storageState({ path: STORAGE_STATE.USER });

	console.log('User authentication completed');
});
