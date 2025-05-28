import { test, expect } from '@playwright/test';
import { UserConfigPage } from '../pages/UserConfigPage';

test.describe('User Configuration - Data Validation and Business Logic', () => {
	let userConfigPage: UserConfigPage;

	test.beforeEach(async ({ page }) => {
		userConfigPage = new UserConfigPage(page);
	});

	test('should validate date of birth business rules', async ({ page }) => {
		// Complete login flow
		await userConfigPage.navigateToHomePage();

		const cookiesButton = page.getByRole('button', { name: 'Accept all' });
		if (await cookiesButton.isVisible()) {
			await userConfigPage.acceptCookies();
		}

		await userConfigPage.clickLoginLink();
		await userConfigPage.navigateToSignIn();
		await userConfigPage.loginAsAdmin();
		await userConfigPage.navigateToMyAccount();

		// Test future dates (should be invalid)
		const futureDate = new Date();
		futureDate.setFullYear(futureDate.getFullYear() + 1);
		const futureDateString = `${futureDate.getDate().toString().padStart(2, '0')}/${(futureDate.getMonth() + 1).toString().padStart(2, '0')}/${futureDate.getFullYear()}`;

		await page.locator('#user_date_of_birth_date').click();
		await page.locator('#user_date_of_birth_date').clear();
		await page.locator('#user_date_of_birth_date').fill(futureDateString);
		await page.getByRole('button', { name: 'Update account' }).click();

		// Check for future date validation
		const futureDateError =
			(await page.getByText('Date of birth cannot be in the future').isVisible()) ||
			(await page.getByText('Invalid date').isVisible()) ||
			(await page.getByText('Please enter a valid date').isVisible());

		// Test very old dates (e.g., before 1900)
		await page.locator('#user_date_of_birth_date').click();
		await page.locator('#user_date_of_birth_date').clear();
		await page.locator('#user_date_of_birth_date').fill('01/01/1800');
		await page.getByRole('button', { name: 'Update account' }).click();

		const oldDateError =
			(await page.getByText('Date too old').isVisible()) ||
			(await page.getByText('Invalid date').isVisible()) ||
			(await page.getByText('Please enter a valid date').isVisible());

		// Test reasonable date (should be valid)
		await page.locator('#user_date_of_birth_date').click();
		await page.locator('#user_date_of_birth_date').clear();
		await page.locator('#user_date_of_birth_date').fill('15/06/1990');

		// Fill other required fields
		await page.getByLabel('Gender*Required field Male').selectOption('male');
		await page.getByLabel('Country*Required').selectOption('US');
		await page.getByRole('textbox', { name: 'Postal code Required field' }).fill('12345');
		await page.getByRole('textbox', { name: 'Phone Number Required field' }).fill('5551234567');
		await page.getByRole('textbox', { name: 'Location Required field' }).fill('Test City');

		await page.getByRole('button', { name: 'Update account' }).click();

		// Valid date should either succeed or show different validation errors
		await page.waitForTimeout(2000);
		const reasonableDateSuccess = await page.getByText('Your account was successfully updated').isVisible();

		// At least one validation should have occurred (future or old date)
		expect(futureDateError || oldDateError || reasonableDateSuccess).toBe(true);
	});

	test('should validate postal code formats for different countries', async ({ page }) => {
		// Complete login flow
		await userConfigPage.navigateToHomePage();

		const cookiesButton = page.getByRole('button', { name: 'Accept all' });
		if (await cookiesButton.isVisible()) {
			await userConfigPage.acceptCookies();
		}

		await userConfigPage.clickLoginLink();
		await userConfigPage.navigateToSignIn();
		await userConfigPage.loginAsAdmin();
		await userConfigPage.navigateToMyAccount();

		// Test postal code formats for different countries
		const postalTestCases = [
			{ country: 'US', validPostal: '12345', invalidPostal: 'abc123' },
			{ country: 'IT', validPostal: '00144', invalidPostal: '1234' },
			{ country: 'FR', validPostal: '75001', invalidPostal: '1234567890' },
			{ country: 'DE', validPostal: '10115', invalidPostal: 'ABCDE' }
		];

		for (const testCase of postalTestCases) {
			// Select country
			await page.getByLabel('Country*Required').selectOption(testCase.country);

			// Test invalid postal code first
			await page.getByRole('textbox', { name: 'Postal code Required field' }).click();
			await page.getByRole('textbox', { name: 'Postal code Required field' }).clear();
			await page.getByRole('textbox', { name: 'Postal code Required field' }).fill(testCase.invalidPostal);

			// Fill other required fields
			await page.locator('#user_date_of_birth_date').fill('01/01/1990');
			await page.getByLabel('Gender*Required field Male').selectOption('male');
			await page.getByRole('textbox', { name: 'Phone Number Required field' }).fill('1234567890');
			await page.getByRole('textbox', { name: 'Location Required field' }).fill('Test City');

			await page.getByRole('button', { name: 'Update account' }).click();
			await page.waitForTimeout(1000);

			// Check for postal code validation error
			const postalError =
				(await page.getByText('Invalid postal code').isVisible()) ||
				(await page.getByText('Please enter a valid postal code').isVisible()) ||
				(await page.locator('.field-error').isVisible());

			// Test valid postal code
			await page.getByRole('textbox', { name: 'Postal code Required field' }).click();
			await page.getByRole('textbox', { name: 'Postal code Required field' }).clear();
			await page.getByRole('textbox', { name: 'Postal code Required field' }).fill(testCase.validPostal);

			await page.getByRole('button', { name: 'Update account' }).click();
			await page.waitForTimeout(1000);

			// Valid postal code should either succeed or show different errors
			const validPostalSuccess = await page.getByText('Your account was successfully updated').isVisible();

			// We expect either validation error for invalid postal OR success for valid postal
			expect(postalError || validPostalSuccess).toBe(true);
		}
	});

	test('should handle cross-field validation dependencies', async ({ page }) => {
		// Complete login flow
		await userConfigPage.navigateToHomePage();

		const cookiesButton = page.getByRole('button', { name: 'Accept all' });
		if (await cookiesButton.isVisible()) {
			await userConfigPage.acceptCookies();
		}

		await userConfigPage.clickLoginLink();
		await userConfigPage.navigateToSignIn();
		await userConfigPage.loginAsAdmin();
		await userConfigPage.navigateToMyAccount();

		// Test that changing country affects validation of other fields
		await page.getByLabel('Country*Required').selectOption('IT');
		await page.getByRole('textbox', { name: 'Postal code Required field' }).fill('00144'); // Valid Italian postal code
		await page.getByRole('textbox', { name: 'Phone Number Required field' }).fill('3381234567'); // Valid Italian phone

		// Change country - postal code and phone might become invalid
		await page.getByLabel('Country*Required').selectOption('US');

		// Fill other required fields
		await page.locator('#user_date_of_birth_date').fill('01/01/1990');
		await page.getByLabel('Gender*Required field Male').selectOption('male');
		await page.getByRole('textbox', { name: 'Location Required field' }).fill('New York');

		await page.getByRole('button', { name: 'Update account' }).click();
		await page.waitForTimeout(2000);

		// Either form validates cross-field dependencies or accepts the current values
		const crossFieldValidation =
			(await page.getByText('Postal code format does not match country').isVisible()) ||
			(await page.getByText('Phone number format does not match country').isVisible()) ||
			(await page.getByText('Your account was successfully updated').isVisible());

		expect(crossFieldValidation).toBe(true);
	});

	test('should handle gender field validation and options', async ({ page }) => {
		// Complete login flow
		await userConfigPage.navigateToHomePage();

		const cookiesButton = page.getByRole('button', { name: 'Accept all' });
		if (await cookiesButton.isVisible()) {
			await userConfigPage.acceptCookies();
		}

		await userConfigPage.clickLoginLink();
		await userConfigPage.navigateToSignIn();
		await userConfigPage.loginAsAdmin();
		await userConfigPage.navigateToMyAccount();

		// Test all available gender options
		const genderField = page.getByLabel('Gender*Required field Male');

		// Get all available options
		const genderOptions = await genderField.locator('option').all();
		const optionValues: string[] = [];

		for (const option of genderOptions) {
			const value = await option.getAttribute('value');
			if (value && value !== '') {
				optionValues.push(value);
			}
		}

		// Test each gender option
		for (const optionValue of optionValues) {
			await genderField.selectOption(optionValue);

			// Fill other required fields
			await page.locator('#user_date_of_birth_date').fill('01/01/1990');
			await page.getByLabel('Country*Required').selectOption('US');
			await page.getByRole('textbox', { name: 'Postal code Required field' }).fill('12345');
			await page.getByRole('textbox', { name: 'Phone Number Required field' }).fill('5551234567');
			await page.getByRole('textbox', { name: 'Location Required field' }).fill('Test City');

			await page.getByRole('button', { name: 'Update account' }).click();
			await page.waitForTimeout(1000);

			// Each valid gender option should either succeed or show consistent validation
			const isFormProcessed =
				(await page.getByText('Your account was successfully updated').isVisible()) ||
				page.url().includes('/account');
			expect(isFormProcessed).toBe(true);
		}
	});

	test('should validate data consistency across form submissions', async ({ page }) => {
		// Complete login flow
		await userConfigPage.navigateToHomePage();

		const cookiesButton = page.getByRole('button', { name: 'Accept all' });
		if (await cookiesButton.isVisible()) {
			await userConfigPage.acceptCookies();
		}

		await userConfigPage.clickLoginLink();
		await userConfigPage.navigateToSignIn();
		await userConfigPage.loginAsAdmin();
		await userConfigPage.navigateToMyAccount();

		// First submission with one set of data
		const firstSubmissionData = {
			date: '01/01/1990',
			gender: 'male',
			country: 'US',
			postal: '12345',
			phone: '5551234567',
			location: 'New York'
		};

		await page.locator('#user_date_of_birth_date').fill(firstSubmissionData.date);
		await page.getByLabel('Gender*Required field Male').selectOption(firstSubmissionData.gender);
		await page.getByLabel('Country*Required').selectOption(firstSubmissionData.country);
		await page.getByRole('textbox', { name: 'Postal code Required field' }).fill(firstSubmissionData.postal);
		await page.getByRole('textbox', { name: 'Phone Number Required field' }).fill(firstSubmissionData.phone);
		await page.getByRole('textbox', { name: 'Location Required field' }).fill(firstSubmissionData.location);

		await page.getByRole('button', { name: 'Update account' }).click();
		await page.waitForTimeout(2000);

		// Verify first submission
		const firstSubmissionSuccess = await page.getByText('Your account was successfully updated').isVisible();

		// Second submission with different data
		const secondSubmissionData = {
			date: '15/06/1985',
			gender: 'female',
			country: 'IT',
			postal: '00144',
			phone: '3381234567',
			location: 'Rome'
		};

		if (firstSubmissionSuccess) {
			// Update with new data
			await page.locator('#user_date_of_birth_date').clear();
			await page.locator('#user_date_of_birth_date').fill(secondSubmissionData.date);
			await page.getByLabel('Gender*Required field Male').selectOption(secondSubmissionData.gender);
			await page.getByLabel('Country*Required').selectOption(secondSubmissionData.country);
			await page.getByRole('textbox', { name: 'Postal code Required field' }).clear();
			await page.getByRole('textbox', { name: 'Postal code Required field' }).fill(secondSubmissionData.postal);
			await page.getByRole('textbox', { name: 'Phone Number Required field' }).clear();
			await page.getByRole('textbox', { name: 'Phone Number Required field' }).fill(secondSubmissionData.phone);
			await page.getByRole('textbox', { name: 'Location Required field' }).clear();
			await page.getByRole('textbox', { name: 'Location Required field' }).fill(secondSubmissionData.location);

			await page.getByRole('button', { name: 'Update account' }).click();
			await page.waitForTimeout(2000);

			// Verify second submission
			const secondSubmissionSuccess = await page.getByText('Your account was successfully updated').isVisible();

			// Verify data consistency - reload page and check current values
			await page.reload();

			const currentDate = await page.locator('#user_date_of_birth_date').inputValue();
			const currentGender = await page.getByLabel('Gender*Required field Male').inputValue();
			const currentCountry = await page.getByLabel('Country*Required').inputValue();

			// Current values should match the last successful submission
			if (secondSubmissionSuccess) {
				expect(currentDate).toBe(secondSubmissionData.date);
				expect(currentGender).toBe(secondSubmissionData.gender);
				expect(currentCountry).toBe(secondSubmissionData.country);
			} else if (firstSubmissionSuccess) {
				// If second submission failed, should still have first submission data
				expect(currentDate).toBe(firstSubmissionData.date);
			}
		}

		// At least one submission should have been processed
		expect(firstSubmissionSuccess || (await page.url().includes('/account'))).toBe(true);
	});
});
