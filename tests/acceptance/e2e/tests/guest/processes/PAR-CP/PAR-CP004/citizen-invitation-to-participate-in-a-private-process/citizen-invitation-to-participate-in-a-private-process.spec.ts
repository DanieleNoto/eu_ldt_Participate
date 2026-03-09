/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Simone Bianchelli
 */

import { test, expect } from '@fixtures/parallel-test-reserved';
import { NewPrivateParticipantFormPage } from '@pages/pages/admin/processes/detail/private-participants/NewParticipantsPage';
import { SidebarProcessDetailComponent } from '@pages/components/admin/process/detail/SidebarProcessDetailComponent';
import { PrivateParticipantsPage } from '@pages/pages/admin/processes/detail/private-participants/PrivateParticipantsPage';
import { TempWebmailPage } from '@pages/base/TempWebmailPage';
import { HomePage } from '@pages/pages/public/HomePage';
import { ProcessesOverviewPage } from '@pages/pages/public/processes/ProcessesOverviewPage';
import { ProcessDetailPage } from '@pages/pages/public/processes/ProcessDetailPage';
import { AcceptInvitationPage } from '@pages/pages/auth/AcceptInvitationPage';
import { BASE_URLS } from '@utils/constants';

/**
 * Allows citizens to receive an invitation to participate in a private process via email, requiring them to accept the invitation to access the process.
 * User Story: As a Citizen, I want to receive an email invitation to participate in a private process and be able to accept it so that I can contribute to the process in a secure and authorized manner.
 * Requirements: PAR R8
 * Prerequisites:
 * - The City Administrator has invited the citizen to the private process.
 */

test.describe.configure({ mode: 'serial' });

