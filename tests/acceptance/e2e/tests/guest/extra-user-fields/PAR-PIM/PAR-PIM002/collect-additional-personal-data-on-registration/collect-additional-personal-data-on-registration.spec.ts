/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Simone Bianchelli
 * Antonio Abramo Carotenuto
 */

import { test } from '@fixtures/parallel-test-reserved';
import { expect } from '@playwright/test';
import { ExtraUserFieldsTestDataGenerator } from '@fixtures/extra-user-fields-fixtures';
import { WebmailPage } from '@pages/base/WebmailPage';
import { HomePage } from '@pages/pages/public/HomePage';
import { SignUpPage } from '@pages/pages/public/SignUpPage';
import { UserExtraFieldsPage } from '@pages/pages/user/account/UserExtraFieldsPage';
import { AccountDeletionPage } from '@pages/pages/user/account/AccountDeletionPage';
import { ROUTES } from '@utils/routes';
import * as fs from 'fs';
import * as path from 'path';
import { tmpdir } from 'os';

/**
 * Defines how citizens must provide additional personal information during their registration process, ensuring their profile is complete and ready for full participation on the platform.
 * User Story: As a Citizen registering into the platform, I want to provide additional personal information as required so that my profile is complete for full participation.
 *
 * Requirements associated: PAR R1, PAR R2
 *
 * Prerequisites:
 * - The administrator has configured additional personal data fields.
 */

