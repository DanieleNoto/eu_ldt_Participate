import { AdminHomePage } from '@pages/pages/admin/AdminHomePage';
import { LoginPage } from '@pages/pages/auth/LoginPage';
import { HomePage } from '@pages/pages/public/HomePage';
import { test as setup } from '@playwright/test';
import { STORAGE_STATE, TEST_SELECTORS } from '../utils/constants';

/**
 * Global setup for user authentication.
 * This file is executed before tests to create authentication states.
 */

// Setup authentication for administrator
setup('authenticate as admin', async ({ page }) => {
	console.log('Setting up admin authentication...');

	// Navigate to home page and handle cookies automatically
	const homePage = new HomePage(page);
	await homePage.navigateToHomePage();

	// Wait for page to fully load
	await homePage.waitForPageToFullyLoad();

	// Navigate to login page
	await homePage.goToLoginFromHeader();
	const loginPage = new LoginPage(page);

	// Fill admin login form
	await loginPage.loginAsAdmin();

	// Wait for login completion
	await loginPage.waitForLoadState('networkidle');

	// Wait for user to be logged in (account dropdown should be visible)
	await homePage.header.waitForUserLogin();

	// Verify user has admin permissions
	// This may vary based on specific implementation
	const adminMenu = page.locator(TEST_SELECTORS.ADMIN_BAR);
	if (await adminMenu.isVisible()) {
		console.log('Admin permissions verified');
	} else {
		console.warn('Admin menu not found, user might not have admin permissions');
	}

	// Verify user is actually logged in
	const isLoggedIn = await homePage.header.isUserLoggedIn();
	if (isLoggedIn) {
		console.log('Admin successfully logged in');
		const userInitials = await homePage.header.getUserInitials();
		console.log(`Logged in as: ${userInitials}`);
	} else {
		throw new Error('Admin login failed - user not logged in');
	}

	// Navigate to AdminHomePage and set English locale
	console.log('Navigating to admin dashboard...');
	const adminHomePage = new AdminHomePage(page);
	await adminHomePage.navigateToAdminHomePage('en');

	// Wait for admin dashboard to load completely
	await adminHomePage.waitForDashboardToLoad();

	// Set locale to English using AdminTitleBarComponent
	console.log('Setting locale to English...');

	await adminHomePage.setEnglishLocale();

	// Save authentication state
	await page.context().storageState({ path: STORAGE_STATE.ADMIN });

	console.log('Admin authentication completed with English locale set');
});