test.describe('[PAR-CP004] – Citizen invitation to participate in a private process @reserved', () => {
	// Don't use storageState here because we need to simulate a new unregistered user
	// The user will be authenticated only after completing the registration in step 4

	// Use existing process
	const processSlug = 'test-private';
	const processTitle = 'Update Test0 private';
	const processEditUrl = `${BASE_URLS.USED}/admin/participatory_processes/${processSlug}/edit`;

	// Variables for the invited user data
	let testUserName: string = '';
	let testUserEmail: string = '';

	// Page Objects (only for User test)
	let homePage: HomePage;
	let processesOverviewPage: ProcessesOverviewPage;
	let processDetailPage: ProcessDetailPage;
	let tempwebmailPage: TempWebmailPage;
	let acceptInvitationPage: AcceptInvitationPage;

	test.beforeEach(async ({ page, adminPage }) => {
		// Use adminPage from reserved fixture for setup
		const newPrivateParticipantFormPage = new NewPrivateParticipantFormPage(adminPage);
		const sidebarProcessDetailComponent = new SidebarProcessDetailComponent(adminPage);
		const privateParticipantsPage = new PrivateParticipantsPage(adminPage);

		// Setup: Add private participant invitation as prerequisite
		await test.step('Setup: Send invitation to a citizen as prerequisite', async () => {
			// Navigate to the process edit page
			await adminPage.goto(processEditUrl);
			await adminPage.waitForLoadState('networkidle');

			// Navigate to private participants section using existing component
			await sidebarProcessDetailComponent.navigateToPrivateParticipants();

			// Click on "New private user" using existing page object
			await privateParticipantsPage.clickNewPrivateUser();

			// Verify we're on the correct page
			await newPrivateParticipantFormPage.expectToBeOnNewPrivateParticipantsPage();

			// Fill the invitation form for a non-registered user with unique data
			const timestamp = Date.now().toString().slice(-8); // Use last 8 digits to keep name short
			testUserName = `User${timestamp}`;
			testUserEmail = `user${timestamp}@mailinator.com`;

			await newPrivateParticipantFormPage.fillName(testUserName);
			await newPrivateParticipantFormPage.fillEmail(testUserEmail);
			await newPrivateParticipantFormPage.submitForm();

			console.log(`Invitation sent to: ${testUserName} (${testUserEmail})`);

			// Verify the invitation was created successfully - should be back on private participants page
			await privateParticipantsPage.expectToBeOnPrivateParticipantsPage();

			// Verify the new participant appears in the table
			await privateParticipantsPage.expectParticipantIsInTable(testUserName, testUserEmail);

			console.log('Citizen invitation sent successfully');
		});

		// Initialize Page Objects for a NEW unregistered user (using page without auth)
		homePage = new HomePage(page);
		processesOverviewPage = new ProcessesOverviewPage(page);
		processDetailPage = new ProcessDetailPage(page);
		tempwebmailPage = new TempWebmailPage(page);
		acceptInvitationPage = new AcceptInvitationPage(page);

		await homePage.navigateToHomePage();
	});

	test.describe('Main Flow', () => {
		test('Citizen invitation to participate in a private process', async ({ page }) => {
			await test.step('1. User: Receives an email invitation to participate in a private process', async () => {
				// Navigate to temporary webmail inbox
				await tempwebmailPage.navigateToTempInbox(testUserEmail);
				await page.waitForLoadState('load');
				console.log(`Navigated to temp inbox for: ${testUserEmail}`);

				// Wait for the invitation email to arrive
				await tempwebmailPage.waitForEmailToArrive();
				console.log('Invitation email arrived successfully!');
			});

			await test.step('2. User: Opens the email and clicks on the "Accept Invitation" button/link', async () => {
				// Click on the invitation email with specific subject
				await tempwebmailPage.clickInvitationEmail();
				await page.waitForLoadState('load');
				console.log('Clicked on invitation email');

				// Verify the email content (greeting) and click on "Accept invitation" link
				await tempwebmailPage.verifyInvitationEmailAndAccept(testUserName);
				await page.waitForLoadState('load');
				console.log('Email content verified and "Accept invitation" link clicked');
			});

			await test.step("3. User: Redirects the citizen to the platform's registration page", async () => {
				// Verify we are on the accept invitation page
				await acceptInvitationPage.expectToBeOnAcceptInvitationPage();
				console.log('Successfully redirected to invitation acceptance page');

				// Verify the page title
				await acceptInvitationPage.verifyPageTitle();
				console.log('Page title verified: "Finish creating your account"');

				// Verify that the nickname field is pre-filled with the name from invitation (in lowercase)
				await acceptInvitationPage.verifyNicknamePrefilled(testUserName);
				const currentNickname = await acceptInvitationPage.getNicknameValue();
				console.log(
					`Verified nickname "${currentNickname}" matches invited user name "${testUserName}" (converted to lowercase)`
				);

				// Verify that the invitation token is present in the form (hidden field)
				await acceptInvitationPage.verifyInvitationTokenPresent();
				console.log('Invitation token verified in the form (hidden field)');
			});

			await test.step('4. User: Citizen finish the account creation', async () => {
				// Fill the password field with a secure password
				const password = 'decidim123456789';
				await acceptInvitationPage.fillPassword(password);
				console.log('Password field filled');

				// Accept the terms of service
				await acceptInvitationPage.acceptTermsOfService();
				console.log('Terms of service accepted');

				// Verify terms of service is checked
				await acceptInvitationPage.verifyTermsOfServiceAccepted();

				// Click Save to complete the registration
				await acceptInvitationPage.clickSave();
				console.log('Registration form submitted');

				// Wait for the page to load after registration
				await page.waitForLoadState('load');
				console.log('Account creation completed successfully');
			});

			await test.step('5. User: Citizen is redirected to homepage', async () => {
				// Verify that the user is redirected to the homepage after successful registration
				await homePage.expectToBeOnHomePage();
				console.log('Successfully redirected to homepage after account creation');
			});

			await test.step('6. User: Navigate to the processes section and finds the private process', async () => {
				// Navigate to the processes overview page
				await processesOverviewPage.navigateToProcessesOverview();
				await processesOverviewPage.expectToBeOnProcessesOverviewPage();
				console.log('Navigated to processes overview page');

				// Apply "All" filter and ensure grid is fully loaded (with refresh)
				await processesOverviewPage.applyDateFilterAndEnsureGridLoaded('all');

				// Check if the private process is visible in the grid
				await processesOverviewPage.checkProcessVisibility(processTitle);
			});

			await test.step('7. User: Citizen navigate to the private process invited to', async () => {
				// Navigate to the process: grid click first, then direct navigation fallback
				await processesOverviewPage.navigateToProcess(processTitle, processSlug);
			});

			await test.step('8. System: Displays the details of the private process and confirms successful acceptance of the invitation', async () => {
				// Verify we are on a process detail page
				await processDetailPage.expectToBeOnValidProcessDetailPage();
				console.log(`Successfully navigated to process detail page: ${page.url()}`);

				// Verify the process title matches the expected title
				const displayedTitle = (await processDetailPage.getProcessTitle()).trim();
				const expectedTitle = processTitle;
				expect(displayedTitle).toBe(expectedTitle);
				console.log(`Verified process title: "${displayedTitle}"`);

				// Verify that this is a private process
				await processDetailPage.expectToBePrivateProcess();
				console.log('Verified that this is a private process');

				console.log('Successfully confirmed access to private process - invitation acceptance completed!');
			});
		});
	});
});
