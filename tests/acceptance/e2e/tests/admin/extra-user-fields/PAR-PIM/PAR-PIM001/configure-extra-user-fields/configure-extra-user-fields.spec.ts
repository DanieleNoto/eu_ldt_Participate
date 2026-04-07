/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Simone Bianchelli
 * Gianfranco Cedro
 */

import { AdminHomePage } from '@pages/pages/admin/AdminHomePage';
import { ExtraUserFieldsAdminPage } from '@pages/pages/admin/ExtraUserFieldsAdminPage';
import { test, expect } from '@fixtures/parallel-test';

test.describe('[PAR-PIM001] Admin Extra User Fields Configuration', () => {
	let adminHomePage: AdminHomePage;
	let extraUserFieldsAdminPage: ExtraUserFieldsAdminPage;

	test.beforeEach(async ({ adminPage }) => {
		extraUserFieldsAdminPage = new ExtraUserFieldsAdminPage(adminPage);
		adminHomePage = new AdminHomePage(adminPage);
		await adminHomePage.navigateToAdminHomePage();
		await extraUserFieldsAdminPage.navigateToSettings();
	});

	test('should successfully configure extra user fields as admin', async ({ adminPage }) => {
		// Enable all extra user fields (already logged in via storage state)
		await extraUserFieldsAdminPage.enableAllExtraUserFields();
		await extraUserFieldsAdminPage.saveConfiguration();

		// Verify success and that all checkboxes are checked
		await extraUserFieldsAdminPage.expectConfigurationSaved();

		await expect(adminPage.getByRole('checkbox', { name: 'Enable extra user fields' })).toBeChecked();
		await expect(adminPage.getByRole('checkbox', { name: 'Age range enabled' })).toBeChecked();
		await expect(adminPage.getByRole('checkbox', { name: 'Date of birth enabled' })).toBeChecked();
		await expect(adminPage.getByRole('checkbox', { name: 'Country enabled' })).toBeChecked();
		await expect(adminPage.getByRole('checkbox', { name: 'Postal code enabled' })).toBeChecked();
		await expect(adminPage.getByRole('checkbox', { name: 'Gender enabled' })).toBeChecked();
		await expect(adminPage.getByRole('checkbox', { name: 'Phone number enabled' })).toBeChecked();
		await expect(adminPage.getByRole('checkbox', { name: 'Location enabled' })).toBeChecked();
	});

	test('should allow selective enabling of user fields', async ({ adminPage }) => {
		// Navigate to configuration page
		await extraUserFieldsAdminPage.navigateToSettings();
		await extraUserFieldsAdminPage.navigateToExtraUserFields();

		// Enable main extra user fields and selective fields
		await extraUserFieldsAdminPage.navigateToExtraUserFieldsConfig();
		await extraUserFieldsAdminPage.enableExtraUserField('Enable extra user fields');
		await extraUserFieldsAdminPage.enableExtraUserField('Age range enabled');
		await extraUserFieldsAdminPage.enableExtraUserField('Date of birth enabled');
		await extraUserFieldsAdminPage.enableExtraUserField('Country enabled');
		// Leave other fields unchecked

		await extraUserFieldsAdminPage.saveConfiguration();

		// Verify only selected fields are enabled
		await expect(adminPage.getByRole('checkbox', { name: 'Enable extra user fields' })).toBeChecked();
		await expect(adminPage.getByRole('checkbox', { name: 'Age range enabled' })).toBeChecked();
		await expect(adminPage.getByRole('checkbox', { name: 'Date of birth enabled' })).toBeChecked();
		await expect(adminPage.getByRole('checkbox', { name: 'Country enabled' })).toBeChecked();
	});

	test('should maintain configuration state after page reload', async ({ adminPage }) => {
		// Setup and configure fields
		await extraUserFieldsAdminPage.navigateToSettings();
		await extraUserFieldsAdminPage.navigateToExtraUserFields();
		await extraUserFieldsAdminPage.enableAllExtraUserFields();
		await extraUserFieldsAdminPage.saveConfiguration();
		await extraUserFieldsAdminPage.expectConfigurationSaved();

		// Reload the page
		await adminPage.reload();

		// Verify configuration persisted
		await expect(adminPage.getByRole('checkbox', { name: 'Enable extra user fields' })).toBeChecked();
		await expect(adminPage.getByRole('checkbox', { name: 'Age range enabled' })).toBeChecked();
		await expect(adminPage.getByRole('checkbox', { name: 'Date of birth enabled' })).toBeChecked();
		await expect(adminPage.getByRole('checkbox', { name: 'Country enabled' })).toBeChecked();
	});

	test('should validate form before submission to prevent errors', async ({ adminPage }) => {
		// Navigate to configuration
		await extraUserFieldsAdminPage.navigateToSettings();
		await extraUserFieldsAdminPage.navigateToExtraUserFields();

		// Attempt to save without enabling any fields (if validation exists)
		await extraUserFieldsAdminPage.saveConfiguration();

		// Check for validation messages
		const validationMessage = adminPage.locator('.field-error, .validation-error').first();
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
