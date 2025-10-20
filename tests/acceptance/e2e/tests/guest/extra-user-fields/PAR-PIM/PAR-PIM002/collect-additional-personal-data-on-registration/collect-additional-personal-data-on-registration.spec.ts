import test, { expect } from '@playwright/test';
import { ExtraUserFieldsTestDataGenerator } from '@fixtures/extra-user-fields-fixtures';
import { AdminHomePage } from '@pages/pages/admin/AdminHomePage';
import { ExtraUserFieldsAdminPage } from '@pages/pages/admin/ExtraUserFieldsAdminPage';
import { LetterOpenerPage } from '@pages/pages/admin/LetterOpenerPage';
import { HomePage } from '@pages/pages/public/HomePage';
import { SignUpPage } from '@pages/pages/public/SignUpPage';
import { UserExtraFieldsPage } from '@pages/pages/user/account/UserExtraFieldsPage';
import { AccountDeletionPage } from '@pages/pages/user/account/AccountDeletionPage';
import { ensureLoggedIn } from '@utils/auth-helper';
import { STORAGE_STATE } from '@utils/constants';
import { ROUTES } from '@utils/routes';

/**
 * Defines how citizens must provide additional personal information during their registration process, ensuring their profile is complete and ready for full participation on the platform.
 * User Story: As a Citizen registering into the platform, I want to provide additional personal information as required so that my profile is complete for full participation.
 *
 * Requirements associated: PAR R1, PAR R2
 *
 * Prerequisites:
 * - The administrator has configured additional personal data fields.
 */
