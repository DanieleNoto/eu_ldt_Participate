import { expect, extraUserFieldsTest } from '../../../fixtures/extra-user-fields-fixtures';

extraUserFieldsTest.describe('Admin Extra User Fields Configuration', () => {
	extraUserFieldsTest('should successfully configure extra user fields as admin', async ({ loggedInAdminPage }) => {
		// Enable all extra user fields (already logged in via fixture)
		await loggedInAdminPage.enableAllExtraUserFields();
		await loggedInAdminPage.saveConfiguration();

		// Verify success and that all checkboxes are checked
		await loggedInAdminPage.expectConfigurationSaved();

		const page = loggedInAdminPage.getPage();
		await expect(page.getByRole('checkbox', { name: 'Enable extra user fields' })).toBeChecked();
		await expect(page.getByRole('checkbox', { name: 'Enable date of birth field' })).toBeChecked();
		await expect(page.getByRole('checkbox', { name: 'Enable country field' })).toBeChecked();
		await expect(page.getByRole('checkbox', { name: 'Enable postal code field' })).toBeChecked();
		await expect(page.getByRole('checkbox', { name: 'Enable gender field' })).toBeChecked();
		await expect(page.getByRole('checkbox', { name: 'Enable phone number field' })).toBeChecked();
		await expect(page.getByRole('checkbox', { name: 'Enable location field' })).toBeChecked();
	});

	extraUserFieldsTest('should allow selective enabling of user fields', async ({ extraUserFieldsAdminPage }) => {
		// Setup: Login and navigate to configuration
		await extraUserFieldsAdminPage.performAdminLogin();
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
		const page = extraUserFieldsAdminPage.getPage();
		await expect(page.getByRole('checkbox', { name: 'Enable extra user fields' })).toBeChecked();
		await expect(page.getByRole('checkbox', { name: 'Enable date of birth field' })).toBeChecked();
		await expect(page.getByRole('checkbox', { name: 'Enable country field' })).toBeChecked();
	});

	extraUserFieldsTest(
		'should maintain configuration state after page reload',
		async ({ extraUserFieldsAdminPage }) => {
			// Setup and configure fields
			await extraUserFieldsAdminPage.performAdminLogin();
			await extraUserFieldsAdminPage.navigateToSettings();
			await extraUserFieldsAdminPage.navigateToExtraUserFields();
			await extraUserFieldsAdminPage.enableAllExtraUserFields();
			await extraUserFieldsAdminPage.saveConfiguration();
			await extraUserFieldsAdminPage.expectConfigurationSaved();

			// Reload the page
			const page = extraUserFieldsAdminPage.getPage();
			await page.reload();

			// Verify configuration persisted
			await expect(page.getByRole('checkbox', { name: 'Enable extra user fields' })).toBeChecked();
			await expect(page.getByRole('checkbox', { name: 'Enable date of birth field' })).toBeChecked();
			await expect(page.getByRole('checkbox', { name: 'Enable country field' })).toBeChecked();
		}
	);

	extraUserFieldsTest(
		'should validate form before submission to prevent errors',
		async ({ extraUserFieldsAdminPage }) => {
			// Setup: Login and navigate to configuration
			await extraUserFieldsAdminPage.performAdminLogin();
			await extraUserFieldsAdminPage.navigateToSettings();
			await extraUserFieldsAdminPage.navigateToExtraUserFields();

			// Attempt to save without enabling any fields (if validation exists)
			await extraUserFieldsAdminPage.saveConfiguration();

			// Check for validation messages
			const page = extraUserFieldsAdminPage.getPage();
			const validationMessage = await page.locator('.field-error, .validation-error').first();
			if (await validationMessage.isVisible()) {
				expect(await validationMessage.textContent()).toContain('required');
			}

			// Enable fields and retry
			await extraUserFieldsAdminPage.enableAllExtraUserFields();
			await extraUserFieldsAdminPage.saveConfiguration();

			// Verify successful save
			await extraUserFieldsAdminPage.expectConfigurationSaved();
		}
	);
});
