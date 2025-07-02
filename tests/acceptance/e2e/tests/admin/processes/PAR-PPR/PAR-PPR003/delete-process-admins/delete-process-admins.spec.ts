import { ProcessTestDataGenerator } from '@fixtures/process-fixtures';
import { ConfirmDeleteModalComponent } from '@pages/components/common/ConfirmDeleteModalComponent';
import { AdminHomePage } from '@pages/pages/admin/AdminHomePage';
import { ParticipatoryProcessAdminsPage } from '@pages/pages/admin/processes/detail/admins/ParticipatoryProcessAdminsPage';
import { UpdateProcessAdminPage } from '@pages/pages/admin/processes/detail/UpdateProcessAdminPage';
import { ProcessAdminPage } from '@pages/pages/admin/processes/ProcessAdminPage';
import test, { expect } from '@playwright/test';
import { STORAGE_STATE } from '@utils/constants';

/**
 * Test suite for Allows City Administrators to delete an Existing Process Administrators of the process.
 *
 * User Story: 	As a City Administrator, I want to delete an Existing Process Administrators of the process.
 *
 * Requirements: PAR R8
 *
 * Prerequisites:
 * - The City Administrator has an active account on the platform and is logged in.
 * - The process has already been created.
 * - The Process Administrator has already been linked to the process.
 */
