/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Gianfranco Cedro
 * Antonio Abramo Carotenuto
 * Simone Bianchelli
 */

import { Locator, Page, expect } from '@playwright/test';
import { HeaderComponent } from '../../../components/common/HeaderComponent';
import { VerticalTabsComponent } from '../../../components/common/VerticalTabsComponent';
import { NotificationSettingsPage } from '../NotificationSettingsPage';

export class AccountPage {
	private page: Page;
	private header: HeaderComponent;
	private verticalTabs: VerticalTabsComponent;

	// Form field locators
	private nameField: Locator;
	private nicknameField: Locator;
	private emailField: Locator;
	private dateOfBirthField: Locator;
	private calendarButton: Locator;
	private genderSelect: Locator;
	private countrySelect: Locator;
	private postalCodeField: Locator;
	private phoneField: Locator;
	private locationField: Locator;
	private personalUrlField: Locator;
	private aboutTextarea: Locator;
	private localeSelect: Locator;
	private updateButton: Locator;

	// Avatar upload locators
	private avatarUploadButton: Locator;
	private avatarFileInput: Locator;
	private avatarImage: Locator;
	private removeAvatarButton: Locator;

	// Password change accordion locators
	private passwordAccordionHeader: Locator;
	private currentPasswordField: Locator;
	private newPasswordField: Locator;
	private confirmPasswordField: Locator;
	private changePasswordButton: Locator;

	// Notification locators
	private successNotification: Locator;
	private errorNotification: Locator;

	constructor(page: Page) {
		this.page = page;
		this.header = new HeaderComponent(page);
		this.verticalTabs = new VerticalTabsComponent(page);

		// Initialize form field locators
		this.nameField = page.locator('input[name="user[name]"]');
		this.nicknameField = page.locator('input[name="user[nickname]"]');
		this.emailField = page.locator('input[name="user[email]"]');
		this.dateOfBirthField = page.locator('input[id="user_date_of_birth_date"]');
		this.calendarButton = page.locator('button.datepicker__calendar-button');
		this.genderSelect = page.locator('select[id="user_gender"]');
		this.countrySelect = page.locator('select[id="user_country"]');
		this.postalCodeField = page.locator('input[id="user_postal_code"]');
		this.phoneField = page.locator('input[id="user_phone_number"]');
		this.locationField = page.locator('input[id="user_location"]');
		this.personalUrlField = page.locator('input[name="user[personal_url]"]');
		this.aboutTextarea = page.locator('textarea[name="user[about]"]');
		this.localeSelect = page.locator('select[name="user[locale]"]');
		this.updateButton = page.getByRole('button', { name: 'Update account' });

		// Initialize avatar upload locators
		this.avatarUploadButton = page.locator('label[for="user_avatar"]');
		this.avatarFileInput = page.locator('input[type="file"][name="user[avatar]"]');
		this.avatarImage = page.locator('.avatar img');
		this.removeAvatarButton = page.locator('input[name="user[remove_avatar]"]');

		// Initialize password change accordion locators
		this.passwordAccordionHeader = page.locator('[data-accordion-target="password-change"]');
		this.currentPasswordField = page.locator('input[name="user[current_password]"]');
		this.newPasswordField = page.locator('input[name="user[password]"]');
		this.confirmPasswordField = page.locator('input[name="user[password_confirmation]"]');
		this.changePasswordButton = page.locator('input[type="submit"][value="Change password"]');

		// Initialize notification locators
		this.successNotification = page.locator('.flash.success, .alert.success');
		this.errorNotification = page.locator('.flash.error, .alert.error');
	}

	/**
	 * Navigate to the account page via the header
	 */
	async navigateToAccountPage(): Promise<void> {
		await this.header.navigateToMyAccount();
		await this.waitForPageLoad();
	}

	/**
	 * Wait for the account page to fully load
	 */
	async waitForPageLoad(): Promise<void> {
		await expect(this.page).toHaveURL(/\/account(\?.*)?$/);
		await expect(this.nameField).toBeVisible();
		await expect(this.verticalTabs.isTabsContainerVisible()).resolves.toBe(true);
	}

	/**
	 * Navigate to a specific tab in the account page
	 */
	async navigateToTab(tabName: string): Promise<void> {
		switch (tabName.toLowerCase()) {
			case 'account':
				await this.verticalTabs.navigateToAccount();
				break;
			case 'notification settings':
			case 'notifications':
				await this.verticalTabs.navigateToNotificationSettings();
				break;
			case 'my interests':
			case 'interests':
				await this.verticalTabs.navigateToMyInterests();
				break;
			case 'my data':
			case 'data':
				await this.verticalTabs.navigateToMyData();
				break;
			case 'delete account':
				await this.verticalTabs.navigateToDeleteAccount();
				break;
			default:
				throw new Error(`Unknown tab: ${tabName}`);
		}
	}

