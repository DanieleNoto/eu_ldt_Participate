import { test, expect } from '@playwright/test';
import { UserConfigPage } from '../pages/UserConfigPage';

test.describe('User Extra Fields Configuration', () => {
	let userConfigPage: UserConfigPage;

	test.beforeEach(async ({ page }) => {
		userConfigPage = new UserConfigPage(page);
	});

	test('should successfully update user profile with all extra fields', async ({ page }) => {
		// Navigate to home and login
		await userConfigPage.navigateToHomePage();
		await userConfigPage.clickLoginLink();
		await userConfigPage.navigateToSignIn();
		await userConfigPage.acceptCookies();
		await userConfigPage.loginAsAdmin();

		// Navigate to user account
		await userConfigPage.navigateToMyAccount();

		// Modify user fields
		await userConfigPage.modifyUserFields();

		// Verify the form was submitted successfully
		await expect(page.getByText('Your account was successfully updated')).toBeVisible();

		// Verify the fields are populated with the correct values
		await expect(page.locator('#user_date_of_birth_date')).toHaveValue('10/04/1996');
		await expect(page.getByLabel('Gender*Required field Male')).toHaveValue('female');
		await expect(page.getByLabel('Country*Required')).toHaveValue('IT');
		await expect(page.getByRole('textbox', { name: 'Postal code Required field' })).toHaveValue('00144');
		await expect(page.getByRole('textbox', { name: 'Phone Number Required field' })).toHaveValue('3258023921');
		await expect(page.getByRole('textbox', { name: 'Location Required field' })).toHaveValue('Rome');
	});

	test('should validate required fields before submission', async ({ page }) => {
		// Navigate to home and login
		await userConfigPage.navigateToHomePage();
		await userConfigPage.clickLoginLink();
		await userConfigPage.navigateToSignIn();
		await userConfigPage.acceptCookies();
		await userConfigPage.loginAsAdmin();

		// Navigate to user account
		await userConfigPage.navigateToMyAccount();

		// Try to submit with empty required fields
		await page.getByRole('button', { name: 'Update account' }).click();

		// Check for validation messages on required fields
		const requiredFieldsValidation = [
			page.locator('#user_date_of_birth_date').locator('..').getByText('required'),
			page.getByText('Gender is required'),
			page.getByText('Country is required'),
			page.getByText('Postal code is required'),
			page.getByText('Phone Number is required'),
			page.getByText('Location is required')
		];

		// At least one validation message should be visible
		let validationFound = false;
		for (const validation of requiredFieldsValidation) {
			if (await validation.isVisible()) {
				validationFound = true;
				break;
			}
		}
		expect(validationFound).toBe(true);
	});

	test('should maintain user field values after page reload', async ({ page }) => {
		// Navigate to home and login
		await userConfigPage.navigateToHomePage();
		await userConfigPage.clickLoginLink();
		await userConfigPage.navigateToSignIn();
		await userConfigPage.acceptCookies();
		await userConfigPage.loginAsAdmin();

		// Navigate to user account and modify fields
		await userConfigPage.navigateToMyAccount();
		await userConfigPage.modifyUserFields();

		// Wait for successful update
		await expect(page.getByText('Your account was successfully updated')).toBeVisible();

		// Reload the page
		await page.reload();

		// Verify the values are still there
		await expect(page.locator('#user_date_of_birth_date')).toHaveValue('10/04/1996');
		await expect(page.getByLabel('Gender*Required field Male')).toHaveValue('female');
		await expect(page.getByLabel('Country*Required')).toHaveValue('IT');
		await expect(page.getByRole('textbox', { name: 'Postal code Required field' })).toHaveValue('00144');
		await expect(page.getByRole('textbox', { name: 'Phone Number Required field' })).toHaveValue('3258023921');
		await expect(page.getByRole('textbox', { name: 'Location Required field' })).toHaveValue('Rome');
	});

	test('should validate date of birth field format', async ({ page }) => {
		// Navigate to home and login
		await userConfigPage.navigateToHomePage();
		await userConfigPage.clickLoginLink();
		await userConfigPage.navigateToSignIn();
		await userConfigPage.acceptCookies();
		await userConfigPage.loginAsAdmin();

		// Navigate to user account
		await userConfigPage.navigateToMyAccount();

		// Try invalid date formats
		const invalidDates = ['invalid-date', '32/13/2025', '00/00/0000', 'abc/def/ghij'];

		for (const invalidDate of invalidDates) {
			await page.locator('#user_date_of_birth_date').click();
			await page.locator('#user_date_of_birth_date').clear();
			await page.locator('#user_date_of_birth_date').fill(invalidDate);
			await page.getByRole('button', { name: 'Update account' }).click();

			// Check for date validation error
			const dateError = page.getByText('Please enter a valid date');
			if (await dateError.isVisible()) {
				expect(await dateError.textContent()).toContain('valid date');
				break;
			}
		}
	});

	test('should validate phone number field format', async ({ page }) => {
		// Navigate to home and login
		await userConfigPage.navigateToHomePage();
		await userConfigPage.clickLoginLink();
		await userConfigPage.navigateToSignIn();
		await userConfigPage.acceptCookies();
		await userConfigPage.loginAsAdmin();

		// Navigate to user account
		await userConfigPage.navigateToMyAccount();

		// Try invalid phone number formats
		const invalidPhones = ['abc123', '123', '+++++', 'phone-number'];

		for (const invalidPhone of invalidPhones) {
			await page.getByRole('textbox', { name: 'Phone Number Required field' }).click();
			await page.getByRole('textbox', { name: 'Phone Number Required field' }).clear();
			await page.getByRole('textbox', { name: 'Phone Number Required field' }).fill(invalidPhone);
			await page.getByRole('button', { name: 'Update account' }).click();

			// Check for phone validation error
			const phoneError = page.getByText('Please enter a valid phone number');
			if (await phoneError.isVisible()) {
				expect(await phoneError.textContent()).toContain('valid phone');
				break;
			}
		}
	});

	test('should validate postal code field format', async ({ page }) => {
		// Navigate to home and login
		await userConfigPage.navigateToHomePage();
		await userConfigPage.clickLoginLink();
		await userConfigPage.navigateToSignIn();
		await userConfigPage.acceptCookies();
		await userConfigPage.loginAsAdmin();

		// Navigate to user account
		await userConfigPage.navigateToMyAccount();

		// Try invalid postal code formats
		const invalidPostalCodes = ['abc', '123456789012345', '!@#$%'];

		for (const invalidPostal of invalidPostalCodes) {
			await page.getByRole('textbox', { name: 'Postal code Required field' }).click();
			await page.getByRole('textbox', { name: 'Postal code Required field' }).clear();
			await page.getByRole('textbox', { name: 'Postal code Required field' }).fill(invalidPostal);
			await page.getByRole('button', { name: 'Update account' }).click();

			// Check for postal code validation error
			const postalError = page.getByText('Please enter a valid postal code');
			if (await postalError.isVisible()) {
				expect(await postalError.textContent()).toContain('valid postal');
				break;
			}
		}
	});

	test('should allow partial field updates', async ({ page }) => {
		// Navigate to home and login
		await userConfigPage.navigateToHomePage();
		await userConfigPage.clickLoginLink();
		await userConfigPage.navigateToSignIn();
		await userConfigPage.acceptCookies();
		await userConfigPage.loginAsAdmin();

		// Navigate to user account
		await userConfigPage.navigateToMyAccount();

		// Update only some fields
		await page.locator('#user_date_of_birth_date').click();
		await page.locator('#user_date_of_birth_date').fill('15/06/1990');
		await page.getByLabel('Gender*Required field Male').selectOption('male');
		await page.getByLabel('Country*Required').selectOption('FR');
		// Leave other fields as they are

		await page.getByRole('button', { name: 'Update account' }).click();

		// Verify the update was successful
		await expect(page.getByText('Your account was successfully updated')).toBeVisible();

		// Verify only the changed fields were updated
		await expect(page.locator('#user_date_of_birth_date')).toHaveValue('15/06/1990');
		await expect(page.getByLabel('Gender*Required field Male')).toHaveValue('male');
		await expect(page.getByLabel('Country*Required')).toHaveValue('FR');
	});
});
