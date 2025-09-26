import test, { expect } from '@playwright/test';
import { ProcessTestDataGenerator } from '@fixtures/process-fixtures';
import { AdminHomePage } from '@pages/pages/admin/AdminHomePage';
import { ProcessAdminPage } from '@pages/pages/admin/processes/ProcessAdminPage';
import { UpdateProcessAdminPage } from '@pages/pages/admin/processes/detail/UpdateProcessAdminPage';
import { ComponentsPage } from '@pages/pages/admin/processes/detail/components/ComponentsPage';
import { SurveysManagePage } from '@pages/pages/admin/processes/detail/components/surveys/SurveysManagePage';
import { LetterOpenerPage } from '@pages/pages/admin/LetterOpenerPage';
import { ensureLoggedIn } from '@utils/auth-helper';
import { STORAGE_STATE } from '@utils/constants';

/**
 * Allows administrators to export survey answers provided by users, enabling data analysis and reporting on user feedback.
 * User Story: As an Administrator, I want to export survey answers so that I can analyse user feedback and generate reports for decision-making purposes.
 * Requirements: PAR R21
 * Prerequisites:
 * - The City Administrator has an active account on the platform and is logged in.
 * - The survey has been completed by users, and responses are available for export.
 */
test.beforeAll(async ({ browser }) => {
	const context = await browser.newContext();
	const page = await context.newPage();
	await ensureLoggedIn(page, 'ADMIN');
	await page.close();
	await context.close();
});

test.describe('[PAR-DE001] – Export survey answers', () => {
	test.use({ storageState: STORAGE_STATE.ADMIN });
	let adminHomePage: AdminHomePage;
	let processAdminPage: ProcessAdminPage;
	let updateProcessAdminPage: UpdateProcessAdminPage;
	let componentsPage: ComponentsPage;
	let surveysManagePage: SurveysManagePage;
	let letterOpenerPage: LetterOpenerPage; //
	let validProcessData: any;
	let processEditUrl: string;

	// Variables for the setup
	let processSlug: string;
	let componentName: string;
	let surveyName: string;

	// Common setup for both flows (only Page Objects)
	test.beforeEach(async ({ page }) => {
		adminHomePage = new AdminHomePage(page);
		processAdminPage = new ProcessAdminPage(page);
		updateProcessAdminPage = new UpdateProcessAdminPage(page);
		componentsPage = new ComponentsPage(page);
		surveysManagePage = new SurveysManagePage(page);
		letterOpenerPage = new LetterOpenerPage(page);
		validProcessData = ProcessTestDataGenerator.generateValidProcessData();
	});

	/**
	 * Setup test environment with responses (for Main Flow)
	 */
	async function setupTestProcessWithResponses(browser: any) {
		await test.step('Setup: Create new test process as prerequisite', async () => {
			const { processSlug: slug, processEditUrl: url } = await surveysManagePage.setupTestProcess(
				validProcessData,
				adminHomePage,
				processAdminPage,
				true // publish the process
			);
			processSlug = slug;
			processEditUrl = url;
			console.log('Test process setup completed');
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

		await test.step('Setup: Create survey responses as prerequisite', async () => {
			const userContext = await browser.newContext({
				storageState: STORAGE_STATE.USER
			});
			const userPage = await userContext.newPage();

			// Handle USER context and login in the test
			await ensureLoggedIn(userPage, 'USER');

			// Create Page Object for USER actions
			const userSurveysPage = new SurveysManagePage(userPage);

			// Execute only the survey actions
			await userSurveysPage.replytoSurvey(processSlug, componentName, surveyName, validProcessData);

			await userPage.close();
			await userContext.close();

			console.log('Survey responses created successfully');
		});
	}

	test.describe('Main Flow', () => {
		test.beforeEach(async ({ browser }) => {
			await setupTestProcessWithResponses(browser);
		});

		test('should export survey answers provided by users', async ({ page }) => {
			await test.step('1. User: Navigates to the "Processes" section.', async () => {
				// Navigate to processes section using admin nav
				await adminHomePage.navigateViaAdminNav('processes');
				await processAdminPage.waitForLoadState('networkidle');

				const isOnProcessesPage = await processAdminPage.isOnProcessesPage();
				expect(isOnProcessesPage).toBe(true);
				console.log('Navigated to Processes section');
			});

			await test.step('2. System: Displays a list of all Processes that the City Administrator has created or has permissions to update.', async () => {
				await processAdminPage.expectToBeOnProcessesAdminPage();
				// Verify processes table is visible and has content
				const hasProcesses = await processAdminPage.processTable.hasProcesses();
				expect(hasProcesses).toBe(true);
				console.log('Processes list displayed with available processes');
			});

			await test.step('3. User: Selects the process that want to update', async () => {
				// Search for the specific process created in setup using its exact title
				await surveysManagePage.searchAndSelectProcess(validProcessData.general.title);
				console.log(`Selected the specific process created in setup: "${validProcessData.general.title}"`);
			});

			await test.step('4. System: Loads the selected process and displays the content in an editable form, including all existing information.', async () => {
				await page.waitForURL(/\/admin\/participatory_processes\/.*\/edit/);
				await page.waitForLoadState('networkidle');

				// Verify we're on the edit page with process information using Page Object
				await updateProcessAdminPage.expectToBeOnUpdateProcessPage();
			});

			await test.step('5. User: Navigates to the "Components" section in the admin panel.', async () => {
				await updateProcessAdminPage.navigateToComponents();
				await componentsPage.manageComponent(componentName);
				console.log('Accessed survey component');
			});

			await test.step('6. User: Select specific Survey that want to export.', async () => {
				await surveysManagePage.accessQuestionsManagement();
				console.log('Navigated to Manage questions page for survey export');
			});

			await test.step('7. System: Displays survey details, including an option to "Export all"', async () => {
				// Verify we're on the survey details/manage questions page
				expect(page.url()).toMatch(/\/edit_questions$/);

				// Verify the "Export" button is visible
				await expect(page.getByText('Export', { exact: true })).toBeVisible();
				console.log('Export button is visible');

				// Verify the confirmation message is present
				await expect(page.getByText('The form is already answered')).toBeVisible();
				console.log('Confirmation message is visible');
			});

			await test.step('8. User: Clicks on the "Export" button and select format', async () => {
				await page.getByText('Export', { exact: true }).click();

				await page.waitForLoadState('networkidle');

				await expect(page.getByRole('link', { name: 'Export CSV' })).toBeVisible();
				await page.getByRole('link', { name: 'Export CSV' }).click();
				console.log('Selected Export CSV format');

				await page.waitForLoadState('networkidle');
			});

			await test.step('9. System: Displays a confirmation message on the platform, indicating that the export process has been initiated and that the file will be sent via email', async () => {
				await expect(page.getByText('Your export is currently in')).toBeVisible();
				console.log('Export status message is visible');

				await page.waitForLoadState('networkidle');
			});

			await test.step("10. System: Sends an email to the administrator's registered email address with the export file as an attachment or a secure download link", async () => {
				// Navigate to Letter Opener and refresh to get latest emails
				await letterOpenerPage.navigateToLetterOpener();
				await letterOpenerPage.refreshEmails();

				console.log('Letter Opener opened and refreshed. Ready to search for export email.');

				// Find and click on the most recent export email (should be first after refresh)
				await letterOpenerPage.clickMostRecentExportEmail();

				// Verify the export email content
				await letterOpenerPage.verifyExportEmail();

				console.log('Export email content verified');
			});
		});
	});
});
