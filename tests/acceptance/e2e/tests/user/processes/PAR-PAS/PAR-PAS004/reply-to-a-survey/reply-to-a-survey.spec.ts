import test, { expect } from '@playwright/test';
import { ProcessTestDataGenerator } from '@fixtures/process-fixtures';

// ADMIN Page Objects (only for the setup in beforeEach)
import { AdminHomePage } from '@pages/pages/admin/AdminHomePage';
import { ProcessAdminPage } from '@pages/pages/admin/processes/ProcessAdminPage';
import { UpdateProcessAdminPage } from '@pages/pages/admin/processes/detail/UpdateProcessAdminPage';
import { ComponentsPage } from '@pages/pages/admin/processes/detail/components/ComponentsPage';
import { SurveysManagePage } from '@pages/pages/admin/processes/detail/components/surveys/SurveysManagePage';

// PUBLIC Page Objects (only for USER test)
import { HomePage } from '@pages/pages/public/HomePage';
import { ProcessesOverviewPage } from '@pages/pages/public/processes/ProcessesOverviewPage';
import { ProcessDetailPage } from '@pages/pages/public/processes/ProcessDetailPage';

import { ensureLoggedIn } from '@utils/auth-helper';
import { STORAGE_STATE } from '@utils/constants';

/**
 * Allows citizens to provide their responses to a survey, enabling participation in decision-making processes and contributing feedback on diverse topics.
 * User Story: As a Citizen, I want to reply to a survey so that I can share my opinions and contribute to the community's decision-making process.
 * Requirements: PAR R16
 * Prerequisites:
 * - The citizen has an active account on the platform and is logged in.
 * - The survey is open for responses and visible to the citizen.
 */
test.beforeAll(async ({ browser }) => {
	const context = await browser.newContext();
	const page = await context.newPage();
	await ensureLoggedIn(page, 'USER');
	await page.close();
	await context.close();
});