	/**
	 * Fill the basic account information form
	 */
	async fillBasicAccountForm(accountData: {
		name?: string;
		nickname?: string;
		email?: string;
		dateOfBirth?: string;
		gender?: string;
		personalUrl?: string;
		about?: string;
		locale?: string;
	}): Promise<void> {
		if (accountData.name !== undefined) {
			await this.nameField.clear();
			await this.nameField.fill(accountData.name);
		}

		if (accountData.nickname !== undefined) {
			await this.nicknameField.clear();
			await this.nicknameField.fill(accountData.nickname);
		}

		if (accountData.email !== undefined) {
			await this.emailField.clear();
			await this.emailField.fill(accountData.email);
		}

		if (accountData.dateOfBirth) {
			const [day, month, year] = accountData.dateOfBirth.split('/');
			const dateFormatted = `${year}-${month}-${day}`;

			// Set value directly on the hidden input.
			await this.page.evaluate(
				({ value }: { value: string }) => {
					const hidden = document.querySelector('#user_date_of_birth') as HTMLInputElement;
					if (hidden) {
						hidden.value = value;
						hidden.dispatchEvent(new Event('change', { bubbles: true }));
						hidden.dispatchEvent(new Event('input', { bubbles: true }));
					}
					const display = document.querySelector('#user_date_of_birth_date') as HTMLInputElement;
					if (display) {
						const [y, m, d] = value.split('-');
						display.value = `${d}/${m}/${y}`;
						display.dispatchEvent(new Event('change', { bubbles: true }));
					}
				},
				{ value: dateFormatted }
			);

			// Verify both inputs were correctly written
			await expect(this.page.locator('#user_date_of_birth')).toHaveValue(dateFormatted);
			const [y, m, d] = dateFormatted.split('-');
			await expect(this.page.locator('#user_date_of_birth_date')).toHaveValue(`${d}/${m}/${y}`);
		}

		if (accountData.gender !== undefined) {
			await this.genderSelect.selectOption(accountData.gender);
		}

		if (accountData.personalUrl !== undefined) {
			await this.personalUrlField.clear();
			await this.personalUrlField.fill(accountData.personalUrl);
		}

		if (accountData.about !== undefined) {
			await this.aboutTextarea.clear();
			await this.aboutTextarea.fill(accountData.about);
		}

		if (accountData.locale !== undefined) {
			await this.localeSelect.selectOption(accountData.locale);
		}
	}

	/**
	 * Fill the extended account information form
	 */
	async fillExtendedAccountForm(extendedData: {
		country?: string;
		postalCode?: string;
		phoneNumber?: string;
		location?: string;
	}): Promise<void> {
		if (extendedData.country !== undefined) {
			await this.countrySelect.selectOption(extendedData.country);
		}

		if (extendedData.postalCode !== undefined) {
			await this.postalCodeField.clear();
			await this.postalCodeField.fill(extendedData.postalCode);
		}

		if (extendedData.phoneNumber !== undefined) {
			await this.phoneField.clear();
			await this.phoneField.fill(extendedData.phoneNumber);
		}

		if (extendedData.location !== undefined) {
			await this.locationField.clear();
			await this.locationField.fill(extendedData.location);
		}
	}

	/**
	 * Upload an avatar image
	 */
	async uploadAvatar(filePath: string): Promise<void> {
		await this.avatarFileInput.setInputFiles(filePath);
		// Wait for the avatar to be processed and displayed
		await expect(this.avatarImage).toBeVisible();
	}

	/**
	 * Remove the current avatar
	 */
	async removeAvatar(): Promise<void> {
		await this.removeAvatarButton.check();
	}

	/**
	 * Expand the password change accordion
	 */
	async expandPasswordChangeAccordion(): Promise<void> {
		const isExpanded = await this.passwordAccordionHeader.getAttribute('aria-expanded');
		if (isExpanded !== 'true') {
			await this.passwordAccordionHeader.click();
			await expect(this.currentPasswordField).toBeVisible();
		}
	}

	/**
	 * Change the user's password
	 */
	async changePassword(currentPassword: string, newPassword: string): Promise<void> {
		await this.expandPasswordChangeAccordion();
		await this.currentPasswordField.fill(currentPassword);
		await this.newPasswordField.fill(newPassword);
		await this.confirmPasswordField.fill(newPassword);
		await this.changePasswordButton.click();
	}

	/**
	 * Submit the account update form
	 */
	async submitAccountUpdate(): Promise<void> {
		await this.updateButton.click();
	}

	/**
	 * Get the current value of a form field
	 */
	async getFieldValue(fieldName: string): Promise<string> {
		const fieldMap: { [key: string]: Locator } = {
			name: this.nameField,
			nickname: this.nicknameField,
			email: this.emailField,
			dateOfBirth: this.dateOfBirthField,
			postalCode: this.postalCodeField,
			phoneNumber: this.phoneField,
			location: this.locationField,
			personalUrl: this.personalUrlField,
			about: this.aboutTextarea
		};

		const field = fieldMap[fieldName];
		if (!field) {
			throw new Error(`Field '${fieldName}' not found`);
		}

		return await field.inputValue();
	}

