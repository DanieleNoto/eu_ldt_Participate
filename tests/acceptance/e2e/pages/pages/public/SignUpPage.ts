/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Simone Bianchelli
 */

import { Page, Locator, expect } from '@playwright/test';

export interface SignUpFormData {
	name: string;
	email: string;
	password: string;
}

export interface ExtraUserFieldsData {
	dateOfBirth?: string;
	gender?: string;
	country?: string;
	postalCode?: string;
	phoneNumber?: string;
	location?: string;
}

export class SignUpPage {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	// Basic registration fields
	get nameInput(): Locator {
		return this.page.getByRole('textbox', { name: 'Your name Required field' });
	}

	get emailInput(): Locator {
		return this.page.getByRole('textbox', { name: 'Your email Required field' });
	}

	get passwordInput(): Locator {
		return this.page.getByRole('textbox', { name: 'Password Required field' });
	}

	// Extra user fields
	get dateOfBirthInput(): Locator {
		return this.page.locator('#registration_user_date_of_birth');
	}

	get genderSelect(): Locator {
		return this.page.locator('select#registration_user_gender');
	}

	get countrySelect(): Locator {
		return this.page.locator('select#registration_user_country');
	}

	get postalCodeInput(): Locator {
		return this.page.getByRole('textbox', { name: 'Postal code' });
	}

	get phoneNumberInput(): Locator {
		return this.page.getByRole('textbox', { name: 'Phone number' });
	}

	get locationInput(): Locator {
		return this.page.getByRole('textbox', { name: 'Location' });
	}

	// Checkboxes
	get termsCheckbox(): Locator {
		return this.page.getByRole('checkbox', { name: 'By signing up you agree to' });
	}

	get newsletterCheckbox(): Locator {
		return this.page.getByRole('checkbox', { name: 'Receive an occasional' });
	}

	// Submit button
	get createAccountButton(): Locator {
		return this.page.getByRole('button', { name: 'Create an account' });
	}

	// Actions - Basic fields
	async fillName(name: string) {
		await this.nameInput.click();
		await this.nameInput.fill(name);
	}

	async fillEmail(email: string) {
		await this.emailInput.click();
		await this.emailInput.fill(email);
	}

	async fillPassword(password: string) {
		await this.passwordInput.click();
		await this.passwordInput.fill(password);
	}

	// Actions - Extra fields
	async fillDateOfBirth(dateOfBirth: string) {
		// Parse date from dd/mm/yyyy format
		const [day, month, year] = dateOfBirth.split('/');

		// Convert to yyyy-mm-dd format for the hidden date input
		const dateFormatted = `${year}-${month}-${day}`;

		// Set value on the hidden input using JavaScript (since it's display:none)
		await this.page.evaluate(
			({ selector, value }) => {
				const input = document.querySelector(selector) as HTMLInputElement;
				if (input) {
					input.value = value;
					// Trigger change event to notify the form
					input.dispatchEvent(new Event('change', { bubbles: true }));
					input.dispatchEvent(new Event('input', { bubbles: true }));
				}
			},
			{
				selector: '#registration_user_date_of_birth',
				value: dateFormatted
			}
		);
	}

	async selectGender(gender: string) {
		await this.genderSelect.selectOption(gender);
	}

	async selectCountry(country: string) {
		await this.countrySelect.selectOption(country);
	}

	async fillPostalCode(postalCode: string) {
		await this.postalCodeInput.click();
		await this.postalCodeInput.fill(postalCode);
	}

	async fillPhoneNumber(phoneNumber: string) {
		await this.phoneNumberInput.click();
		await this.phoneNumberInput.fill(phoneNumber);
	}

	async fillLocation(location: string) {
		await this.locationInput.click();
		await this.locationInput.fill(location);
	}

	// Actions - Checkboxes
	async checkTermsAndConditions() {
		await this.termsCheckbox.check();
	}

	async checkNewsletterSubscription() {
		await this.newsletterCheckbox.check();
	}

	// Actions - Submit
	async submitRegistration() {
		await this.createAccountButton.click();
	}

	// Assertions
	async expectAllFieldsToBeVisible() {
		// Verify basic registration fields are visible
		await expect(this.nameInput).toBeVisible();
		await expect(this.emailInput).toBeVisible();
		await expect(this.passwordInput).toBeVisible();

		// Verify extra user fields are visible
		await expect(this.dateOfBirthInput).toBeVisible();
		await expect(this.genderSelect).toBeVisible();
		await expect(this.countrySelect).toBeVisible();
		await expect(this.postalCodeInput).toBeVisible();
		await expect(this.locationInput).toBeVisible();

		// Verify checkboxes are visible
		await expect(this.termsCheckbox).toBeVisible();
		await expect(this.newsletterCheckbox).toBeVisible();

		// Verify submit button is visible
		await expect(this.createAccountButton).toBeVisible();
	}

	/**
	 * Verifies that validation error message is displayed for a specific field
	 * @param fieldId - The ID of the field
	 */
	async expectFieldValidationError(fieldId: string): Promise<void> {
		const errorMessage = 'There is an error in this field.';

		// Primary strategy: use aria-describedby on the input (works for visible inputs)
		const input = this.page.locator(`#${fieldId}`);
		const ariaDescribedBy = await input.getAttribute('aria-describedby').catch(() => null);

		if (ariaDescribedBy) {
			const errorEl = this.page.locator(`#${ariaDescribedBy}`);
			await expect(errorEl).toContainText(errorMessage);
			await expect(errorEl).toBeVisible();
			return;
		}

		// Fallback: find any visible form-error span in the ancestor container
		// that wraps the field (works for hidden inputs like date_of_birth)
		const errorLocator = this.page
			.locator(
				`xpath=//span[contains(@class,"form-error") and contains(@class,"is-visible") ` +
					`and ancestor::*[descendant::*[@id="${fieldId}"]]]`
			)
			.first();

		await expect(errorLocator).toContainText(errorMessage);
		await expect(errorLocator).toBeVisible();
	}

	/**
	 * Verifies that "must be accepted" validation error is displayed for terms and conditions checkbox
	 */
	async expectTermsCheckboxValidationError(): Promise<void> {
		const errorMessage = 'must be accepted';

		const errorLocator = this.page.locator(
			'div.field_with_errors:has(label[for="registration_user_tos_agreement"]) ~ small.form-error.is-visible'
		);

		await expect(errorLocator).toContainText(errorMessage);
		await expect(errorLocator).toBeVisible();
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
	 * Verifies that the phone number field is marked as invalid
	 */
	async expectPhoneNumberInvalid(): Promise<void> {
		await this.expectFieldInvalid('registration_user_phone_number');
	}

	/**
	 * Verifies that the phone number field is marked as valid
	 */
	async expectPhoneNumberValid(): Promise<void> {
		await this.expectFieldValid('registration_user_phone_number');
	}

	/**
	 * Verifies we are on the signup page
	 */
	async expectToBeOnSignupPage(): Promise<void> {
		await expect(this.page).toHaveURL(/\/users\/sign_up/);
	}
}
