import { test as base } from '@playwright/test';
import { ExtraUserFieldsAdminPage } from '../pages/admin/ExtraUserFieldsAdminPage';
import { ProcessAdminPage } from '../pages/admin/ProcessAdminPage';
import { LoginPage } from '../pages/auth/LoginPage';

// Define fixtures for administrators
type AdminFixtures = {
	extraUserFieldsAdmin: ExtraUserFieldsAdminPage;
	processAdmin: ProcessAdminPage;
	loginPage: LoginPage;
};

/**
 * Extended test with specific fixtures for administrators.
 * Uses storage state to maintain admin authentication.
 */
export const adminTest = base.extend<AdminFixtures>({
	extraUserFieldsAdmin: async ({ page }, use) => {
		const extraUserFieldsPage = new ExtraUserFieldsAdminPage(page);
		await use(extraUserFieldsPage);
	},

	processAdmin: async ({ page }, use) => {
		const processPage = new ProcessAdminPage(page);
		await use(processPage);
	},

	loginPage: async ({ page }, use) => {
		const loginPage = new LoginPage(page);
		await use(loginPage);
	}
});

export { expect } from '@playwright/test';
