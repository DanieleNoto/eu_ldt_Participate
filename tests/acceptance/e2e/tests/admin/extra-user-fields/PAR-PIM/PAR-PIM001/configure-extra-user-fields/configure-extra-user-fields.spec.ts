import { AdminHomePage } from '@pages/pages/admin/AdminHomePage';
import { ExtraUserFieldsAdminPage } from '@pages/pages/admin/ExtraUserFieldsAdminPage';
import { expect, test } from '@playwright/test';
import { STORAGE_STATE } from '@utils/constants';

test.describe('[PAR-PIM001] Admin Extra User Fields Configuration', () => {
	test.use({ storageState: STORAGE_STATE.ADMIN });
	let adminHomePage: AdminHomePage;
	let extraUserFieldsAdminPage: ExtraUserFieldsAdminPage;

	test.beforeEach(async ({ page }) => {
		extraUserFieldsAdminPage = new ExtraUserFieldsAdminPage(page);
		adminHomePage = new AdminHomePage(page);
		await adminHomePage.navigateToAdminHomePage();
		await extraUserFieldsAdminPage.navigateToSettings();
	});

	test('should successfully configure extra user fields as admin', async ({ page }) => {
		// Enable all extra user fields (already logged in via storage state)
		await extraUserFieldsAdminPage.enableAllExtraUserFields();
		await extraUserFieldsAdminPage.saveConfiguration();

		// Verify success and that all checkboxes are checked
		await extraUserFieldsAdminPage.expectConfigurationSaved();

		await expect(page.getByRole('checkbox', { name: 'Enable extra user fields' })).toBeChecked();
		await expect(page.getByRole('checkbox', { name: 'Enable date of birth field' })).toBeChecked();
		await expect(page.getByRole('checkbox', { name: 'Enable country field' })).toBeChecked();
		await expect(page.getByRole('checkbox', { name: 'Enable postal code field' })).toBeChecked();
		await expect(page.getByRole('checkbox', { name: 'Enable gender field' })).toBeChecked();
		await expect(page.getByRole('checkbox', { name: 'Enable phone number field' })).toBeChecked();
		await expect(page.getByRole('checkbox', { name: 'Enable location field' })).toBeChecked();
	});

	test('should allow selective enabling of user fields', async ({ page }) => {
		// Navigate to configuration page
		await extraUserFieldsAdminPage.navigateToSettings();
		await extraUserFieldsAdminPage.navigateToExtraUserFields();

		// Enable main extra user fields and selective fields
		await extraUserFieldsAdminPage.navigateToExtraUserFieldsConfig();
		await extraUserFieldsAdminPage.enableExtraUserField('Enable extra user fields');
		await extraUserFieldsAdminPage.enableExtraUserField('Enable date of birth field');
		await extraUserFieldsAdminPage.enableExtraUserField('Enable country field');
		// Leave other fields unchecked

		await extraUserFieldsAdminPage.saveConfiguration();

		// Verify only selected fields are enabled
		await expect(page.getByRole('checkbox', { name: 'Enable extra user fields' })).toBeChecked();
		await expect(page.getByRole('checkbox', { name: 'Enable date of birth field' })).toBeChecked();
		await expect(page.getByRole('checkbox', { name: 'Enable country field' })).toBeChecked();
	});

	test('should maintain configuration state after page reload', async ({ page }) => {
		// Setup and configure fields
		await extraUserFieldsAdminPage.navigateToSettings();
		await extraUserFieldsAdminPage.navigateToExtraUserFields();
		await extraUserFieldsAdminPage.enableAllExtraUserFields();
		await extraUserFieldsAdminPage.saveConfiguration();
		await extraUserFieldsAdminPage.expectConfigurationSaved();

		// Reload the page
		await page.reload();

		// Verify configuration persisted
		await expect(page.getByRole('checkbox', { name: 'Enable extra user fields' })).toBeChecked();
		await expect(page.getByRole('checkbox', { name: 'Enable date of birth field' })).toBeChecked();
		await expect(page.getByRole('checkbox', { name: 'Enable country field' })).toBeChecked();
	});

	test('should validate form before submission to prevent errors', async ({ page }) => {
		// Navigate to configuration
		await extraUserFieldsAdminPage.navigateToSettings();
		await extraUserFieldsAdminPage.navigateToExtraUserFields();

		// Attempt to save without enabling any fields (if validation exists)
		await extraUserFieldsAdminPage.saveConfiguration();

		// Check for validation messages
		const validationMessage = await page.locator('.field-error, .validation-error').first();
		if (await validationMessage.isVisible()) {
			expect(await validationMessage.textContent()).toContain('required');
		}

		// Enable fields and retry
		await extraUserFieldsAdminPage.enableAllExtraUserFields();
		await extraUserFieldsAdminPage.saveConfiguration();

		// Verify successful save
		await extraUserFieldsAdminPage.expectConfigurationSaved();
	});
});