test.describe('[PAR-PIM002] – Collect additional personal data on registration', () => {
	// Variables for test data - Basic fields
	let testUserName: string;
	let testUserEmail: string;
	let testUserPassword: string;

	// Variables for test data - Extra fields
	let testDateOfBirth: string;
	let testGender: string;
	let testCountry: string;
	let testPostalCode: string;
	let testPhoneNumber: string;
	let testLocation: string;

	let homePage: HomePage;
	let signUpPage: SignUpPage;
	let letterOpenerPage: LetterOpenerPage;

	let sharedAdminContext: any;
	let sharedAdminPage: any;

	test.beforeAll(async ({ browser }) => {
		await test.step('Setup: Enable admin extra user fields configuration', async () => {
			sharedAdminContext = await browser.newContext({
				storageState: STORAGE_STATE.ADMIN
			});
			sharedAdminPage = await sharedAdminContext.newPage();

			// Ensure admin is logged in
			await ensureLoggedIn(sharedAdminPage, 'ADMIN');

			const adminHomePage = new AdminHomePage(sharedAdminPage);
			const extraUserFieldsAdminPage = new ExtraUserFieldsAdminPage(sharedAdminPage);

			await adminHomePage.navigateToAdminHomePage();
			await extraUserFieldsAdminPage.navigateToSettings();
			await extraUserFieldsAdminPage.navigateToExtraUserFields();
			await extraUserFieldsAdminPage.enableAllExtraUserFields();
			await extraUserFieldsAdminPage.saveConfiguration();
			await extraUserFieldsAdminPage.expectConfigurationSaved();

			console.log('Admin extra user fields configuration enabled');
		});
	});

	test.beforeEach(async ({ page }) => {
		// Generate unique test user data
		const timestamp = Date.now().toString().slice(-8);
		testUserName = `TestUser${timestamp}`;
		testUserEmail = `testuser${timestamp}@example.org`;
		testUserPassword = 'decidim123456789';

		// Generate test data - Extra fields using fixture
		const extraFieldsData = ExtraUserFieldsTestDataGenerator.generateValidUserData(timestamp);
		testDateOfBirth = extraFieldsData.dateOfBirth!;
		testGender = extraFieldsData.gender!;
		testCountry = extraFieldsData.country!;
		testPostalCode = extraFieldsData.postalCode!;
		testPhoneNumber = extraFieldsData.phoneNumber!;
		testLocation = extraFieldsData.location!;

		homePage = new HomePage(page);
		signUpPage = new SignUpPage(page);
		letterOpenerPage = new LetterOpenerPage(page);

		await homePage.navigateToHomePage();
	});

	test.afterEach(async ({ page }) => {
		await test.step('Cleanup: Delete test user account', async () => {
			// Navigate to account deletion page
			await page.goto(ROUTES.accountDeletePage.pattern);

			// Initialize AccountDeletionPage
			const accountDeletionPage = new AccountDeletionPage(page);

			// Fill delete reason
			await accountDeletionPage.fillDeleteReason('Test cleanup - automated test user deletion');

			// Click delete account button
			await accountDeletionPage.clickDeleteAccountButton();

			// Wait for confirmation modal to appear
			await accountDeletionPage.waitForConfirmationModal();

			// Confirm deletion
			await accountDeletionPage.confirmDeletion();

			// Verify redirect to home page
			await homePage.expectToBeOnHomePage();

			console.log(`User account deleted successfully: ${testUserName} (${testUserEmail})`);
		});
	});

	// Run once after all tests in this describe block
	test.afterAll(async () => {
		await test.step('Cleanup: Disable admin extra user fields configuration', async () => {
			const adminHomePage = new AdminHomePage(sharedAdminPage);
			const extraUserFieldsAdminPage = new ExtraUserFieldsAdminPage(sharedAdminPage);

			await adminHomePage.navigateToAdminHomePage();
			await extraUserFieldsAdminPage.navigateToSettings();
			await extraUserFieldsAdminPage.navigateToExtraUserFields();
			await extraUserFieldsAdminPage.navigateToExtraUserFieldsConfig();

			// Disable the main extra user fields flag
			await extraUserFieldsAdminPage.disableExtraUserField('Enable extra user fields');

			await extraUserFieldsAdminPage.saveConfiguration();
			await extraUserFieldsAdminPage.expectConfigurationSaved();

			console.log('Admin extra user fields configuration disabled');

			await sharedAdminPage.close();
			await sharedAdminContext.close();
		});
	});

	test.describe('Main flow', () => {
		test('should successfully provide additional personal information', async ({ page, browser }) => {
			await test.step('1. User: Register an account into the platform', async () => {
				// Navigate to the registration page
				await page.goto(ROUTES.signupPage.pattern);

				console.log('Navigated to registration page');

				// Verify we're on the registration page
				await expect(page).toHaveURL(new RegExp(ROUTES.signupPage.pattern));
			});

			await test.step('2. System: Displays registration form with additional personal information as configured by the administrator', async () => {
				// Verify all registration form fields are visible
				await signUpPage.expectAllFieldsToBeVisible();

				console.log('All registration form fields are visible');
			});

			await test.step('3. User: Completes all mandatory fields and submits the form', async () => {
				// Fill basic registration fields
				await signUpPage.fillName(testUserName);
				await signUpPage.fillEmail(testUserEmail);
				await signUpPage.fillPassword(testUserPassword);

				console.log(`Registering user: ${testUserName} (${testUserEmail})`);

				// Fill extra user fields
				await signUpPage.fillDateOfBirth(testDateOfBirth);
				await signUpPage.selectGender(testGender);
				await signUpPage.selectCountry(testCountry);
				await signUpPage.fillPostalCode(testPostalCode);
				await signUpPage.fillPhoneNumber(testPhoneNumber);
				await signUpPage.fillLocation(testLocation);

				// Accept terms and conditions and newsletter
				await signUpPage.checkTermsAndConditions();
				await signUpPage.checkNewsletterSubscription();

				console.log(`Registration form filled with extra fields`);

				// Submit registration
				await signUpPage.submitRegistration();

				// Verify redirect to home
				await homePage.expectToBeOnHomePage();

				console.log('Registration completed successfully and redirected to home page');
			});

			await test.step('4. System: Confirms successful data submission', async () => {
				// Navigate to Letter Opener to check confirmation email
				await letterOpenerPage.navigateToLetterOpener();
				console.log('Navigated to Letter Opener');

				// Refresh emails to get the latest confirmation email
				await letterOpenerPage.refreshEmails();
				console.log('Refreshed emails in Letter Opener');

				// Find and click on the most recent account registration confirmation email
				await letterOpenerPage.clickMostRecentAccountRegistrationEmail();
				console.log('Opened confirmation instructions email');

				// Get the confirmation URL using the POM method
				const confirmationUrl = await letterOpenerPage.getConfirmMyAccountUrl();

				const freshContext = await browser.newContext();
				const freshPage = await freshContext.newPage();

				// Navigate to confirmation URL in the fresh context
				await freshPage.goto(confirmationUrl, { waitUntil: 'networkidle' });

				// Verify email confirmation success message in fresh context
				const homePage2 = new HomePage(freshPage);
				await homePage2.expectToBeOnHomePage();

				await expect(freshPage.getByText('Your email address has been successfully confirmed')).toBeVisible();
				console.log('Email confirmation success message displayed');

				// Navigate to account page to verify all fields were saved correctly
				await freshPage.goto(ROUTES.accountPage.pattern);
				console.log('Navigated to account page');

				// Verify we're on the account page
				await expect(freshPage).toHaveURL(new RegExp(ROUTES.accountPage.pattern));

				// Convert date from dd/mm/yyyy to yyyy-mm-dd for verification
				const [day, month, year] = testDateOfBirth.split('/');
				const dateFormatted = `${year}-${month}-${day}`;

				// Verify all field values match the registration data
				const userExtraFieldsPage2 = new UserExtraFieldsPage(freshPage);
				await userExtraFieldsPage2.expectAllFieldValues({
					name: testUserName,
					email: testUserEmail,
					dateOfBirth: dateFormatted,
					gender: testGender,
					country: testCountry,
					postalCode: testPostalCode,
					phoneNumber: testPhoneNumber,
					location: testLocation
				});

				console.log('All field values verified successfully');

				// Transfer the logged-in session to the main page context
				// Get cookies from fresh context
				const cookies = await freshContext.cookies();

				// Add cookies to the main page context
				await page.context().addCookies(cookies);

				// Close fresh context (the main page now has the logged-in session)
				await freshContext.close();

				// Navigate to home in the main page to activate the session
				await page.goto('/');
			});
		});
	});

	test.describe('Alternative flow: Field validation fails', () => {
		test('should display validation errors when submitting invalid or missing required data', async ({
			page,
			browser
		}) => {
			await test.step('1. User: Register an account into the platform', async () => {
				// Navigate to the registration page
				await page.goto(ROUTES.signupPage.pattern);

				console.log('Navigated to registration page');

				// Verify we're on the registration page
				await expect(page).toHaveURL(new RegExp(ROUTES.signupPage.pattern));
			});

			await test.step('2. System: Displays registration form with additional personal information as configured by the administrator', async () => {
				// Verify all registration form fields are visible
				await signUpPage.expectAllFieldsToBeVisible();

				console.log('All registration form fields are visible');
			});

			await test.step('3. User: Submits the form with missing or invalid data in required fields', async () => {
				// Fill basic fields (with invalid email and missing extra fields)
				await signUpPage.fillName(testUserName);
				await signUpPage.fillEmail('invalidemail.com');
				await signUpPage.fillPassword(testUserPassword);

				// Accept newsletter only (leave terms and conditions unchecked)
				await signUpPage.checkNewsletterSubscription();

				// Submit registration (validation should fail)
				await signUpPage.submitRegistration();

				console.log('Registration form submitted with invalid/missing data');
			});

			await test.step('4. System: Highlights the incorrect or incomplete fields and displays error messages explaining the issues.', async () => {
				// Verify validation errors for invalid/missing fields
				const fieldsWithErrors = [
					'registration_user_email',
					'registration_user_date_of_birth',
					'registration_user_gender',
					'registration_user_postal_code',
					'registration_user_location'
				];

				for (const fieldId of fieldsWithErrors) {
					await signUpPage.expectFieldValidationError(fieldId);
				}

				console.log('Validation errors displayed for missing/invalid fields');

				// Now correct the fields but leave terms unchecked to verify terms validation
				await signUpPage.fillEmail(testUserEmail);
				await signUpPage.fillPassword(testUserPassword);
				await signUpPage.fillDateOfBirth(testDateOfBirth);
				await signUpPage.selectGender(testGender);
				await signUpPage.selectCountry(testCountry);
				await signUpPage.fillPostalCode(testPostalCode);
				await signUpPage.fillPhoneNumber(testPhoneNumber);
				await signUpPage.fillLocation(testLocation);

				console.log('Fields corrected except terms and conditions');

				// Submit again to trigger terms checkbox validation
				await signUpPage.submitRegistration();

				// Verify the error alert message is still displayed
				await expect(page.getByText('There was a problem creating your account.')).toBeVisible();

				// Now verify terms and conditions checkbox validation error
				await signUpPage.expectTermsCheckboxValidationError();

				console.log('Terms and conditions validation error displayed');
			});

			await test.step('5. User: Corrects the errors and resubmits the form', async () => {
				// Re-fill password (it was cleared after submit)
				await signUpPage.fillPassword(testUserPassword);

				// Accept terms and conditions (all other fields are already correct from step 4)
				await signUpPage.checkTermsAndConditions();

				console.log('All validation errors corrected with valid data');

				// Submit registration again (should succeed now)
				await signUpPage.submitRegistration();

				// Verify redirect to home page
				await homePage.expectToBeOnHomePage();

				console.log('Registration completed successfully after correction');
			});

			await test.step('6. System: Confirms successful data submission', async () => {
				// Navigate to Letter Opener to check confirmation email
				await letterOpenerPage.navigateToLetterOpener();
				console.log('Navigated to Letter Opener');

				// Refresh emails to get the latest confirmation email
				await letterOpenerPage.refreshEmails();
				console.log('Refreshed emails in Letter Opener');

				// Find and click on the most recent account registration confirmation email
				await letterOpenerPage.clickMostRecentAccountRegistrationEmail();
				console.log('Opened confirmation instructions email');

				// Get the confirmation URL using the POM method
				const confirmationUrl = await letterOpenerPage.getConfirmMyAccountUrl();

				const freshContext = await browser.newContext();
				const freshPage = await freshContext.newPage();

				// Navigate to confirmation URL in the fresh context
				await freshPage.goto(confirmationUrl, { waitUntil: 'networkidle' });

				// Verify email confirmation success message in fresh context
				const homePage2 = new HomePage(freshPage);
				await homePage2.expectToBeOnHomePage();

				await expect(freshPage.getByText('Your email address has been successfully confirmed')).toBeVisible();
				console.log('Email confirmation success message displayed');

				// Navigate to account page to verify all fields were saved correctly
				await freshPage.goto(ROUTES.accountPage.pattern);
				console.log('Navigated to account page');

				// Verify we're on the account page
				await expect(freshPage).toHaveURL(new RegExp(ROUTES.accountPage.pattern));

				// Convert date from dd/mm/yyyy to yyyy-mm-dd for verification
				const [day, month, year] = testDateOfBirth.split('/');
				const dateFormatted = `${year}-${month}-${day}`;

				// Verify all field values match the registration data
				const userExtraFieldsPage2 = new UserExtraFieldsPage(freshPage);
				await userExtraFieldsPage2.expectAllFieldValues({
					name: testUserName,
					email: testUserEmail,
					dateOfBirth: dateFormatted,
					gender: testGender,
					country: testCountry,
					postalCode: testPostalCode,
					phoneNumber: testPhoneNumber,
					location: testLocation
				});

				console.log('All field values verified successfully');

				// Transfer the logged-in session to the main page context
				// Get cookies from fresh context
				const cookies = await freshContext.cookies();

				// Add cookies to the main page context
				await page.context().addCookies(cookies);

				// Close fresh context (the main page now has the logged-in session)
				await freshContext.close();

				// Navigate to home in the main page to activate the session
				await page.goto('/');
			});
		});
	});
});
