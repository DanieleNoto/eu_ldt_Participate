import test, { expect } from '@playwright/test';
import { ProcessTestDataGenerator } from '@fixtures/process-fixtures';
import { AdminHomePage } from '@pages/pages/admin/AdminHomePage';
import { ProcessAdminPage } from '@pages/pages/admin/processes/ProcessAdminPage';
import { UpdateProcessAdminPage } from '@pages/pages/admin/processes/detail/UpdateProcessAdminPage';
import { ComponentsPage } from '@pages/pages/admin/processes/detail/components/ComponentsPage';
import { SurveysManagePage } from '@pages/pages/admin/processes/detail/components/surveys/SurveysManagePage';
import { DebatesPage } from '@pages/pages/admin/processes/detail/debates/DebatesPage';
import { NewDebatePage } from '@pages/pages/admin/processes/detail/debates/NewDebatePage';
import { DebatesManagePage } from '@pages/pages/admin/processes/detail/debates/DebatesManagePage';
import { LetterOpenerPage } from '@pages/pages/admin/LetterOpenerPage';
import { ensureLoggedIn } from '@utils/auth-helper';
import { STORAGE_STATE } from '@utils/constants';

/**
 * Allows administrators to export data from debates, including user contributions and discussion summaries, which are then sent to their email address for easy access and analysis.
 * User Story: As an Administrator, I want to export debate data and receive it via email so that I can analyse user contributions and generate reports for informed decision-making.
 * Requirements: PAR R21
 * Prerequisites:
 * - The City Administrator has an active account on the platform and is logged in.
 * - The debates have been conducted, and user contributions are available for export.
 */
test.beforeAll(async ({ browser }) => {
	const context = await browser.newContext();
	const page = await context.newPage();
	await ensureLoggedIn(page, 'ADMIN');
	await page.close();
	await context.close();
});

test.describe('[PAR-DE002] – Export debate data', () => {
	test.use({ storageState: STORAGE_STATE.ADMIN });
	let adminHomePage: AdminHomePage;
	let processAdminPage: ProcessAdminPage;
	let updateProcessAdminPage: UpdateProcessAdminPage;
	let componentsPage: ComponentsPage;
	let surveysManagePage: SurveysManagePage;
	let debatesPage: DebatesPage;
	let newDebatePage: NewDebatePage;
	let debatesManagePage: DebatesManagePage;
	let letterOpenerPage: LetterOpenerPage;
	let validProcessData: any;
	let processEditUrl: string;

	// Variables for the setup
	let processSlug: string;
	let componentName: string;

	// Common setup for both flows (only Page Objects)
	test.beforeEach(async ({ page }) => {
		adminHomePage = new AdminHomePage(page);
		processAdminPage = new ProcessAdminPage(page);
		updateProcessAdminPage = new UpdateProcessAdminPage(page);
		componentsPage = new ComponentsPage(page);
		surveysManagePage = new SurveysManagePage(page);
		debatesPage = new DebatesPage(page);
		newDebatePage = new NewDebatePage(page);
		debatesManagePage = new DebatesManagePage(page);
		letterOpenerPage = new LetterOpenerPage(page);
		validProcessData = ProcessTestDataGenerator.generateValidProcessData();
		componentName = 'Debate';
	});

	/**
	 * Setup test environment (for Main Flow)
	 */
	async function setupTestProcessWithDebates(browser: any) {
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

		await test.step('Setup: Add debates component and create debate as prerequisite', async () => {
			const result = await debatesManagePage.setupTestDebates(
				processSlug,
				processEditUrl,
				processAdminPage,
				componentsPage,
				debatesPage,
				newDebatePage
			);

			console.log(`Setup completed: ${result.componentName} with debate "${result.debateName}"`);
		});

		await test.step('Setup: Add user responses to debate as prerequisite', async () => {
			await debatesManagePage.setupUserDebateResponses(browser, processSlug);
			console.log('User debate responses setup completed');
		});
	}

	test.describe('Main Flow', () => {
		test.beforeEach(async ({ browser }) => {
			await setupTestProcessWithDebates(browser);
		});

		[{ fileFormat: 'CSV' }, { fileFormat: 'JSON' }, { fileFormat: 'Excel' }].forEach(({ fileFormat }) => {
			test(`should export debate data in ${fileFormat} format`, async ({ page }) => {
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

					// Verify we're on the edit page with process information
					await updateProcessAdminPage.expectToBeOnUpdateProcessPage();
				});

				await test.step('5. User: Navigates to the "Components -> Debates" section in the admin panel.', async () => {
					await updateProcessAdminPage.navigateToComponents();
					await componentsPage.manageComponent(componentName);
					await page.waitForLoadState('networkidle');
					console.log('Accessed debates component');
				});

				await test.step('6. System: Displays a list of available debates, including completed debates with user contributions and summaries.', async () => {
					const debatesCount = await debatesPage.getDebatesCount();
					expect(debatesCount).toBeGreaterThan(0);
					console.log(`Found ${debatesCount} debates in the list`);

					// Verify that the specific debate created in setup is present in the list
					const debateTitles = await debatesPage.getAllDebateTitles();
					const hasTestDebate = debateTitles.some(title => title.includes('Test Debate'));
					expect(hasTestDebate).toBe(true);
					console.log('Test debate is visible in the debates list');
				});

				await test.step('7. User: Clicks on the "Export" button and select format', async () => {
					await componentsPage.exportComponentData(fileFormat);
					console.log(`Selected Export ${fileFormat} format`);

					await page.waitForLoadState('networkidle');
				});

				await test.step('8. System: Displays a confirmation message on the platform, indicating that the export process has been initiated and that the file will be sent via email', async () => {
					await componentsPage.expectExportConfirmationMessage();
					console.log('Export status message is visible');

					await page.waitForLoadState('networkidle');
				});

				await test.step("9. System: Sends an email to the administrator's registered email address with the export file as an attachment or a secure download link", async () => {
					// Navigate to Letter Opener and refresh to get latest emails
					await letterOpenerPage.navigateToLetterOpener();
					await letterOpenerPage.refreshEmails();

					console.log('Letter Opener opened and refreshed. Ready to search for export email.');

					// Find and click on the most recent export email (should be first after refresh)
					await letterOpenerPage.clickMostRecentDebatesExportEmail();

					// Verify the export email content
					await letterOpenerPage.verifyExportEmail();

					// Download and verify the export file
					await letterOpenerPage.downloadExportFileDebates();
				});
			});
		});
	});
});