	/**
	 * Get the current selected value of a select field
	 */
	async getSelectValue(selectName: string): Promise<string> {
		const selectMap: { [key: string]: Locator } = {
			gender: this.genderSelect,
			country: this.countrySelect,
			locale: this.localeSelect
		};

		const select = selectMap[selectName];
		if (!select) {
			throw new Error(`Select '${selectName}' not found`);
		}

		return await select.inputValue();
	}

	/**
	 * Check if a success notification is visible
	 */
	async isSuccessNotificationVisible(): Promise<boolean> {
		return await this.successNotification.isVisible();
	}

	/**
	 * Check if an error notification is visible
	 */
	async isErrorNotificationVisible(): Promise<boolean> {
		return await this.errorNotification.isVisible();
	}

	/**
	 * Get the text content of a notification
	 */
	async getNotificationText(): Promise<string> {
		if (await this.successNotification.isVisible()) {
			return (await this.successNotification.textContent()) || '';
		}
		if (await this.errorNotification.isVisible()) {
			return (await this.errorNotification.textContent()) || '';
		}
		return '';
	}

	/**
	 * Verify that all required form fields are present and visible
	 */
	async verifyFormFieldsVisibility() {
		await expect(this.nameField).toBeVisible();
		await expect(this.nicknameField).toBeVisible();
		await expect(this.emailField).toBeVisible();
		await expect(this.dateOfBirthField).toBeVisible();
		await expect(this.genderSelect).toBeVisible();
		await expect(this.countrySelect).toBeVisible();
		await expect(this.postalCodeField).toBeVisible();
		await expect(this.phoneField).toBeVisible();
		await expect(this.locationField).toBeVisible();
		await expect(this.personalUrlField).toBeVisible();
		await expect(this.aboutTextarea).toBeVisible();
		await expect(this.localeSelect).toBeVisible();
	}

	/**
	 * Verify that the avatar upload section is present
	 */
	async verifyAvatarSectionPresent(): Promise<void> {
		await expect(this.avatarUploadButton).toBeVisible();
	}

	/**
	 * Verify that the password change accordion is present
	 */
	async verifyPasswordChangeAccordionPresent(): Promise<void> {
		await expect(this.passwordAccordionHeader).toBeVisible();
	}

	/**
	 * Wait for a form submission to complete
	 */
	async waitForFormSubmission(): Promise<void> {
		// Wait for either success or error notification
		await Promise.race([
			this.successNotification.waitFor({ state: 'visible' }),
			this.errorNotification.waitFor({ state: 'visible' })
		]);
	}

	/**
	 * Check if the page is in a valid state (not closed)
	 */
	async isPageValid(): Promise<boolean> {
		return !this.page.isClosed();
	}

	/**
	 * Get the header component for additional navigation
	 */
	getHeader(): HeaderComponent {
		return this.header;
	}

	/**
	 * Get the vertical tabs component for tab navigation
	 */
	getVerticalTabs(): VerticalTabsComponent {
		return this.verticalTabs;
	}

	/**
	 * Get the notification settings page instance
	 */
	getNotificationSettingsPage(): NotificationSettingsPage {
		return new NotificationSettingsPage(this.page);
	}

	/**
	 * Navigate to notification settings page and return the page instance
	 */
	async navigateToNotificationSettings(): Promise<NotificationSettingsPage> {
		await this.verticalTabs.navigateToNotificationSettings();
		const notificationSettingsPage = new NotificationSettingsPage(this.page);
		await notificationSettingsPage.waitForPageLoad();
		return notificationSettingsPage;
	}

	/**
	 * Verifies that updated fields have new values and are different from original values
	 */
	async verifyFieldsUpdated(
		originalValues: {
			name?: string;
			nickname?: string;
			email?: string;
			dateOfBirth?: string;
			gender?: string;
			country?: string;
			postalCode?: string;
			phoneNumber?: string;
			location?: string;
			personalUrl?: string;
			about?: string;
			locale?: string;
		},
		updatedValues: {
			name?: string;
			nickname?: string;
			dateOfBirth?: string;
			gender?: string;
			country?: string;
			postalCode?: string;
			phoneNumber?: string;
			location?: string;
			personalUrl?: string;
			about?: string;
		}
	): Promise<void> {
		const fieldMap: Record<string, Locator> = {
			name: this.nameField,
			nickname: this.nicknameField,
			dateOfBirth: this.dateOfBirthField,
			gender: this.genderSelect,
			country: this.countrySelect,
			postalCode: this.postalCodeField,
			phoneNumber: this.phoneField,
			location: this.locationField,
			personalUrl: this.personalUrlField,
			about: this.aboutTextarea
		};

		for (const [field, newValue] of Object.entries(updatedValues)) {
			const locator = fieldMap[field];
			const fieldKey = field as keyof typeof originalValues;
			const originalValue = originalValues[fieldKey];

			// Verify field has the new value
			await expect(locator).toHaveValue(newValue);

			// Verify it's different from original (if they were different)
			if (originalValue !== newValue) {
				await expect(locator).not.toHaveValue(originalValue);
			}
		}
	}

	/**
	 * Wait for the account page load state
	 */
	async waitForLoadState() {
		await this.page.waitForLoadState('load');
	}
}
