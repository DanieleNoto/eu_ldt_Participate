import { test as base } from '@playwright/test';
import { AdminConfigPage } from '../pages/AdminConfigPage';

// Extend the base test to include our fixtures
type TestFixtures = {
	adminConfigPage: AdminConfigPage;
	loggedInAdminPage: AdminConfigPage;
};

export const test = base.extend<TestFixtures>({
	// Fixture that provides a fresh AdminConfigPage instance
	adminConfigPage: async ({ page }, use) => {
		const adminConfigPage = new AdminConfigPage(page);
		await use(adminConfigPage);
	},

	// Fixture that provides a logged-in admin page ready for configuration
	loggedInAdminPage: async ({ page }, use) => {
		const adminConfigPage = new AdminConfigPage(page);

		// Perform login sequence
		await adminConfigPage.navigateToHomePage();
		await adminConfigPage.clickLoginLink();
		await adminConfigPage.navigateToSignIn();
		await adminConfigPage.acceptCookies();
		await adminConfigPage.loginAsAdmin();
		await adminConfigPage.navigateToAdminDashboard();
		await adminConfigPage.navigateToSettings();
		await adminConfigPage.navigateToExtraUserFields();

		await use(adminConfigPage);
	}
});

export { expect } from '@playwright/test';
