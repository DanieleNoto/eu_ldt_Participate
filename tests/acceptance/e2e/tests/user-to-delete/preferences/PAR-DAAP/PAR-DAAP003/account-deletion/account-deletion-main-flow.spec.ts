/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Gianfranco Cedro
 * Simone Bianchelli
 */

import { Page, BrowserContext, test, expect } from '@playwright/test';
import { HeaderComponent } from '@pages/components/common/HeaderComponent';
import { HomePage } from '@pages/pages/public/HomePage';
import { AccountDeletionPage } from '@pages/pages/user/account/AccountDeletionPage';
import { SignUpPage } from '@pages/pages/public/SignUpPage';
import { WebmailPage } from '@pages/base/WebmailPage';
import { ExtraUserFieldsTestDataGenerator } from '@fixtures/extra-user-fields-fixtures';
import { ROUTES } from '@utils/routes';

/**
 * Test suite for Enables citizens to request the deletion of their personal account.
 *
 * User Story:
 * As a Citizen, I want to request the deletion of my personal data so that I can exercise my right to be forgotten.
 *
 * Requirements: PAR R3e
 *
 * Prerequisites:
 * - The citizen has an active account on the platform.
 * - The citizen is logged into the platform.
 */

test.describe('@reserved [PAR-DAAP003] – Request deletion of personal account', () => {
	test.describe.configure({ mode: 'serial' });

	// Fixed email account used for registration
	const testUserEmail = process.env.OVH_USER3_EMAIL ?? '';
	// Password used when registering on Decidim
	const testUserPassword = 'decidim123456789';

	let testUserName: string;

	// Page and context for the confirmed/logged-in user session
	let confirmedContext: BrowserContext;
	let confirmedPage: Page;

	// Page objects bound to the confirmed session
	let homePage: HomePage;
	let accountDeletionPage: AccountDeletionPage;
	let headerComponent: HeaderComponent;

	test.beforeEach(async ({ browser }) => {
		const timestamp = Date.now().toString().slice(-8);
		testUserName = `TestUser${timestamp}`;

		const extraFieldsData = ExtraUserFieldsTestDataGenerator.generateValidUserData(timestamp);

		// Step 1: Register the user
		const registrationContext = await browser.newContext();
		const registrationPage = await registrationContext.newPage();
		const signUpPage = new SignUpPage(registrationPage);
		const registrationHomePage = new HomePage(registrationPage);

		await registrationHomePage.navigateToHomePage();
		await registrationPage.goto(ROUTES.signupPage.pattern);

		await signUpPage.fillName(testUserName);
		await signUpPage.fillEmail(testUserEmail);
		await signUpPage.fillPassword(testUserPassword);
		await signUpPage.fillDateOfBirth(extraFieldsData.dateOfBirth!);
		await signUpPage.selectGender(extraFieldsData.gender!);
		await signUpPage.selectCountry(extraFieldsData.country!);
		await signUpPage.fillPostalCode(extraFieldsData.postalCode!);
		await signUpPage.fillPhoneNumber(extraFieldsData.phoneNumber!);
		await signUpPage.fillLocation(extraFieldsData.location!);
		await signUpPage.checkTermsAndConditions();
		await signUpPage.checkNewsletterSubscription();
		await signUpPage.submitRegistration();
		await registrationHomePage.expectToBeOnHomePage();

		await registrationContext.close();
		console.log(`User registered: ${testUserName} (${testUserEmail})`);

		// Step 2: Retrieve the confirmation link from OVH webmail
		const webmailContext = await browser.newContext();
		const webmailRawPage = await webmailContext.newPage();
		const webmailPage = new WebmailPage(webmailRawPage);

		await webmailPage.navigateToWebmail();
		await webmailPage.login(process.env.OVH_USER3_EMAIL!, process.env.OVH_USER3_PASSWORD!);
		await webmailPage.waitForConfirmationEmailAndOpen();
		const confirmationUrl = await webmailPage.getConfirmationLink();
		await webmailPage.deleteCurrentEmail();
		await webmailContext.close();
		console.log('Confirmation link retrieved and email deleted from OVH inbox');

		// Step 3: Confirm account — Decidim logs the user in automatically after confirmation
		confirmedContext = await browser.newContext();
		confirmedPage = await confirmedContext.newPage();
		await confirmedPage.goto(confirmationUrl, { waitUntil: 'networkidle' });
		await expect(confirmedPage.getByText('Your email address has been successfully confirmed')).toBeVisible();
		console.log(`Account confirmed — user ${testUserName} is now logged in automatically`);

		// Initialize page objects on the confirmed session
		homePage = new HomePage(confirmedPage);
		accountDeletionPage = new AccountDeletionPage(confirmedPage);
		headerComponent = new HeaderComponent(confirmedPage);

		await homePage.navigateToHomePage();
	});

	test.afterEach(async ({ browser }) => {
		// Always close the confirmed context first
		await confirmedContext?.close().catch(() => null);

		// Safety cleanup: handle all failure scenarios to unblock the next test run.
		const cleanupContext = await browser.newContext();
		const cleanupPage = await cleanupContext.newPage();

		try {
			await cleanupPage.goto('/users/sign_in');
			await cleanupPage.getByRole('textbox', { name: 'Email' }).fill(testUserEmail);
			await cleanupPage.getByRole('textbox', { name: 'Password' }).fill(testUserPassword);
			await cleanupPage.getByRole('button', { name: 'Log in' }).click();
			await cleanupPage.waitForLoadState('networkidle');

			if (cleanupPage.url().includes('/users/sign_in')) {
				// Login failed — either account was already deleted (happy path)
				// or account exists but was never confirmed (beforeEach failed during webmail step).
				console.log('Cleanup: login failed — checking if account is unconfirmed...');

				const webmailContext = await browser.newContext();
				const webmailRawPage = await webmailContext.newPage();
				const webmailPage = new WebmailPage(webmailRawPage);
				let confirmationUrl: string | null = null;

				try {
					await webmailPage.navigateToWebmail();
					await webmailPage.login(process.env.OVH_USER3_EMAIL!, process.env.OVH_USER3_PASSWORD!);
					confirmationUrl = await webmailPage.getConfirmationLinkIfExists();
				} finally {
					await webmailContext.close();
				}

				if (confirmationUrl) {
					// Account registered but not confirmed — confirm it so we can log in, then delete.
					console.log('Cleanup: unconfirmed account detected — confirming account now...');
					await cleanupPage.goto(confirmationUrl, { waitUntil: 'networkidle' });
					// Decidim logs the user in automatically after confirmation.

					await cleanupPage.goto(ROUTES.accountDeletePage.pattern);
					const cleanupAccountDeletionPage = new AccountDeletionPage(cleanupPage);
					await cleanupAccountDeletionPage.fillDeleteReason('Test cleanup - automated test user deletion');
					await cleanupAccountDeletionPage.clickDeleteAccountButton();
					await cleanupAccountDeletionPage.waitForConfirmationModal();
					await cleanupAccountDeletionPage.confirmDeletion();

					await expect(cleanupPage.getByText('Your account was successfully deleted.')).toBeVisible();
					console.log(
						`Cleanup: unconfirmed account confirmed and deleted: ${testUserName} (${testUserEmail})`
					);
				} else {
					// No confirmation email found — account was already deleted by the test (happy path).
					console.log('Cleanup: account already deleted by the test — nothing to do');
				}
			} else {
				// Login succeeded — test failed before deletion, clean up now
				console.log('Cleanup: test failed before account deletion — deleting account now...');

				await cleanupPage.goto(ROUTES.accountDeletePage.pattern);

				const cleanupAccountDeletionPage = new AccountDeletionPage(cleanupPage);
				await cleanupAccountDeletionPage.fillDeleteReason('Test cleanup - automated test user deletion');
				await cleanupAccountDeletionPage.clickDeleteAccountButton();
				await cleanupAccountDeletionPage.waitForConfirmationModal();
				await cleanupAccountDeletionPage.confirmDeletion();

				await expect(cleanupPage.getByText('Your account was successfully deleted.')).toBeVisible();
				console.log(`Cleanup: account deleted successfully: ${testUserName} (${testUserEmail})`);
			}
		} catch (error: unknown) {
			console.error(
				`Cleanup: failed to delete account: ${testUserName} (${testUserEmail})`,
				error instanceof Error ? error.message : String(error)
			);
		} finally {
			await cleanupContext.close();
		}
	});

	test.describe('Main flow', () => {
		test('should successfully delete account with confirmation', async () => {
			await test.step('1. User: Navigates to their "Account Settings" section within the platform.', async () => {
				await accountDeletionPage.navigateToMyAccount();
			});

			await test.step('2. System: Displays options related to data management, including data deletion.', async () => {
				await accountDeletionPage.verticalTabsComponent.isTabsListVisible();
				await accountDeletionPage.verticalTabsComponent.isDeleteAccountTabVisible();
			});

			await test.step('3. User: Selects the option labelled "Delete my account"', async () => {
				await accountDeletionPage.navigateToAccountDeletion();
				await accountDeletionPage.waitForPageLoad();
			});

			await test.step('4. System: Presents information explaining the consequences of deleting personal data, including loss of access to the account and services', async () => {
				await accountDeletionPage.verifyPageElements();
				await accountDeletionPage.verifyWarningMessage();
			});

			await test.step('5. User: Reviews the information and confirms the desire to proceed with the deletion request.', async () => {
				const deletionReason = 'I no longer wish to use this account';
				await accountDeletionPage.fillDeleteReason(deletionReason);
				await accountDeletionPage.clickDeleteAccountButton();
			});

			await test.step('Result.', async () => {
				// Wait for confirmation modal and verify its content
				await accountDeletionPage.waitForConfirmationModal();
				await accountDeletionPage.verifyModalContent();
				await accountDeletionPage.verifyModalAccessibility();

				// Confirm deletion — account is permanently removed
				await accountDeletionPage.confirmDeletion();

				// Verify user is logged out after account deletion
				await expect(headerComponent.isUserLoggedIn()).resolves.toBe(false);
			});
		});
	});
});
