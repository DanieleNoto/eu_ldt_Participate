import { LoginPage } from '@pages/auth/LoginPage';
import { HeaderComponent } from '@pages/shared/HeaderComponent';
import { test as setup } from '@playwright/test';
import { STORAGE_STATE, TEST_SELECTORS } from '../utils/constants';

/**
 * Global setup for user authentication.
 * This file is executed before tests to create authentication states.
 */

// Setup authentication for administrator
setup('authenticate as admin', async ({ page }) => {
	console.log('Setting up admin authentication...');

	await page.goto('/');
	const headerComponent = new HeaderComponent(page);

	// Accept cookies if present
	await headerComponent.acceptCookies();

	// Navigate to login page
	await headerComponent.goToLoginPage();
	const loginPage = await new LoginPage(page);

	// Fill admin login form
	await loginPage.loginAsAdmin();

	// Wait for login completion

	await loginPage.waitForLoadState('networkidle');
	await page.waitForSelector(TEST_SELECTORS.HEADER.USER_MENU, { timeout: 10000 });

	// Verify user has admin permissions
	// This may vary based on specific implementation
	const adminMenu = page.locator(TEST_SELECTORS.ADMIN_BAR);
	if (await adminMenu.isVisible()) {
		console.log('Admin permissions verified');
	} else {
		console.warn('Admin menu not found, user might not have admin permissions');
	}

	// Save authentication state
	await page.context().storageState({ path: STORAGE_STATE.ADMIN });

	console.log('Admin authentication completed');
});