test.describe('@reserved [PAR-PIM002] – Collect additional personal data on registration', () => {
	test.describe.configure({ mode: 'serial' });

	// Force fresh unauthenticated context for the registration page
	test.use({ storageState: { cookies: [], origins: [] } });

	// Fixed email account used for registration
	const testUserEmail = process.env.OVH_USER4_EMAIL ?? '';
	// Password used when registering on Decidim
	const testUserPassword = 'decidim123456789';

	// Variables for test data - Basic fields
	let testUserName: string;

	// Variables for test data - Extra fields
	let testDateOfBirth: string;
	let testGender: string;
	let testCountry: string;
	let testPostalCode: string;
	let testPhoneNumber: string;
	let testLocation: string;

	let homePage: HomePage;
	let signUpPage: SignUpPage;
	let webmailPage: WebmailPage;

	test.beforeEach(async ({ page }) => {
		// Generate unique test user data
		const timestamp = Date.now().toString().slice(-8);
		testUserName = `TestUser${timestamp}`;

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
		webmailPage = new WebmailPage(page);

		await homePage.navigateToHomePage();
	});

	test.afterEach(async ({ browser }) => {
		await test.step('Cleanup: Delete test user account', async () => {
			try {
				const cleanupContext = await browser.newContext();
				const cleanupPage = await cleanupContext.newPage();

				console.log('Starting cleanup: logging in to delete test user account...');

				await cleanupPage.goto('/users/sign_in');
				await cleanupPage.getByRole('textbox', { name: 'Email' }).fill(testUserEmail);
				await cleanupPage.getByRole('textbox', { name: 'Password' }).fill(testUserPassword);
				await cleanupPage.getByRole('button', { name: 'Log in' }).click();

				// Wait for the page to fully settle after login (redirect on success, same page on failure)
				await cleanupPage.waitForLoadState('networkidle');

				// Verify if login was successful
				const currentUrl = cleanupPage.url();

				if (!currentUrl.includes('/users/sign_in')) {
					// Login succeeded (account confirmed) — delete via self-service account deletion
					console.log('Logged in successfully for cleanup');

					await cleanupPage.goto(ROUTES.accountDeletePage.pattern);

					const accountDeletionPage = new AccountDeletionPage(cleanupPage);
					await accountDeletionPage.fillDeleteReason('Test cleanup - automated test user deletion');
					await accountDeletionPage.clickDeleteAccountButton();
					await accountDeletionPage.waitForConfirmationModal();
					await accountDeletionPage.confirmDeletion();

					const cleanupHomePage = new HomePage(cleanupPage);
					await cleanupHomePage.expectToBeOnHomePage();
					await expect(cleanupPage.getByText('Your account was successfully deleted.')).toBeVisible();

					console.log(`User account deleted successfully: ${testUserName} (${testUserEmail})`);
				} else {
					// Login failed — account may not exist, or email is not yet confirmed.
					// Try to confirm the account via webmail, then retry login and delete.
					console.log(
						'User login failed (account may not exist or email not confirmed). Trying webmail confirmation fallback...'
					);

					const webmailFallback = new WebmailPage(cleanupPage);
					await webmailFallback.navigateToWebmail();
					await webmailFallback.login(process.env.OVH_USER4_EMAIL!, process.env.OVH_USER4_PASSWORD!);

					// getConfirmationLinkIfExists finds the email regardless of read/unread status,
					// waits properly for the iframe link, and deletes the email internally.
					const confirmationUrl = await webmailFallback.getConfirmationLinkIfExists();

					if (!confirmationUrl) {
						console.log(
							'No confirmation email found in webmail — account likely does not exist, skipping cleanup'
						);
						await cleanupContext.close();
						return;
					}

					// Open the confirmation link in a separate page
					const confirmPage = await cleanupContext.newPage();
					await confirmPage.goto(confirmationUrl, { waitUntil: 'networkidle' });
					await expect(
						confirmPage.getByText('Your email address has been successfully confirmed')
					).toBeVisible();
					await confirmPage.close();
					console.log('Account confirmed via webmail link');

					// confirmPage and cleanupPage share cleanupContext — Decidim auto-logs in on
					// confirmation, so the session cookie is already set. Go straight to deletion.
					console.log('Session already authenticated via confirmation. Proceeding with account deletion...');

					await cleanupPage.goto(ROUTES.accountDeletePage.pattern);

					const accountDeletionPageFallback = new AccountDeletionPage(cleanupPage);
					await accountDeletionPageFallback.fillDeleteReason('Test cleanup - automated test user deletion');
					await accountDeletionPageFallback.clickDeleteAccountButton();
					await accountDeletionPageFallback.waitForConfirmationModal();
					await accountDeletionPageFallback.confirmDeletion();

					const cleanupHomePage2 = new HomePage(cleanupPage);
					await cleanupHomePage2.expectToBeOnHomePage();
					await expect(cleanupPage.getByText('Your account was successfully deleted.')).toBeVisible();

					console.log(`User account deleted successfully after confirmation: ${testUserEmail}`);
				}

				await cleanupContext.close();
				console.log('Cleanup context closed');
			} catch (error: unknown) {
				console.error(
					`Failed to delete test user account: ${testUserName} (${testUserEmail})`,
					error instanceof Error ? error.message : String(error)
				);
				console.log('This is expected if the test failed before account creation');
			}
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
				// Navigate to OVH webmail and log in
				await webmailPage.navigateToWebmail();
				await webmailPage.login(process.env.OVH_USER4_EMAIL!, process.env.OVH_USER4_PASSWORD!);
				console.log(`Logged in to OVH webmail as: ${testUserEmail}`);

				// Wait for the confirmation email to arrive and open it
				await webmailPage.waitForConfirmationEmailAndOpen();
				console.log('Confirmation email arrived and opened successfully');

				// Extract the confirmation link from the email
				const confirmationUrl = await webmailPage.getConfirmationLink();
				console.log('Extracted confirmation link from email');

				// Delete the email from the webmail inbox to keep it clean
				await webmailPage.deleteCurrentEmail();
				console.log('Confirmation email deleted from OVH inbox');

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

				await freshContext.close();
			});
		});
	});

	test.describe('Alternative flow: Field validation fails', () => {
		let invalidProfilePicturePath: string;
		let validProfilePicturePath: string;

		test.beforeEach(async () => {
			const tempDir = tmpdir();

			// Create invalid .txt file
			invalidProfilePicturePath = path.join(tempDir, `invalid-profile-${Date.now()}.txt`);
			fs.writeFileSync(invalidProfilePicturePath, 'This is not a valid image file');
			console.log(`Created invalid profile picture file: ${invalidProfilePicturePath}`);

			// Create valid 1x1 PNG image (minimal valid PNG)
			validProfilePicturePath = path.join(tempDir, `valid-profile-${Date.now()}.png`);

			// Minimal valid PNG file (1x1 transparent pixel)
			const pngBuffer = Buffer.from([
				0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, 0x00,
				0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00,
				0x00, 0x00, 0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01,
				0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82
			]);

			fs.writeFileSync(validProfilePicturePath, pngBuffer);
			console.log(`Created valid profile picture file: ${validProfilePicturePath}`);
		});

		test.afterEach(async () => {
			// Clean up: delete both test files after the test
			try {
				if (invalidProfilePicturePath && fs.existsSync(invalidProfilePicturePath)) {
					fs.unlinkSync(invalidProfilePicturePath);
					console.log(`Deleted invalid profile picture file: ${invalidProfilePicturePath}`);
				}
				if (validProfilePicturePath && fs.existsSync(validProfilePicturePath)) {
					fs.unlinkSync(validProfilePicturePath);
					console.log(`Deleted valid profile picture file: ${validProfilePicturePath}`);
				}
			} catch (error) {
				console.error(`Failed to delete test files:`, error instanceof Error ? error.message : String(error));
			}
		});

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
				// Get invalid data from fixtures
				const invalidData = ExtraUserFieldsTestDataGenerator.generateInvalidUserData();
				const maxLengthData = ExtraUserFieldsTestDataGenerator.generateInvalidUserDataMaxLength();

				// Fill basic fields + extra fields (with missing/invalid data)
				await signUpPage.fillName(testUserName);
				await signUpPage.fillEmail('invalidemail.com');
				await signUpPage.fillPassword(testUserPassword);

				await signUpPage.fillDateOfBirth(invalidData.dateOfBirth!);

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
					'registration_user_phone_number',
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
				// Navigate to OVH webmail and log in
				await webmailPage.navigateToWebmail();
				await webmailPage.login(process.env.OVH_USER4_EMAIL!, process.env.OVH_USER4_PASSWORD!);
				console.log(`Logged in to OVH webmail as: ${testUserEmail}`);

				// Wait for the confirmation email to arrive and open it
				await webmailPage.waitForConfirmationEmailAndOpen();
				console.log('Confirmation email arrived and opened successfully');

				// Extract the confirmation link from the email
				const confirmationUrl = await webmailPage.getConfirmationLink();
				console.log('Extracted confirmation link from email');

				// Delete the email from the webmail inbox to keep it clean
				await webmailPage.deleteCurrentEmail();
				console.log('Confirmation email deleted from OVH inbox');

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

				// Fill with invalid URL
				await userExtraFieldsPage2.fillPersonalUrl('invalidurl');

				// Verify field shows as invalid (red border)
				await userExtraFieldsPage2.expectPersonalUrlInvalid();
				console.log('Personal URL validation error correctly displayed for invalid URL');

				// Clear and fill with valid URL
				await userExtraFieldsPage2.fillPersonalUrl('https://example.org');

				// Verify field shows as valid (no red border)
				await userExtraFieldsPage2.expectPersonalUrlValid();
				console.log('Personal URL validation passed for valid URL');

				// Click Add image button to open upload modal
				await userExtraFieldsPage2.clickAddImage();

				// Upload invalid file (txt file)
				await userExtraFieldsPage2.uploadProfilePicture(invalidProfilePicturePath);

				// Verify validation error is displayed
				await userExtraFieldsPage2.expectProfilePictureValidationError();
				console.log('Profile picture validation error correctly displayed for invalid file type');

				// Remove the invalid file before uploading a valid one
				await userExtraFieldsPage2.clickRemoveInvalidFile();
				console.log('Invalid profile picture removed');

				// Now upload valid image file
				await userExtraFieldsPage2.uploadProfilePicture(validProfilePicturePath);
				console.log('Valid profile picture uploaded successfully');

				// Click Save button to close the modal
				await userExtraFieldsPage2.clickSaveProfilePicture();

				// Verify the profile picture was uploaded successfully
				await userExtraFieldsPage2.expectProfilePictureUploaded();
				console.log('Profile picture upload verified in user profile');

				console.log('All field values verified successfully');

				await freshContext.close();
			});
		});
	});
});
