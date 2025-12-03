/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Simone Bianchelli
 * Gianfranco Cedro
 */

import { Page, expect, Locator } from '@playwright/test';
import { TEST_SELECTORS } from '@utils/constants';
import { AuthenticatedPage } from '../../../base/AuthenticatedPage';

export interface UserAccountFieldValues {
	name: string;
	email: string;
	dateOfBirth: string; // Format: yyyy-mm-dd
	gender: string;
	country: string;
	postalCode: string;
	phoneNumber?: string; // Optional - not required during registration
	location: string;
}

// Type definition for user fields data
export interface UserFieldsData {
	dateOfBirth?: string;
	gender?: string;
	country?: string;
	postalCode?: string;
	phoneNumber?: string;
	location?: string;
}
export class UserExtraFieldsPage extends AuthenticatedPage {
	private readonly personalUrlInput: Locator;
	private readonly personalUrlLabel: Locator;
	private readonly avatarFileInput: Locator;
	private readonly saveButton: Locator;
	private readonly errorFileContainer: Locator;
	private readonly removeErrorFileButton: Locator;

	constructor(page: Page) {
		super(page);

		this.personalUrlInput = page.locator('#user_personal_url');
		this.personalUrlLabel = page.locator('label[for="user_personal_url"]');
		this.avatarFileInput = page.locator('input[type="file"][name="user[avatar]"]');
		this.saveButton = page.locator('button[data-dropzone-save]');
		this.errorFileContainer = page.locator('div[data-template="error"]');
		this.removeErrorFileButton = this.errorFileContainer.getByRole('button', { name: 'Remove' });
	}

	// Public getter for page access in tests
	getPage(): Page {
		return this.page;
	}

	// Extra user fields modification
	async fillDateOfBirth(date: string) {
		await this.page.locator('#user_date_of_birth_date').click();
		await this.page.locator('#user_date_of_birth_date').fill(date);
	}

	async selectGender(gender: string) {
		await this.page.locator('#user_gender').selectOption(gender);
	}

	async selectCountry(countryCode: string) {
		await this.page.locator('#user_country').selectOption(countryCode);
	}

	async fillPostalCode(postalCode: string) {
		await this.page.locator('#user_postal_code').click();
		await this.page.locator('#user_postal_code').fill(postalCode);
	}

	async fillPhoneNumber(phoneNumber: string) {
		await this.page.locator('#user_phone_number').click();
		await this.page.locator('#user_phone_number').fill(phoneNumber);
	}

	async fillLocation(location: string) {
		await this.page.locator('#user_location').click();
		await this.page.locator('#user_location').fill(location);
	}

	async updateAccount() {
		await this.page.locator(TEST_SELECTORS.USER_ACCOUNT.UPDATE_ACCOUNT_BUTTON).click();
	}

	// Complete modification workflow
	async modifyUserFields(userData?: UserFieldsData) {
		const defaultData: UserFieldsData = {
			dateOfBirth: '10/04/1996',
			gender: 'female',
			country: 'IT',
			postalCode: '00144',
			phoneNumber: '3258023921',
			location: 'Rome'
		};

		const data = userData || defaultData;

		if (data.dateOfBirth) await this.fillDateOfBirth(data.dateOfBirth);
		if (data.gender) await this.selectGender(data.gender);
		if (data.country) await this.selectCountry(data.country);
		if (data.postalCode) await this.fillPostalCode(data.postalCode);
		if (data.phoneNumber) await this.fillPhoneNumber(data.phoneNumber);
		if (data.location) await this.fillLocation(data.location);

		await this.updateAccount();
	}

	// Validation methods
	async expectUpdateSuccess() {
		await expect(this.page.getByText('Account successfully updated')).toBeVisible();
	}

	async expectUpdateError() {
		await expect(await this.page.locator('span.form-error').count()).toBeGreaterThan(0);
	}

	async getFieldValue(fieldName: string): Promise<string | null> {
		const field = this.page.getByRole('textbox', { name: fieldName });
		return await field.inputValue();
	}

	async getSelectValue(fieldName: string): Promise<string | null> {
		const field = this.page.getByLabel(fieldName);
		return await field.inputValue();
	}

	// Field validation
	async expectFieldRequired(fieldName: string) {
		const field = this.page.getByRole('textbox', { name: fieldName });
		await expect(field).toHaveAttribute('required');
	}

	async expectFieldError(fieldName: string) {
		const fieldContainer = this.page.locator(`[data-field="${fieldName}"]`);
		await expect(fieldContainer.locator('.form-error')).toBeVisible();
	}

