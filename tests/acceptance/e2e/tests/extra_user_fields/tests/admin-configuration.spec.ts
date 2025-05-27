import { test, expect } from '@playwright/test';
import { AdminConfigPage } from '../pages/AdminConfigPage';

test.describe('Admin Extra User Fields Configuration', () => {
	let adminConfigPage: AdminConfigPage;

	test.beforeEach(async ({ page }) => {
		adminConfigPage = new AdminConfigPage(page);
	});

	test('should successfully configure extra user fields as admin', async ({ page }) => {
		// Navigate to home and login
		await adminConfigPage.navigateToHomePage();
		await adminConfigPage.clickLoginLink();
		await adminConfigPage.navigateToSignIn();
		await adminConfigPage.acceptCookies();
		await adminConfigPage.loginAsAdmin();

		// Navigate to admin dashboard and settings
		await adminConfigPage.navigateToAdminDashboard();
		await adminConfigPage.navigateToSettings();
		await adminConfigPage.navigateToExtraUserFields();

		// Enable all extra user fields
		await adminConfigPage.enableAllExtraUserFields();
		await adminConfigPage.saveConfiguration();

		// Wait for success message
		await adminConfigPage.checkSuccessMessage();

		// Verify that all checkboxes are checked
		await expect(page.getByRole('checkbox', { name: 'Enable extra user fields' })).toBeChecked();
		await expect(page.getByRole('checkbox', { name: 'Enable date of birth field' })).toBeChecked();
		await expect(page.getByRole('checkbox', { name: 'Enable country field' })).toBeChecked();
		await expect(page.getByRole('checkbox', { name: 'Enable postal code field' })).toBeChecked();
		await expect(page.getByRole('checkbox', { name: 'Enable gender field' })).toBeChecked();
		await expect(page.getByRole('checkbox', { name: 'Enable phone number field' })).toBeChecked();
		await expect(page.getByRole('checkbox', { name: 'Enable location field' })).toBeChecked();
	});

	test('should allow selective enabling of user fields', async ({ page }) => {
		// Setup: Login and navigate to configuration
		await adminConfigPage.navigateToHomePage();
		await adminConfigPage.clickLoginLink();
		await adminConfigPage.navigateToSignIn();
		await adminConfigPage.acceptCookies();
		await adminConfigPage.loginAsAdmin();
		await adminConfigPage.navigateToAdminDashboard();
		await adminConfigPage.navigateToSettings();
		await adminConfigPage.navigateToExtraUserFields();

		// Enable only specific fields
		await page.goto('http://localhost:3000/admin/extra_user_fields/');
		await page.getByRole('checkbox', { name: 'Enable extra user fields' }).check();
		await page.getByRole('checkbox', { name: 'Enable date of birth field' }).check();
		await page.getByRole('checkbox', { name: 'Enable country field' }).check();
		// Leave other fields unchecked

		await adminConfigPage.saveConfiguration();

		// Verify only selected fields are enabled
		await expect(page.getByRole('checkbox', { name: 'Enable extra user fields' })).toBeChecked();
		await expect(page.getByRole('checkbox', { name: 'Enable date of birth field' })).toBeChecked();
		await expect(page.getByRole('checkbox', { name: 'Enable country field' })).toBeChecked();
	});

	test('should maintain configuration state after page reload', async ({ page }) => {
		// Setup and configure fields
		await adminConfigPage.navigateToHomePage();
		await adminConfigPage.clickLoginLink();
		await adminConfigPage.navigateToSignIn();
		await adminConfigPage.acceptCookies();
		await adminConfigPage.loginAsAdmin();
		await adminConfigPage.navigateToAdminDashboard();
		await adminConfigPage.navigateToSettings();
		await adminConfigPage.navigateToExtraUserFields();

		await adminConfigPage.enableAllExtraUserFields();
		await adminConfigPage.saveConfiguration();
		await adminConfigPage.checkSuccessMessage();

		// Reload the page
		await page.reload();

		// Verify configuration persisted
		await expect(page.getByRole('checkbox', { name: 'Enable extra user fields' })).toBeChecked();
		await expect(page.getByRole('checkbox', { name: 'Enable date of birth field' })).toBeChecked();
		await expect(page.getByRole('checkbox', { name: 'Enable country field' })).toBeChecked();
	});
	test('should validate form before submission to prevent errors', async ({ page }) => {
		// Setup: Login and navigate to configuration
		await adminConfigPage.navigateToHomePage();
		await adminConfigPage.clickLoginLink();
		await adminConfigPage.navigateToSignIn();
		await adminConfigPage.acceptCookies();
		await adminConfigPage.loginAsAdmin();
		await adminConfigPage.navigateToAdminDashboard();
		await adminConfigPage.navigateToSettings();
		await adminConfigPage.navigateToExtraUserFields();

		// Attempt to save without enabling any fields (if validation exists)
		await adminConfigPage.saveConfiguration();

		// Check for validation messages
		const validationMessage = await page.locator('.field-error, .validation-error').first();
		if (await validationMessage.isVisible()) {
			expect(await validationMessage.textContent()).toContain('required');
		}

		// Enable fields and retry
		await adminConfigPage.enableAllExtraUserFields();
		await adminConfigPage.saveConfiguration();

		// Verify successful save
		await adminConfigPage.checkSuccessMessage();
	});
});
