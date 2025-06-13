import { LoginPage } from '@pages/pages/auth/LoginPage';
import { HomePage } from '@pages/pages/public/HomePage';
import { test as setup } from '@playwright/test';
import { STORAGE_STATE } from '../utils/constants';

/**
 * Global setup for user authentication.
 * This file is executed before tests to create authentication states.
 */

// Setup authentication for normal user
setup('authenticate as user', async ({ page }) => {
	console.log('Setting up user authentication...');

	// Navigate to home page and handle cookies automatically
	const homePage = new HomePage(page);
	await homePage.navigateToHomePage();

	// Wait for page to fully load
	await homePage.waitForPageToFullyLoad();

	// Navigate to login page
	await homePage.goToLoginFromHeader();
	const loginPage = new LoginPage(page);

	// Fill login form
	await loginPage.loginAsUser();

	// Wait for login completion
	await loginPage.waitForLoadState('networkidle');

	// Wait for user to be logged in (account dropdown should be visible)
	await homePage.header.waitForUserLogin();

	// Verify user is actually logged in
	const isLoggedIn = await homePage.header.isUserLoggedIn();
	if (isLoggedIn) {
		console.log('User successfully logged in');
		const userInitials = await homePage.header.getUserInitials();
		console.log(`Logged in as: ${userInitials}`);
	} else {
		throw new Error('User login failed - user not logged in');
	}

	// Save authentication state
	await page.context().storageState({ path: STORAGE_STATE.USER });

	console.log('User authentication completed');
});
