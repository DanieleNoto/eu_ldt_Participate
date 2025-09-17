import { TEST_USERS } from '@config/test-users';
import { LoginPage } from '@pages/pages/auth/LoginPage';
import { HomePage } from '@pages/pages/public/HomePage';
import { Page, Browser } from '@playwright/test';
import { STORAGE_STATE, TEST_SELECTORS } from './constants';

/**
 * Helper function to ensure the user is logged in.
 * If the user is not logged in, it performs the login again.
 * @param page - Playwright page instance
 * @param userType - Type of user ('USER', 'ADMIN', 'ACCOUNT_DELETION_USER')
 */
export async function ensureLoggedIn(page: Page, userType: keyof typeof STORAGE_STATE) {
	const homePage = new HomePage(page);
	await homePage.goToHomePage();
	const isLoggedIn = await page.isVisible('#trigger-dropdown-account');

	if (!isLoggedIn) {
		await _login(page, userType);
		if (userType === 'ADMIN') {
			const adminMenu = await page.locator(TEST_SELECTORS.ADMIN_BAR);
			if (await adminMenu.isVisible()) {
				console.log('Admin permissions verified');
			} else {
				console.warn('Admin menu not found, user might not have admin permissions');
			}
		}

		// Save authentication state
		await page.context().storageState({ path: STORAGE_STATE[userType] });

		console.log(`${userType} login completed and state saved.`);
	} else {
		console.log(`${userType} is already logged in.`);
	}
}

/**
 * Helper function to setup authentication in test beforeAll hooks.
 * This function handles both authentication and proper cleanup of the browser context.
 * @param browser - Playwright browser instance
 * @param userType - Type of user ('USER', 'ADMIN', 'ACCOUNT_DELETION_USER')
 */
export async function setupAuthForTest(browser: Browser, userType: keyof typeof STORAGE_STATE) {
	const context = await browser.newContext();
	const page = await context.newPage();

	try {
		await ensureLoggedIn(page, userType);
	} finally {
		// Always clean up the authentication context to prevent extra browser windows
		await page.close();
		await context.close();
	}
}

async function _login(page: Page, userType: keyof typeof STORAGE_STATE) {
	console.log(`${userType} session expired. Performing login again...`);
	const homePage = new HomePage(page);
	const loginPage = new LoginPage(page);
	await homePage.goToHomePage();
	await homePage.goToLoginFromHeader();
	// Perform login based on user type
	switch (userType) {
		case 'USER':
			await loginPage.loginAsUser();
			break;
		case 'ADMIN':
			await loginPage.loginAsAdmin();
			break;
		case 'ACCOUNT_DELETION_USER':
			await loginPage.loginAsUserToDelete();
			break;
		case 'USER_WITHOUT_MESSAGES':
			await loginPage.login(TEST_USERS.USER_WITHOUT_MESSAGES.email, TEST_USERS.USER_WITHOUT_MESSAGES.password);
			break;
		default:
			throw new Error(`Unknown user type: ${userType}`);
	}
	await page.waitForLoadState('networkidle');
	const isLoggedIn = await homePage.header.isUserLoggedIn();
	if (isLoggedIn) {
		console.log(userType + ' successfully logged in');
		const userInitials = await homePage.header.getUserInitials();
		console.log(`Logged in as: ${userInitials}`);
	} else {
		throw new Error(userType + ' login failed - user not logged in');
	}

	await page.context().storageState({ path: STORAGE_STATE[userType] });
}