	// Assertion method for verifying all field values
	async expectAllFieldValues(expectedData: UserAccountFieldValues): Promise<void> {
		// Verify basic fields
		await expect(this.page.locator('#user_name')).toHaveValue(expectedData.name);
		await expect(this.page.locator('#user_email')).toHaveValue(expectedData.email);

		// Verify extra user fields
		await expect(this.page.locator('#user_date_of_birth')).toHaveValue(expectedData.dateOfBirth);
		await expect(this.page.locator('#user_gender')).toHaveValue(expectedData.gender);
		await expect(this.page.locator('#user_country')).toHaveValue(expectedData.country);
		await expect(this.page.locator('#user_postal_code')).toHaveValue(expectedData.postalCode);
		if (expectedData.phoneNumber) {
			await expect(this.page.locator('#user_phone_number')).toHaveValue(expectedData.phoneNumber);
		}
		await expect(this.page.locator('#user_location')).toHaveValue(expectedData.location);
	}

	/**
	 * Fills the Personal URL field
	 * @param url The URL to enter
	 */
	async fillPersonalUrl(url: string): Promise<void> {
		await this.personalUrlInput.click();
		await this.personalUrlInput.fill(url);
		// Trigger validation by removing focus from the field
		await this.personalUrlInput.blur();
	}

	/**
	 * Verifies that a field is marked as invalid (real-time validation)
	 * @param fieldId The ID of the input field
	 */
	async expectFieldInvalid(fieldId: string): Promise<void> {
		const input = this.page.locator(`#${fieldId}`);
		const label = this.page.locator(`label[for="${fieldId}"]`);

		// Check if the input field is marked as invalid (red border)
		await expect(input).toHaveClass(/is-invalid-input/);
		// Check if the label has the error class
		await expect(label).toHaveClass(/is-invalid-label/);
	}

	/**
	 * Verifies that a field is marked as valid (real-time validation)
	 * @param fieldId The ID of the input field
	 */
	async expectFieldValid(fieldId: string): Promise<void> {
		const input = this.page.locator(`#${fieldId}`);
		const label = this.page.locator(`label[for="${fieldId}"]`);

		// Check if the input field does not have the invalid class
		await expect(input).not.toHaveClass(/is-invalid-input/);
		// Check if the label does not have the error class
		await expect(label).not.toHaveClass(/is-invalid-label/);
	}

	/**
	 * Verifies that the Personal URL field is marked as invalid
	 */
	async expectPersonalUrlInvalid(): Promise<void> {
		await this.expectFieldInvalid('user_personal_url');
	}

	/**
	 * Verifies that the Personal URL field is marked as valid
	 */
	async expectPersonalUrlValid(): Promise<void> {
		await this.expectFieldValid('user_personal_url');
	}

	/**
	 * Clicks the "Add image" button to open the upload modal
	 */
	async clickAddImage(): Promise<void> {
		const addImageButton = this.page.getByRole('button', { name: 'Add image' });
		await addImageButton.click();
	}

	/**
	 * Uploads a file for profile picture
	 * @param filePath Path to the file to upload
	 */
	async uploadProfilePicture(filePath: string): Promise<void> {
		await this.avatarFileInput.setInputFiles(filePath);
	}

	/**
	 * Verifies that the validation error message is visible
	 */
	async expectProfilePictureValidationError(): Promise<void> {
		const errorMessage = this.page.getByText(/Validation error!/);
		await expect(errorMessage).toBeVisible();
	}

	/**
	 * Clicks the "Remove" button to delete the uploaded file with error
	 */
	async clickRemoveInvalidFile(): Promise<void> {
		await expect(this.removeErrorFileButton).toBeVisible();
		await this.removeErrorFileButton.click();

		// Wait for the error template to be removed from DOM
		await expect(this.errorFileContainer).not.toBeVisible();
	}

	/**
	 * Clicks the "Save" button in the profile picture upload modal
	 */
	async clickSaveProfilePicture(): Promise<void> {
		await this.saveButton.waitFor({ state: 'visible' });
		// Use evaluate to click directly via JavaScript
		await this.saveButton.evaluate((button: HTMLElement) => button.click());
	}

	/**
	 * Verifies that a profile picture has been successfully uploaded
	 */
	async expectProfilePictureUploaded(): Promise<void> {
		await this.page.waitForLoadState('networkidle');

		// Verify the modal is closed
		await expect(this.saveButton).not.toBeVisible();

		// Verify the upload button changed from "Add image" to "Replace"
		const uploadButton = this.page.locator('button#user_avatar_button');
		await expect(uploadButton).toHaveText('Replace');

		// Verify the upload container is visible
		const uploadContainer = this.page.locator('.upload-modal__files-container.upload-container-for-avatar');
		await expect(uploadContainer).toBeVisible();

		console.log('Profile picture uploaded successfully');
	}
}
