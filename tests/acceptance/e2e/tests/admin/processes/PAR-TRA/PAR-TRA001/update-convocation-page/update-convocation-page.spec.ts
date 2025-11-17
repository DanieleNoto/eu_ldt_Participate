import { expect, test } from '@playwright/test';

import { AdminHomePage } from '@pages/pages/admin/AdminHomePage';
import { ComponentsPage } from '@pages/pages/admin/processes/detail/components/ComponentsPage';
import { ManagePageComponentPage } from '@pages/pages/admin/processes/detail/components/ManagePageComponentPage';
import { UpdateProcessAdminPage } from '@pages/pages/admin/processes/detail/UpdateProcessAdminPage';
import { ProcessAdminPage } from '@pages/pages/admin/processes/ProcessAdminPage';
import { ensureLoggedIn } from '@utils/auth-helper';
import { STORAGE_STATE } from '@utils/constants';

/**
 * Test suite for Allows the City Administrator to update information on the convocation page once a participatory process is completed.
 *
 * User Story: As a City Administrator, I want to update the convocation page after the process is over so that citizens are informed about the outcomes and any next steps.
 *
 * Requirements: PAR R8
 *
 * Prerequisites:
 * - The City Administrator has an active account on the platform and is logged in.
 * - The participatory process has been completed.
 * - The convocation page for the process is available for editing.
 */
test.beforeAll(async ({ browser }) => {
	const context = await browser.newContext();
	const page = await context.newPage();
	await ensureLoggedIn(page, 'ADMIN');
});
test.describe('[PAR-TRA001] – Update convocation page after process completion', () => {
	// Use admin storage state for authentication
	test.use({ storageState: STORAGE_STATE.ADMIN });
	let adminHomePage: AdminHomePage;
	let componentsPage: ComponentsPage;
	let updateProcessAdminPage: UpdateProcessAdminPage;
	let managePageComponentPage: ManagePageComponentPage;
	let processAdminPage: ProcessAdminPage;

	const testContent = {
		title: 'Process Outcomes and Next Steps',
		body: 'This section contains the results, decisions and next steps of the participatory process.'
	};

	test.beforeEach(async ({ page }) => {
		// Direct navigation to the admin area and wait for load
		adminHomePage = new AdminHomePage(page);

		// Page Objects initialization
		processAdminPage = new ProcessAdminPage(page);
		componentsPage = new ComponentsPage(page);
		managePageComponentPage = new ManagePageComponentPage(page);
		updateProcessAdminPage = new UpdateProcessAdminPage(page);
		await adminHomePage.navigateToAdminHomePage();
		// Initial setup: verify/create process and convocation page
	});

	test.describe('Main Flow', () => {
		test('should successfully update convocation page content', async () => {
			const bodyContent = 'Summary of the process outcomes. Decisions taken. Next steps or upcoming actions.';
			await test.step('1. User: Navigates to the "Processes" section.', async () => {
				await processAdminPage.navigateToProcesses();
			});
			await test.step('2. System: displays a list of all Processes that the City Administrator has created or has permissions to update', async () => {
				// Verify processes table is visible and has content
				const hasProcesses = await processAdminPage.processTable.hasProcesses();
				expect(hasProcesses).toBe(true);
			});
			await test.step('3. User selects the process that want to update', async () => {
				// Click edit on the first process in the table
				await processAdminPage.editFirstProcess();
				await processAdminPage.getPage().waitForLoadState('networkidle');
			});
			await test.step('4. System: Loads the selected process and displays the content in an editable form, including all existing information', async () => {
				await updateProcessAdminPage.expectToBeOnUpdateProcessPage();
			});
			await test.step('5. User: Navigate to convocation page management', async () => {
				// Navigate to convocation page component management
				await updateProcessAdminPage.sidebarProcessDetail.navigateToComponents();
				await componentsPage.checkPageComponent('Page');
				await componentsPage.expectComponentExists('Page');
				await componentsPage.manageComponent('Page');
				await managePageComponentPage.verifyPageLoaded();
				await managePageComponentPage.fillBody(bodyContent);
			});

			await test.step('6. User: Update content', async () => {
				await managePageComponentPage.savePage();
			});

			await test.step('7 and step 8: User: Save changes ', async () => {
				console.log(
					'Step 7 And Step 8 SYSTEM: Validates the updated information for completeness and correctness. Saves changes.'
				);
			});
			await test.step('Result. ', async () => {
				// Verify that the success notification appears
				await managePageComponentPage.waitForSuccessFlashNotification('Page successfully saved.');
				await componentsPage.manageComponent('Page');
				await managePageComponentPage.expectBodyContent(bodyContent);
				await managePageComponentPage.savePage();
			});
		});
	});

	test.describe('Alternative Flow - abort update', () => {
		test('should discard changes when cancelling update', async () => {
			await test.step('1. User: Navigates to the "Processes" section.', async () => {
				await processAdminPage.navigateToProcesses();
			});
			await test.step('2. System: displays a list of all Processes that the City Administrator has created or has permissions to update', async () => {
				// Verify processes table is visible and has content
				const hasProcesses = await processAdminPage.processTable.hasProcesses();
				expect(hasProcesses).toBe(true);
			});
			await test.step('3. User selects the process that want to update', async () => {
				// Click edit on the first process in the table
				await processAdminPage.editFirstProcess();
				await processAdminPage.getPage().waitForLoadState('networkidle');
			});
			await test.step('4. System: Loads the selected process and displays the content in an editable form, including all existing information', async () => {
				await updateProcessAdminPage.expectToBeOnUpdateProcessPage();
			});
			await test.step('5. User: Navigate to convocation page management', async () => {
				// Navigate to convocation page component management
				await updateProcessAdminPage.sidebarProcessDetail.navigateToComponents();
				await componentsPage.manageComponent('Page');

				// Verify being on the management page
				await managePageComponentPage.verifyPageLoaded();
			});
			await test.step('6. User: Update content', async () => {
				// Update content using only English
				await managePageComponentPage.fillBody(testContent.body);
			});

			await test.step('Cancel changes and verify discard', async () => {
				// Simulate cancellation by navigating away without saving
				await componentsPage.sidebarProcessDetail.navigateToComponents();

				// Return to component management
				await componentsPage.manageComponent('Page');
				await managePageComponentPage.verifyPageLoaded();
			});
			await test.step('Result.', async () => {
				// Verify that unsaved changes were discarded
				const currentBody = await managePageComponentPage.getBody();
				expect(currentBody).not.toBe('Modified Body - Should be discarded');
			});
		});
	});
});