test.describe('[PAR-PPR003] – Delete an existing process administrator', () => {
	test.use({ storageState: STORAGE_STATE.ADMIN });
	let adminHomePage: AdminHomePage;
	let processAdminPage: ProcessAdminPage;
	let updateProcessAdminPage: UpdateProcessAdminPage;
	let participatoryProcessAdminsPage: ParticipatoryProcessAdminsPage;

	let confirmDeleteModalComponent: ConfirmDeleteModalComponent;

	let validProcessData: any;

	test.beforeEach(async ({ page }) => {
		validProcessData = ProcessTestDataGenerator.generateValidProcessData();
		adminHomePage = new AdminHomePage(page);
		processAdminPage = new ProcessAdminPage(page);
		updateProcessAdminPage = new UpdateProcessAdminPage(page);
		participatoryProcessAdminsPage = new ParticipatoryProcessAdminsPage(page);

		confirmDeleteModalComponent = new ConfirmDeleteModalComponent(page);

		await adminHomePage.navigateToAdminHomePage();
		await setupTestProcess();
	});

	/**
	 * Setup test environment by ensuring a test process exists
	 */
	async function setupTestProcess() {
		await test.step('Setup: Create/verify test process exists', async () => {
			await processAdminPage.createTestProcess(validProcessData, true);
		});
	}

	test.describe('Main Flow', () => {
		test('should allow admin to delete admins from process', async () => {
			let countPreviousDelete = 0;
			await test.step('1. User: navigates to the "Processes" section', async () => {
				// Navigate to processes section
				await adminHomePage.navigateViaAdminNav('processes');
				await processAdminPage.waitForLoadState('networkidle');

				const isOnProcessesPage = await processAdminPage.isOnProcessesPage();
				expect(isOnProcessesPage).toBe(true);
			});
			await test.step('2. System: Displays a list of all Processes that the City Administrator has created or has permissions to update.', async () => {
				await processAdminPage.expectToBeOnProcessesAdminPage();
				// Verify processes table is visible and has content
				const hasProcesses = await processAdminPage.processTable.hasProcesses();
				expect(hasProcesses).toBe(true);
			});
			await test.step('3. User: Selects the process that want to update', async () => {
				// Click edit on the first process in the table
				await processAdminPage.processTable.clickFirstPrivateProcess();
				await processAdminPage.getPage().waitForLoadState('networkidle');
			});
			await test.step('4. System: Loads the selected process and displays the content in an editable form, including all existing information', async () => {
				await updateProcessAdminPage.expectToBeOnUpdateProcessPage();
			});
			await test.step('5. User: Navigates to the "Process Admins" section within the process management interface.', async () => {
				await updateProcessAdminPage.navigateToProcessAdmins();
			});
			await test.step('6. System: Displays a list of current admins and provides options to add or remove admins.', async () => {
				await participatoryProcessAdminsPage.expectToBeOnParticipatoryProcessAdminsPage();
				await participatoryProcessAdminsPage.expectTableIsVisible();
				countPreviousDelete = await participatoryProcessAdminsPage.getRowCount();
			});
			await test.step('7. User: Select a specific Process Admin that want to delete', async () => {
				await participatoryProcessAdminsPage.performActionOnRow(0, 'delete');
			});
			await test.step('8. System: Prompts the user to confirm the deletion.', async () => {
				await confirmDeleteModalComponent.expectModalVisible();
			});
			await test.step('9. User: Confirms the deletion.', async () => {
				await confirmDeleteModalComponent.clickOK();
			});
			await test.step('10. System: Removes the selected user from the list of administrators for the process.', async () => {
				await participatoryProcessAdminsPage.waitForLoadState('networkidle');
			});
			await test.step('11. System: Notifies the City Administrator that the administrator has been successfully removed.', async () => {
				await participatoryProcessAdminsPage.expectSuccessFlashMessage(
					'Admin successfully removed from this participatory process.'
				);
			});
			await test.step('Result.', async () => {
				expect(countPreviousDelete).toBeGreaterThan(0);
				await participatoryProcessAdminsPage.expectSearchResultsCount(countPreviousDelete - 1);
			});
		});
	});
	test.describe('Alternative Flow', () => {
		test('should can abort delete admin from process', async () => {
			let countPreviousDelete = 0;
			await test.step('1. User: navigates to the "Processes" section', async () => {
				// Navigate to processes section
				await adminHomePage.navigateViaAdminNav('processes');
				await processAdminPage.waitForLoadState('networkidle');

				const isOnProcessesPage = await processAdminPage.isOnProcessesPage();
				expect(isOnProcessesPage).toBe(true);
			});
			await test.step('2. System: Displays a list of all Processes that the City Administrator has created or has permissions to update.', async () => {
				await processAdminPage.expectToBeOnProcessesAdminPage();
				// Verify processes table is visible and has content
				const hasProcesses = await processAdminPage.processTable.hasProcesses();
				expect(hasProcesses).toBe(true);
			});
			await test.step('3. User: Selects the process that want to update', async () => {
				// Click edit on the first process in the table
				await processAdminPage.processTable.clickFirstPrivateProcess();
				await processAdminPage.getPage().waitForLoadState('networkidle');
			});
			await test.step('4. System: Loads the selected process and displays the content in an editable form, including all existing information', async () => {
				await updateProcessAdminPage.expectToBeOnUpdateProcessPage();
			});
			await test.step('5. User: Navigates to the "Process Admins" section within the process management interface.', async () => {
				await updateProcessAdminPage.navigateToProcessAdmins();
			});
			await test.step('6. System: Displays a list of current admins and provides options to add or remove admins.', async () => {
				await participatoryProcessAdminsPage.expectToBeOnParticipatoryProcessAdminsPage();
				await participatoryProcessAdminsPage.expectTableIsVisible();
				countPreviousDelete = await participatoryProcessAdminsPage.getRowCount();
			});
			await test.step('7. User: Select a specific Process Admin that want to delete', async () => {
				await participatoryProcessAdminsPage.performActionOnRow(0, 'delete');
			});
			await test.step('8. System: Prompts the user to confirm the deletion.', async () => {
				await confirmDeleteModalComponent.expectModalVisible();
			});
			await test.step('9.1. User: Decides not to proceed with deletion.', async () => {
				await confirmDeleteModalComponent.clickCancel();
			});
			await test.step('9.2. System: Aborts the deletion process and returns to the "Process admins" section.', async () => {
				await participatoryProcessAdminsPage.waitForLoadState('networkidle');
			});
			await test.step('Result.', async () => {
				expect(countPreviousDelete).toBeGreaterThan(0);
				await participatoryProcessAdminsPage.expectSearchResultsCount(countPreviousDelete);
			});
		});
	});
});
