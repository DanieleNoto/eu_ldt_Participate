import { TEST_USERS } from '@config/test-users';
import {
	expect,
	ExtraUserFieldsTestDataGenerator,
	extraUserFieldsTest as test
} from '../../../fixtures/extra-user-fields-fixtures';

test.describe('User Extra Fields Configuration', () => {
	test('should successfully update user profile with all extra fields', async ({
		loggedInUserPage,
		defaultUserData
	}) => {
		// Modify user fields using the pre-logged in fixture
		await loggedInUserPage.modifyUserFields(defaultUserData);

		// Verify the form was submitted successfully
		await loggedInUserPage.expectUpdateSuccess();

		// Verify the fields are populated with the correct values
		const page = loggedInUserPage.getPage();
		await expect(page.locator('#user_date_of_birth_date')).toHaveValue(TEST_USERS.NORMAL_USER.birth);
		await expect(page.locator('#user_gender')).toHaveValue(TEST_USERS.NORMAL_USER.gender);
		await expect(page.locator('#user_country')).toHaveValue(TEST_USERS.NORMAL_USER.country);
		await expect(page.getByRole('textbox', { name: 'Postal code Required field' })).toHaveValue(
			TEST_USERS.NORMAL_USER.postalCode
		);
		await expect(page.getByRole('textbox', { name: 'Phone Number Required field' })).toHaveValue(
			TEST_USERS.NORMAL_USER.phoneNumber
		);
		await expect(page.getByRole('textbox', { name: 'Location Required field' })).toHaveValue(
			TEST_USERS.NORMAL_USER.location
		);
	});

	test('should validate required fields before submission', async ({ userExtraFieldsPage }) => {
		// Setup: Login and navigate to account
		await userExtraFieldsPage.performUserLogin();
		await userExtraFieldsPage.navigateToMyAccount();

		// Try to submit with empty required fields
		await userExtraFieldsPage.updateAccount();

		// Check for validation error
		await userExtraFieldsPage.expectUpdateError();
	});

	test('should maintain user field values after page reload', async ({ userExtraFieldsPage, defaultUserData }) => {
		// Setup and modify fields
		await userExtraFieldsPage.setupUserExtraFields(defaultUserData);

		// Reload the page
		const page = userExtraFieldsPage.getPage();
		await page.reload();

		// Verify the values are still there
		await expect(page.locator('#user_date_of_birth_date')).toHaveValue(TEST_USERS.NORMAL_USER.birth);
		await expect(page.getByLabel('#user_gender')).toHaveValue(TEST_USERS.NORMAL_USER.gender);
		await expect(page.getByLabel('#user_country')).toHaveValue(TEST_USERS.NORMAL_USER.country);
		await expect(page.getByRole('textbox', { name: 'Postal code Required field' })).toHaveValue(
			TEST_USERS.NORMAL_USER.postalCode
		);
		await expect(page.getByRole('textbox', { name: 'Phone Number Required field' })).toHaveValue(
			TEST_USERS.NORMAL_USER.phoneNumber
		);
		await expect(page.getByRole('textbox', { name: 'Location Required field' })).toHaveValue(
			TEST_USERS.NORMAL_USER.location
		);
	});

	test('should validate date of birth field format', async ({ userExtraFieldsPage }) => {
		// Setup: Login and navigate to account
		await userExtraFieldsPage.performUserLogin();
		await userExtraFieldsPage.navigateToMyAccount();

		// Try invalid date formats
		const invalidDates = ['invalid-date', '32/13/2025', '00/00/0000', 'abc/def/ghij'];

		for (const invalidDate of invalidDates) {
			await userExtraFieldsPage.fillDateOfBirth(invalidDate);
			await userExtraFieldsPage.updateAccount();

			// Check for date validation error
			const page = userExtraFieldsPage.getPage();
			const dateError = page.getByText('Please enter a valid date');
			if (await dateError.isVisible()) {
				await expect(dateError).toContainText('valid date');
				break;
			}
		}
	});

	test('should validate phone number field format', async ({ userExtraFieldsPage }) => {
		// Setup: Login and navigate to account
		await userExtraFieldsPage.performUserLogin();
		await userExtraFieldsPage.navigateToMyAccount();

		// Try invalid phone number formats
		const invalidPhones = ['abc123', '123', '+++++', 'phone-number'];

		for (const invalidPhone of invalidPhones) {
			await userExtraFieldsPage.fillPhoneNumber(invalidPhone);
			await userExtraFieldsPage.updateAccount();

			// Check for phone validation error
			const page = userExtraFieldsPage.getPage();
			const phoneError = page.getByText('Please enter a valid phone number');
			if (await phoneError.isVisible()) {
				await expect(phoneError).toContainText('valid phone');
				break;
			}
		}
	});

	test('should validate postal code field format', async ({ userExtraFieldsPage }) => {
		// Setup: Login and navigate to account
		await userExtraFieldsPage.performUserLogin();
		await userExtraFieldsPage.navigateToMyAccount();

		// Try invalid postal code formats
		const invalidPostalCodes = ['abc', '123456789012345', '!@#$%'];

		for (const invalidPostal of invalidPostalCodes) {
			await userExtraFieldsPage.fillPostalCode(invalidPostal);
			await userExtraFieldsPage.updateAccount();

			// Check for postal code validation error
			const page = userExtraFieldsPage.getPage();
			const postalError = page.getByText('Please enter a valid postal code');
			if (await postalError.isVisible()) {
				await expect(postalError).toContainText('valid postal');
				break;
			}
		}
	});

	test('should allow partial field updates', async ({ userExtraFieldsPage }) => {
		// Setup: Login and navigate to account
		await userExtraFieldsPage.performUserLogin();
		await userExtraFieldsPage.navigateToMyAccount();

		// Update only some fields
		await userExtraFieldsPage.fillDateOfBirth('15/06/1990');
		await userExtraFieldsPage.selectGender('male');
		await userExtraFieldsPage.selectCountry('FR');
		// Leave other fields as they are

		await userExtraFieldsPage.updateAccount();

		// Verify the update was successful
		await userExtraFieldsPage.expectUpdateSuccess();

		// Verify only the changed fields were updated
		const page = userExtraFieldsPage.getPage();
		await expect(page.locator('#user_date_of_birth_date')).toHaveValue('15/06/1990');
		await expect(page.getByLabel('Gender*Required field Male')).toHaveValue('male');
		await expect(page.getByLabel('Country*Required')).toHaveValue('FR');
	});

	test('should handle different user data sets', async ({ userExtraFieldsPage }) => {
		// Generate custom test data
		const customData = ExtraUserFieldsTestDataGenerator.generateValidUserData();

		// Setup and modify fields with custom data
		await userExtraFieldsPage.setupUserExtraFields(customData);

		// Verify the update was successful
		await userExtraFieldsPage.expectUpdateSuccess();

		// Verify the custom data was saved
		if (customData.dateOfBirth) {
			const dateValue = await userExtraFieldsPage.getFieldValue('Date of birth');
			expect(dateValue).toBeTruthy();
		}

		if (customData.postalCode) {
			const postalValue = await userExtraFieldsPage.getFieldValue('Postal code Required field');
			expect(postalValue).toBe(customData.postalCode);
		}
	});
});