test.describe('[PAR-PAS004] – Reply to a survey', () => {
	test.use({ storageState: STORAGE_STATE.USER });

	// Variables for the setup
	let processSlug: string;
	let componentName: string;
	let surveyName: string;
	let validProcessData: any;
	let processEditUrl: string;

	// Public Page Objects (only for USER test)
	let homePage: HomePage;
	let processesOverviewPage: ProcessesOverviewPage;
	let processDetailPage: ProcessDetailPage;
	let publicSurveysPage: SurveysManagePage;

	test.beforeEach(async ({ page, browser }) => {
		const adminContext = await browser.newContext({
			storageState: STORAGE_STATE.ADMIN
		});
		const adminPage = await adminContext.newPage();

		// Verify is logged in as admin
		await ensureLoggedIn(adminPage, 'ADMIN');

		const adminHomePage = new AdminHomePage(adminPage);
		const processAdminPage = new ProcessAdminPage(adminPage);
		const updateProcessAdminPage = new UpdateProcessAdminPage(adminPage);
		const componentsPage = new ComponentsPage(adminPage);
		const surveysManagePage = new SurveysManagePage(adminPage);

		validProcessData = ProcessTestDataGenerator.generateValidProcessData();

		async function setupTestProcess() {
			await test.step('Setup: Create new test process as prerequisite', async () => {
				const { processSlug: slug, processEditUrl: url } = await surveysManagePage.setupTestProcess(
					validProcessData,
					adminHomePage,
					processAdminPage,
					true
				);
				processSlug = slug;
				processEditUrl = url;
			});

			await test.step('Setup: Create a published survey as prerequisite', async () => {
				const surveySetup = await surveysManagePage.setupTestSurvey(
					processSlug,
					processEditUrl,
					updateProcessAdminPage,
					componentsPage
				);

				componentName = surveySetup.componentName;
				surveyName = surveySetup.surveyName;
			});
		}

		await setupTestProcess();

		// Close ADMIN context
		await adminPage.close();
		await adminContext.close();

		// Initialize USER Page Objects
		homePage = new HomePage(page);
		processesOverviewPage = new ProcessesOverviewPage(page);
		processDetailPage = new ProcessDetailPage(page);
		publicSurveysPage = new SurveysManagePage(page);

		// Ensure the page is USER
		await ensureLoggedIn(page, 'USER');
		await homePage.navigateToHomePage();
	});

	test.describe('Main Flow', () => {
		test('Reply to a survey', async ({ page }) => {
			await test.step('1. User: Navigates to the "Processes" section on the platform', async () => {
				await homePage.goToProcessesFromHomeMenu();
			});

			await test.step('2. System: Displays a list of the processes', async () => {
				await processesOverviewPage.waitForPageLoad();
			});

			await test.step('3. User: Select a process that has published surveys', async () => {
				await page.goto(`/processes/${processSlug}`);
				await processDetailPage.waitForPageLoad();
			});

			await test.step('4. System: Displays the details of the selected process, including the title, description, and surveys available.', async () => {
				await publicSurveysPage.verifyProcessDetailsDisplayed(validProcessData, componentName);
			});

			await test.step('5. User: Selects the survey they wish to participate in', async () => {
				await publicSurveysPage.selectSurveyToParticipate(componentName, surveyName);
			});

			await test.step('6. System: Displays the survey form, including questions and response fields', async () => {
				await publicSurveysPage.verifySurveyFormDisplayed();
			});

			await test.step('7. User: Fills in responses for each question in the survey, ensuring that mandatory fields are completed', async () => {
				await publicSurveysPage.fillSurveyResponses();
			});

			await test.step('8. User: Clicks the "Submit" button to complete the survey', async () => {
				await publicSurveysPage.submitSurvey();
			});

			await test.step('9. System: Validates the responses for completeness and correctness', async () => {
				await publicSurveysPage.validateAndConfirmSubmission();
			});

			await test.step('10. System: Saves the responses and displays a confirmation message indicating successful survey submission', async () => {
				await publicSurveysPage.verifySurveySubmissionSuccess();
			});
		});
	});

	test.describe('Alternative Flow: Field/s Validation Fail', () => {
		test('should handle validation errors when submitting empty survey', async ({ page }) => {
			await test.step('1. User: Navigates to the "Processes" section on the platform', async () => {
				await homePage.goToProcessesFromHomeMenu();
			});

			await test.step('2. System: Displays a list of the processes', async () => {
				await processesOverviewPage.waitForPageLoad();
			});

			await test.step('3. User: Select a process that has published surveys', async () => {
				await page.goto(`/processes/${processSlug}`);
				await processDetailPage.waitForPageLoad();
			});

			await test.step('4. System: Displays the details of the selected process, including the title, description, and surveys available.', async () => {
				await publicSurveysPage.verifyProcessDetailsDisplayed(validProcessData, componentName);
			});

			await test.step('5. User: Selects the survey they wish to participate in', async () => {
				await publicSurveysPage.selectSurveyToParticipate(componentName, surveyName);
			});

			await test.step('6. System: Displays the survey form, including questions and response fields', async () => {
				await publicSurveysPage.verifySurveyFormDisplayed();
			});

			await test.step('7. User: Clicks the "Submit" button to complete the survey', async () => {
				await publicSurveysPage.submitSurvey();
			});

			await test.step('8.1 System: Validates the input fields for completeness', async () => {
				await publicSurveysPage.validateAndConfirmSubmission();
			});

			await test.step('8.2 System: Detects missing or invalid fields', async () => {
				await publicSurveysPage.verifySurveyValidationErrors();
			});

			await test.step('8.3 User: Corrects the errors in the input fields', async () => {
				await publicSurveysPage.fillSurveyResponses();
			});

			await test.step('8.4 User: Attempts to save the survey again', async () => {
				await publicSurveysPage.submitSurvey();
			});

			await test.step('8.5 System: Revalidates the corrected fields', async () => {
				await publicSurveysPage.verifySurveySubmissionSuccess();
			});
		});
	});
});
