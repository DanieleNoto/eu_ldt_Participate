import test, { expect } from '@playwright/test';
import { ProcessTestDataGenerator } from '@fixtures/process-fixtures';

// ADMIN Page Objects (only for the setup in beforeEach)
import { AdminHomePage } from '@pages/pages/admin/AdminHomePage';
import { ProcessAdminPage } from '@pages/pages/admin/processes/ProcessAdminPage';
import { SurveysManagePage } from '@pages/pages/admin/processes/detail/components/surveys/SurveysManagePage';
import { NewPrivateParticipantFormPage } from '@pages/pages/admin/processes/detail/private-participants/NewParticipantsPage';
import { SidebarProcessDetailComponent } from '@pages/components/admin/process/detail/SidebarProcessDetailComponent';
import { PrivateParticipantsPage } from '@pages/pages/admin/processes/detail/private-participants/PrivateParticipantsPage';
import { LetterOpenerPage } from '@pages/pages/admin/LetterOpenerPage';

// PUBLIC Page Objects (only for USER test)
import { HomePage } from '@pages/pages/public/HomePage';
import { ProcessesOverviewPage } from '@pages/pages/public/processes/ProcessesOverviewPage';
import { ProcessDetailPage } from '@pages/pages/public/processes/ProcessDetailPage';
import { AcceptInvitationPage } from '@pages/pages/auth/AcceptInvitationPage';

import { ensureLoggedIn } from '@utils/auth-helper';
import { STORAGE_STATE } from '@utils/constants';

/**
 * Allows citizens to receive an invitation to participate in a private process via email, requiring them to accept the invitation to access the process.
 * User Story: As a Citizen, I want to receive an email invitation to participate in a private process and be able to accept it so that I can contribute to the process in a secure and authorized manner.
 * Requirements: PAR R8
 * Prerequisites:
 * - The City Administrator has invited the citizen to the private process.
 */

test.describe('[PAR-CP004] – Citizen invitation to participate in a private process', () => {
	// Don't use storageState here because we need to simulate a new unregistered user
	// The user will be authenticated only after completing the registration in step 4

	// Variables for the setup
	let validProcessData: any;
	let processEditUrl: string;
	let processSlug: string;
	let processTitle: string;

	// Variables for the invited user data
	let testUserName: string;
	let testUserEmail: string;

	// Page Objects (only for User test)
	let homePage: HomePage;
	let processesOverviewPage: ProcessesOverviewPage;
	let processDetailPage: ProcessDetailPage;
	let letterOpenerPage: LetterOpenerPage;
	let acceptInvitationPage: AcceptInvitationPage;

	test.beforeEach(async ({ page, browser }) => {
		// Create admin context using existing storage state if available
		const adminContext = await browser.newContext({
			storageState: STORAGE_STATE.ADMIN
		});
		const adminPage = await adminContext.newPage();

		// Ensure admin is logged in
		await ensureLoggedIn(adminPage, 'ADMIN');

		const adminHomePage = new AdminHomePage(adminPage);
		const processAdminPage = new ProcessAdminPage(adminPage);
		const surveysManagePage = new SurveysManagePage(adminPage); // Using SurveysManagePage.setupTestProcess() as helper for process creation
		const newPrivateParticipantFormPage = new NewPrivateParticipantFormPage(adminPage);
		const sidebarProcessDetailComponent = new SidebarProcessDetailComponent(adminPage);
		const privateParticipantsPage = new PrivateParticipantsPage(adminPage);

		validProcessData = ProcessTestDataGenerator.generateValidProcessData();
		processTitle = validProcessData.general.title;

		async function setupTestProcess() {
			await test.step('Setup: Create new test process as prerequisite', async () => {
				const { processSlug: slug, processEditUrl: url } = await surveysManagePage.setupTestProcess(
					validProcessData,
					adminHomePage,
					processAdminPage,
					true, // publish the process
					true // private process
				);
				processEditUrl = url;
				processSlug = slug;
			});
		}

		await setupTestProcess();

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
			testUserEmail = `user${timestamp}@example.org`;

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

		// Close ADMIN context
		await adminPage.close();
		await adminContext.close();

		// Initialize Page Objects for a NEW unregistered user
		homePage = new HomePage(page);
		processesOverviewPage = new ProcessesOverviewPage(page);
		processDetailPage = new ProcessDetailPage(page);
		letterOpenerPage = new LetterOpenerPage(page);
		acceptInvitationPage = new AcceptInvitationPage(page);

		await homePage.navigateToHomePage();
	});

	test.describe('Main Flow', () => {
		test('Citizen invitation to participate in a private process', async ({ page }) => {
			await test.step('1. User: Receives an email invitation to participate in a private process', async () => {
				// Use Letter Opener Page Object to handle email operations
				console.log(`Simulating new user receiving invitation: ${testUserName} (${testUserEmail})`);

				// Navigate to Letter Opener and refresh to get latest emails
				await letterOpenerPage.navigateToLetterOpener();
				await letterOpenerPage.refreshEmails();

				console.log('Letter Opener opened and refreshed. Ready to search for invitation email.');
			});

			await test.step('2. User: Opens the email and clicks on the "Accept Invitation" button/link', async () => {
				// Find and click on the most recent invitation email (should be first after refresh)
				await letterOpenerPage.clickMostRecentInvitationEmail();
				console.log('Invitation email opened');

				// Verify the email content and click on "Accept invitation" link
				await letterOpenerPage.verifyInvitationEmailAndAccept(testUserName);
				console.log('Email content verified and invitation accepted');

				console.log('Navigated to invitation acceptance page');
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
				await page.waitForLoadState('networkidle');
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
