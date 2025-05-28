import { test, expect } from '@playwright/test';
import { AdminConfigPage } from '../pages/AdminConfigPage';

// test.describe('Admin Extra User Fields Configuration - Error Handling', () => {
// 	let adminConfigPage: AdminConfigPage;

// 	test.beforeEach(async ({ page }) => {
// 		adminConfigPage = new AdminConfigPage(page);
// 	});

// 	test('should handle server error when saving configuration', async ({ page }) => {
// 		// Setup: Login and navigate to configuration
// 		await adminConfigPage.navigateToHomePage();
// 		await adminConfigPage.clickLoginLink();
// 		await adminConfigPage.navigateToSignIn();
// 		await adminConfigPage.acceptCookies();
// 		await adminConfigPage.loginAsAdmin();
// 		await adminConfigPage.navigateToAdminDashboard();
// 		await adminConfigPage.navigateToSettings();
// 		await adminConfigPage.navigateToExtraUserFields();
// 		await adminConfigPage.enableAllExtraUserFields();

// 		// Simulate server error
// 		await adminConfigPage.simulateServerErrorOnSave();

// 		// Step 6.1: Administrator clicks "Save"
// 		await adminConfigPage.saveConfiguration();

// 		// Step 6.3: System displays an error message indicating submission failure
// 		await adminConfigPage.waitForErrorMessage();
// 		const errorMessage = await adminConfigPage.getErrorMessage();
// 		expect(errorMessage).toMatch(/error|failed|server/i);

// 		// Step 6.4: Administrator reviews the error message and retries saving
// 		await adminConfigPage.retrySave();

// 		// Result: System logs the submission error, and administrator can retry saving changes
// 		await adminConfigPage.checkSuccessMessage();
// 	});

// 	test('should handle network failure when saving configuration', async ({ page }) => {
// 		// Setup: Login and navigate to configuration
// 		await adminConfigPage.navigateToHomePage();
// 		await adminConfigPage.clickLoginLink();
// 		await adminConfigPage.navigateToSignIn();
// 		await adminConfigPage.acceptCookies();
// 		await adminConfigPage.loginAsAdmin();
// 		await adminConfigPage.navigateToAdminDashboard();
// 		await adminConfigPage.navigateToSettings();
// 		await adminConfigPage.navigateToExtraUserFields();
// 		await adminConfigPage.enableAllExtraUserFields();

// 		// Simulate network failure
// 		await adminConfigPage.simulateNetworkErrorOnSave();

// 		// Administrator clicks "Save"
// 		await adminConfigPage.saveConfiguration();

// 		// System attempts to save but encounters network error
// 		await adminConfigPage.waitForErrorMessage();
// 		const errorMessage = await adminConfigPage.getErrorMessage();
// 		expect(errorMessage).toMatch(/network|connection|failed/i);

// 		// Administrator reviews error and retries
// 		await adminConfigPage.retrySave();

// 		// Verify successful save after retry
// 		await adminConfigPage.checkSuccessMessage();
// 	});
// });
