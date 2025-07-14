import { Page, expect } from '@playwright/test';
import { TEST_SELECTORS } from '@utils/constants';
import { AuthenticatedPage } from '../../base/AuthenticatedPage';

export class UserExtraFieldsPage extends AuthenticatedPage {
	constructor(page: Page) {
		super(page);
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
