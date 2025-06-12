import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/auth/LoginPage';
import { UserExtraFieldsPage } from '../pages/user/UserExtraFieldsPage';

// Define fixtures for normal users
type UserFixtures = {
	userExtraFields: UserExtraFieldsPage;
	loginPage: LoginPage;
};

/**
 * Extended test with specific fixtures for normal users.
 * Uses storage state to maintain authentication.
 */
export const userTest = base.extend<UserFixtures>({
	userExtraFields: async ({ page }, use) => {
		const extraFieldsPage = new UserExtraFieldsPage(page);
		await use(extraFieldsPage);
	},

	loginPage: async ({ page }, use) => {
		const loginPage = new LoginPage(page);
		await use(loginPage);
	}
});

export { expect } from '@playwright/test';
