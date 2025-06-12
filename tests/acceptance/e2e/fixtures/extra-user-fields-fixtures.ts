import { test as base } from '@playwright/test';
import { ExtraUserFieldsAdminPage } from '../pages/admin/ExtraUserFieldsAdminPage';
import { LoginPage } from '../pages/auth/LoginPage';
import { UserExtraFieldsPage, UserFieldsData } from '../pages/user/UserExtraFieldsPage';

// Extend the base test to include our fixtures
type ExtraUserFieldsFixtures = {
	extraUserFieldsAdminPage: ExtraUserFieldsAdminPage;
	userExtraFieldsPage: UserExtraFieldsPage;
	loginPage: LoginPage;
	loggedInAdminPage: ExtraUserFieldsAdminPage;
	loggedInUserPage: UserExtraFieldsPage;
	defaultUserData: UserFieldsData;
};

export const extraUserFieldsTest = base.extend<ExtraUserFieldsFixtures>({
	// Basic page instances
	extraUserFieldsAdminPage: async ({ page }, use) => {
		const adminPage = new ExtraUserFieldsAdminPage(page);
		await use(adminPage);
	},

	userExtraFieldsPage: async ({ page }, use) => {
		const userPage = new UserExtraFieldsPage(page);
		await use(userPage);
	},

	loginPage: async ({ page }, use) => {
		const loginPage = new LoginPage(page);
		await use(loginPage);
	},

	// Pre-logged in admin page ready for extra user fields configuration
	loggedInAdminPage: async ({ page }, use) => {
		const adminPage = new ExtraUserFieldsAdminPage(page);
		await adminPage.setupExtraUserFields();
		await use(adminPage);
	},

	// Pre-logged in user page ready for profile modification
	loggedInUserPage: async ({ page }, use) => {
		const userPage = new UserExtraFieldsPage(page);
		await userPage.performUserLogin();
		await userPage.navigateToMyAccount();
		await use(userPage);
	},

	// Default test data for user fields
	defaultUserData: async ({}, use) => {
		const userData: UserFieldsData = {
			dateOfBirth: '10/04/1996',
			gender: 'female',
			country: 'IT',
			postalCode: '00144',
			phoneNumber: '3258023921',
			location: 'Rome'
		};
		await use(userData);
	}
});

export { expect } from '@playwright/test';

// Test data generators for different scenarios
export class ExtraUserFieldsTestDataGenerator {
	static generateValidUserData(uniqueId: string = Date.now().toString()): UserFieldsData {
		return {
			dateOfBirth: '15/03/1990',
			gender: 'male',
			country: 'IT',
			postalCode: `001${uniqueId.slice(-2)}`,
			phoneNumber: `32580239${uniqueId.slice(-2)}`,
			location: `Test City ${uniqueId}`
		};
	}

	static generateInvalidUserData(): Partial<UserFieldsData> {
		return {
			dateOfBirth: '32/13/1990', // Invalid date
			postalCode: '', // Empty required field
			phoneNumber: 'invalid-phone', // Invalid phone format
			location: '' // Empty required field
		};
	}

	static generateMinimalUserData(): UserFieldsData {
		return {
			dateOfBirth: '01/01/1990',
			gender: 'other',
			country: 'US',
			postalCode: '12345',
			phoneNumber: '1234567890',
			location: 'Test Location'
		};
	}
}
