/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Simone Bianchelli
 * Gianfranco Cedro
 */

import { Page, expect } from '@playwright/test';
import { BaseAdminPage } from './BaseAdminPage';

export class ExtraUserFieldsAdminPage extends BaseAdminPage {
	constructor(page: Page) {
		super(page);
	}

	// Public getter for page access in tests
	getPage(): Page {
		return this.page;
	}

	// Navigation specific to extra user fields
	async navigateToExtraUserFields() {
		await this.page.goto('/admin/organization/edit');
		await this.page.getByRole('link', { name: 'Manage extra user fields' }).click();
	}

	async navigateToExtraUserFieldsManagement() {
		await this.page.goto('/admin/extra_user_fields/extra_user_fields');
	}

	async navigateToExtraUserFieldsConfig() {
		await this.page.goto('/admin/extra_user_fields/');
	}

	// Extra user fields configuration
	async enableAllExtraUserFields() {
		await this.navigateToExtraUserFieldsConfig();
		await this.page.getByRole('checkbox', { name: 'Enable extra user fields' }).check();
		await this.page.getByRole('checkbox', { name: 'Enable date of birth field' }).check();
		await this.page.getByRole('checkbox', { name: 'Enable country field' }).check();
		await this.page.getByRole('checkbox', { name: 'Enable postal code field' }).check();
		await this.page.getByRole('checkbox', { name: 'Enable gender field' }).check();
		await this.page.getByRole('checkbox', { name: 'Enable phone number field' }).check();
		await this.page.getByRole('checkbox', { name: 'Enable location field' }).check();
	}

	async enableExtraUserField(fieldName: string) {
		await this.page.getByRole('checkbox', { name: fieldName }).check();
	}

	async disableExtraUserField(fieldName: string) {
		await this.page.getByRole('checkbox', { name: fieldName }).uncheck();
	}

	async saveConfiguration() {
		await this.page.getByRole('button', { name: 'Save configuration' }).click();
	}

	// Network error simulation for testing
	async simulateServerErrorOnSave() {
		await this.page.route('**/admin/extra_user_fields/extra_user_fields', route => {
			const method = route.request().method();
			const resourceType = route.request().resourceType();

			if (
				(method === 'POST' || method === 'PUT' || method === 'PATCH') &&
				(resourceType === 'xhr' || resourceType === 'fetch')
			) {
				route.fulfill({
					status: 500,
					contentType: 'application/json',
					body: JSON.stringify({ error: 'Internal Server Error' })
				});
			} else {
				route.continue();
			}
		});
	}

	async simulateNetworkErrorOnSave() {
		await this.page.route('**/admin/extra_user_fields/extra_user_fields', route => {
			const method = route.request().method();
			const resourceType = route.request().resourceType();

			if (
				(method === 'POST' || method === 'PUT' || method === 'PATCH') &&
				(resourceType === 'xhr' || resourceType === 'fetch')
			) {
				route.abort('failed');
			} else {
				route.continue();
			}
		});
	}

	async clearNetworkInterception() {
		await this.page.unroute('**/admin/extra_user_fields/extra_user_fields');
	}

	async retrySave() {
		await this.clearNetworkInterception();
		await this.saveConfiguration();
	}

	// Validation and success messages
	async checkSuccessMessage() {
		return await expect(this.page.getByText('Extra user fields correctly')).toBeVisible();
	}

	async expectConfigurationSaved() {
		await this.checkSuccessMessage();
	}

	// Complete workflow methods
	async setupExtraUserFields() {
		await this.performAdminLogin();
		await this.navigateToSettings();
		await this.navigateToExtraUserFields();
		await this.enableAllExtraUserFields();
		await this.saveConfiguration();
	}

	/**
	 * Sets the phone number validation regex
	 * @param regex The regex pattern to validate phone numbers
	 */
	async setPhoneNumberValidationRegex(regex: string): Promise<void> {
		const phoneValidationInput = this.page.getByRole('textbox', { name: 'Phone numbers validation' });
		await phoneValidationInput.click();
		await phoneValidationInput.fill(regex);
	}
}
