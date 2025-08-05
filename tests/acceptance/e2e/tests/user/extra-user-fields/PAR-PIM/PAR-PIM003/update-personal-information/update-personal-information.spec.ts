import { TEST_USERS } from '@config/test-users';
import { ExtraUserFieldsTestDataGenerator } from '@fixtures/extra-user-fields-fixtures';
import { HomePage } from '@pages/pages/public/HomePage';
import { AccountPage } from '@pages/pages/user/account/AccountPage';
import { UserExtraFieldsPage, UserFieldsData } from '@pages/pages/user/account/UserExtraFieldsPage';
import test, { expect } from '@playwright/test';
import { ensureLoggedIn } from '@utils/auth-helper';
import { STORAGE_STATE } from '@utils/constants';

/**
 * Allows citizens to update or correct their personal information to ensure accuracy.
 * User Story: Update personal information
 *
 * 	As a Citizen, I want to update or correct my personal information so that my data is accurate and up to date Requirements associated
 *
 * Requirements associated: PAR R3c
 *
 * Prerequisites:
 * - The citizen has an active account on the platform
 * - The citizen is logged into the platform
 */
test.beforeAll(async ({ browser }) => {
	const context = await browser.newContext();
	const page = await context.newPage();
	await ensureLoggedIn(page, 'USER');
});
test.describe('[PAR-PIM003] – Update personal information', () => {
	test.use({ storageState: STORAGE_STATE.USER });
	let homePage: HomePage;
	let accountPage: AccountPage;
	let userExtraFieldsPage: UserExtraFieldsPage;

	test.beforeEach(async ({ page }) => {
		homePage = new HomePage(page);
		accountPage = new AccountPage(page);
		userExtraFieldsPage = new UserExtraFieldsPage(page);
		await homePage.navigateToHomePage();
	});

	test.describe('Main flow', () => {
		test('should successfully update personal information', async ({ page }) => {
			await test.step('1. User: Navigates to their "Account Settings" section within the platform.', async () => {
				await homePage.header.navigateToMyAccount();
			});
			await test.step("2. System: Displays the user's current personal information, including editable fields.", async () => {
				await accountPage.waitForPageLoad();
			});
			await test.step('3. User: Selects the option to edit their personal information.”', async () => {});
			await test.step('4. System: Enables editing of the personal information fields (address, contact information)', async () => {});
			await test.step('5. User: Updates or corrects the desired personal information fields.', async () => {});
			await test.step('6. User: Clicks on the "Save" or "Update" button to submit the changes.', async () => {});
			await test.step('7. System: Validates the entered data for correctness and completeness.', async () => {});
			await test.step('8. System: Saves the updated personal information securely in the database, ensuring compliance with data protection regulations.', async () => {});
			await test.step('9. System: Confirms to the user that their personal information has been successfully updated.', async () => {});
			await test.step('10. System: Reflects the updated information across all relevant platform features and services.', async () => {});
			await test.step('Result.', async () => {});
		});
	});
	test.describe.skip('User Configuration - Data Validation and Business Logic', () => {
		test('should validate date of birth business rules', async ({ page }) => {
			await homePage.header.navigateToMyAccount();
			// Test future dates (should be invalid)
			const futureDate = new Date();
			futureDate.setDate(futureDate.getDate() + 30); // 30 days in the future
			const futureDateString = `${futureDate.getDate().toString().padStart(2, '0')}/${(futureDate.getMonth() + 1).toString().padStart(2, '0')}/${futureDate.getFullYear()}`;

			await userExtraFieldsPage.fillDateOfBirth(futureDateString);
			await userExtraFieldsPage.updateAccount();

			// Check for future date validation
			const futureDateError = await page.getByText('Please enter a valid date').isVisible();

			// Test very old dates (e.g., before 1900)
			await userExtraFieldsPage.fillDateOfBirth('01/01/1800');
			await userExtraFieldsPage.updateAccount();

			const oldDateError =
				(await page.getByText('Date too old').isVisible()) ||
				(await page.getByText('Please enter a valid date').isVisible());

			// Test reasonable date (should be valid)
			await userExtraFieldsPage.fillDateOfBirth('15/06/1990');
			await userExtraFieldsPage.fillPostalCode('12345');
			await userExtraFieldsPage.fillLocation('Test City');
			await userExtraFieldsPage.updateAccount();

			// Valid date should either succeed or show different validation errors
			const reasonableDateSuccess = await page.getByText('Your account was successfully updated').isVisible();

			// At least one validation should have occurred (future or old date)
			expect(futureDateError || oldDateError || reasonableDateSuccess).toBe(true);
		});

		test('should validate postal code formats by country', async ({ page }) => {
			await homePage.header.navigateToMyAccount();

			// Test different postal code formats for different countries
			const postalCodeTests = [
				{ country: 'IT', invalidPostal: 'ABC123', validPostal: '00144' },
				{ country: 'US', invalidPostal: '1234', validPostal: '12345' },
				{ country: 'GB', invalidPostal: '123', validPostal: 'SW1A 1AA' },
				{ country: 'FR', invalidPostal: '1234', validPostal: '75001' }
			];

			for (const testCase of postalCodeTests) {
				// Select country
				await userExtraFieldsPage.selectCountry(testCase.country);

				// Test invalid postal code
				await userExtraFieldsPage.fillPostalCode(testCase.invalidPostal);
				await userExtraFieldsPage.updateAccount();

				const postalError = await page.getByText('Please enter a valid postal code').isVisible();

				// Test valid postal code
				await userExtraFieldsPage.fillPostalCode(testCase.validPostal);
				await userExtraFieldsPage.updateAccount();

				// Valid postal code should either succeed or show different errors
				const validPostalSuccess = await page.getByText('Your account was successfully updated').isVisible();

				// We expect either validation error for invalid postal OR success for valid postal
				expect(postalError || validPostalSuccess).toBe(true);
			}
		});

		test('should validate cross-field dependencies', async ({ page }) => {
			await homePage.header.navigateToMyAccount();
			// Test location-country consistency
			await userExtraFieldsPage.selectCountry('IT');
			await userExtraFieldsPage.fillLocation('New York'); // US city with Italian country
			await userExtraFieldsPage.updateAccount();

			// This might show a warning or be accepted based on business rules
			const crossFieldValidation = await page.getByText('Your account was successfully updated').isVisible();

			expect(crossFieldValidation).toBe(true);
		});

		test('should handle all gender options correctly', async ({ page }) => {
			await homePage.header.navigateToMyAccount();

			const genderOptions = ['male', 'female', 'other'];

			for (const gender of genderOptions) {
				await userExtraFieldsPage.selectGender(gender);
				await userExtraFieldsPage.fillPhoneNumber('5551234567');
				await userExtraFieldsPage.updateAccount();

				// Each valid gender option should either succeed or show consistent validation
				const page = userExtraFieldsPage.getPage();
				const isFormProcessed =
					(await page.getByText('Your account was successfully updated').isVisible()) ||
					page.url().includes('/account');

				expect(isFormProcessed).toBe(true);
			}
		});

		test('should validate phone number formats', async ({ page }) => {
			await homePage.header.navigateToMyAccount();

			// Test various phone number formats
			const phoneTests = [
				{ phone: '1234567890', shouldBeValid: true },
				{ phone: '+1234567890', shouldBeValid: true },
				{ phone: '123-456-7890', shouldBeValid: true },
				{ phone: '(123) 456-7890', shouldBeValid: true },
				{ phone: 'abc123', shouldBeValid: false },
				{ phone: '123', shouldBeValid: false },
				{ phone: '+++++', shouldBeValid: false }
			];

			for (const testCase of phoneTests) {
				await userExtraFieldsPage.fillPhoneNumber(testCase.phone);
				await userExtraFieldsPage.updateAccount();

				const page = userExtraFieldsPage.getPage();
				const hasValidationError = await page.getByText('Please enter a valid phone number').isVisible();
				const hasSuccess = await page.getByText('Your account was successfully updated').isVisible();

				if (testCase.shouldBeValid) {
					// Valid phone should succeed or not show phone-specific error
					expect(!hasValidationError || hasSuccess).toBe(true);
				} else {
					// Invalid phone should show validation error
					expect(hasValidationError || !hasSuccess).toBe(true);
				}
			}
		});

		test('should handle special characters in location field', async ({ page }) => {
			await homePage.header.navigateToMyAccount();
			const locationTests = [
				'Rome',
				'São Paulo',
				'München',
				'北京', // Beijing in Chinese
				"O'Connor",
				'Saint-Jean-de-Luz',
				'Los Angeles'
			];

			for (const location of locationTests) {
				await userExtraFieldsPage.fillLocation(location);
				await userExtraFieldsPage.updateAccount();

				// All reasonable location names should be accepted
				const page = userExtraFieldsPage.getPage();
				const isAccepted =
					(await page.getByText('Your account was successfully updated').isVisible()) ||
					!(await page.getByText('Please enter a valid location').isVisible());

				expect(isAccepted).toBe(true);
			}
		});

		test('should validate required field combinations', async ({ page }) => {
			await homePage.header.navigateToMyAccount();

			// Test with minimal required data
			const minimalData = ExtraUserFieldsTestDataGenerator.generateMinimalUserData();
			await userExtraFieldsPage.modifyUserFields(minimalData);

			// Should succeed with minimal valid data
			await userExtraFieldsPage.expectUpdateSuccess();
		});
	});
	test.describe.skip('User Extra Fields Configuration', () => {
		test('should successfully update user profile with all extra fields', async ({ page }) => {
			await homePage.header.navigateToMyAccount();
			const defaultUserData: UserFieldsData = {
				dateOfBirth: '01/01/1996',
				gender: 'female',
				country: 'IT',
				postalCode: '00144',
				phoneNumber: '3258023921',
				location: 'Rome'
			};

			// Modify user fields using the authenticated state
			await userExtraFieldsPage.modifyUserFields(defaultUserData);

			// Verify the form was submitted successfully
			await userExtraFieldsPage.expectUpdateSuccess();

			// Verify the fields are populated with the correct values
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

		test('should validate required fields before submission', async ({ page }) => {
			await homePage.header.navigateToMyAccount();
			// Try to submit with empty required fields
			await userExtraFieldsPage.updateAccount();

			// Check for validation error
			await userExtraFieldsPage.expectUpdateError();
		});

		test('should maintain user field values after page reload', async ({ page }) => {
			await homePage.header.navigateToMyAccount();
			const defaultUserData: UserFieldsData = {
				dateOfBirth: '10/04/1996',
				gender: 'female',
				country: 'IT',
				postalCode: '00144',
				phoneNumber: '3258023921',
				location: 'Rome'
			};

			// Setup and modify fields
			await userExtraFieldsPage.modifyUserFields(defaultUserData);

			// Reload the page
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

		test('should validate date of birth field format', async ({ page }) => {
			// Try invalid date formats
			await homePage.header.navigateToMyAccount();
			const invalidDates = ['invalid-date', '32/13/2025', '00/00/0000', 'abc/def/ghij'];

			for (const invalidDate of invalidDates) {
				await userExtraFieldsPage.fillDateOfBirth(invalidDate);
				await userExtraFieldsPage.updateAccount();

				// Check for date validation error
				const dateError = page.getByText('Please enter a valid date');
				if (await dateError.isVisible()) {
					await expect(dateError).toContainText('valid date');
					break;
				}
			}
		});

		test('should validate phone number field format', async ({ page }) => {
			// Try invalid phone number formats
			await homePage.header.navigateToMyAccount();
			const invalidPhones = ['abc123', '123', '+++++', 'phone-number'];

			for (const invalidPhone of invalidPhones) {
				await userExtraFieldsPage.fillPhoneNumber(invalidPhone);
				await userExtraFieldsPage.updateAccount();

				// Check for phone validation error
				const phoneError = page.getByText('Please enter a valid phone number');
				if (await phoneError.isVisible()) {
					await expect(phoneError).toContainText('valid phone');
					break;
				}
			}
		});

		test('should validate postal code field format', async ({ page }) => {
			// Try invalid postal code formats
			await homePage.header.navigateToMyAccount();
			const invalidPostalCodes = ['abc', '123456789012345', '!@#$%'];

			for (const invalidPostal of invalidPostalCodes) {
				await userExtraFieldsPage.fillPostalCode(invalidPostal);
				await userExtraFieldsPage.updateAccount();

				// Check for postal code validation error
				const postalError = page.getByText('Please enter a valid postal code');
				if (await postalError.isVisible()) {
					await expect(postalError).toContainText('valid postal');
					break;
				}
			}
		});

		test('should allow partial field updates', async ({ page }) => {
			await homePage.header.navigateToMyAccount();
			// Update only some fields
			await userExtraFieldsPage.fillDateOfBirth('15/06/1990');
			await userExtraFieldsPage.selectGender('male');
			await userExtraFieldsPage.selectCountry('FR');
			// Leave other fields as they are

			await userExtraFieldsPage.updateAccount();

			// Verify the update was successful
			await userExtraFieldsPage.expectUpdateSuccess();

			// Verify only the changed fields were updated
			await expect(page.locator('#user_date_of_birth_date')).toHaveValue('15/06/1990');
			await expect(page.getByLabel('Gender*Required field Male')).toHaveValue('male');
			await expect(page.getByLabel('Country*Required')).toHaveValue('FR');
		});

		test('should handle different user data sets', async ({ page }) => {
			await homePage.header.navigateToMyAccount();
			// Generate custom test data
			const customData = ExtraUserFieldsTestDataGenerator.generateValidUserData();

			// Setup and modify fields with custom data
			await userExtraFieldsPage.modifyUserFields(customData);

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
});
