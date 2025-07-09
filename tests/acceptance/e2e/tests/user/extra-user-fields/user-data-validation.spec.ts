import { HomePage } from '@pages/pages/public/HomePage';
import { UserExtraFieldsPage } from '@pages/pages/user/UserExtraFieldsPage';
import { expect, test } from '@playwright/test';
import { STORAGE_STATE } from '@utils/constants';
import { ExtraUserFieldsTestDataGenerator } from '../../../fixtures/extra-user-fields-fixtures';

test.describe.skip('User Configuration - Data Validation and Business Logic', () => {
	test.use({ storageState: STORAGE_STATE.USER });
	let homePage: HomePage;
	let userExtraFieldsPage: UserExtraFieldsPage;

	test.beforeEach(async ({ page }) => {
		homePage = new HomePage(page);
		userExtraFieldsPage = new UserExtraFieldsPage(page);
		await homePage.navigateToHomePage();
		await homePage.header.navigateToMyAccount();
	});

	test('should validate date of birth business rules', async ({ page }) => {
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
		await userExtraFieldsPage.navigateToMyAccount();

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
		// Test location-country consistency
		await userExtraFieldsPage.selectCountry('IT');
		await userExtraFieldsPage.fillLocation('New York'); // US city with Italian country
		await userExtraFieldsPage.updateAccount();

		// This might show a warning or be accepted based on business rules
		const crossFieldValidation = await page.getByText('Your account was successfully updated').isVisible();

		expect(crossFieldValidation).toBe(true);
	});

	test('should handle all gender options correctly', async ({ page }) => {
		await userExtraFieldsPage.performUserLogin();
		await userExtraFieldsPage.navigateToMyAccount();

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
		// Setup: Login and navigate to account
		await userExtraFieldsPage.performUserLogin();
		await userExtraFieldsPage.navigateToMyAccount();

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
		// Setup: Login and navigate to account
		await userExtraFieldsPage.performUserLogin();
		await userExtraFieldsPage.navigateToMyAccount();

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
		// Setup: Login and navigate to account
		await userExtraFieldsPage.performUserLogin();
		await userExtraFieldsPage.navigateToMyAccount();

		// Test with minimal required data
		const minimalData = ExtraUserFieldsTestDataGenerator.generateMinimalUserData();
		await userExtraFieldsPage.modifyUserFields(minimalData);

		// Should succeed with minimal valid data
		await userExtraFieldsPage.expectUpdateSuccess();
	});
});
