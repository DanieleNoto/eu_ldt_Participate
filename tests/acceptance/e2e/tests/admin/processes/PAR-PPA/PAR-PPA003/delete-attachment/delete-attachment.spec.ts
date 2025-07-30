import { ConfirmDeleteModalComponent } from '@pages/components/common/ConfirmDeleteModalComponent';
import { AdminHomePage } from '@pages/pages/admin/AdminHomePage';
import { AttachmentsProcessPage } from '@pages/pages/admin/processes/detail/attachments/AttachmentsProcessPage';
import { UpdateProcessAdminPage } from '@pages/pages/admin/processes/detail/UpdateProcessAdminPage';
import { ProcessAdminPage } from '@pages/pages/admin/processes/ProcessAdminPage';
import test, { expect } from '@playwright/test';
import { ensureLoggedIn } from '@utils/auth-helper';
import { STORAGE_STATE } from '@utils/constants';

/**
 * Test suite for Allows City Administrators to delete an Existing Attachment of the process.
 *
 * User Story: As a City Administrator, I want to delete existing attachment of the process.
 *
 * Requirements: PAR R8, PAR R11
 *
 * Prerequisites:
 * - The City Administrator has an active account on the platform and is logged in.
 * - The process has already been created.
 * - The attachment has already been uploaded into the process.
 */
test.describe('[PAR-PPA003] – Delete an existing attachment', () => {
	test.use({ storageState: STORAGE_STATE.ADMIN });
	let adminHomePage: AdminHomePage;
	let processAdminPage: ProcessAdminPage;
	let updateProcessAdminPage: UpdateProcessAdminPage;
	let attachmentsProcessPage: AttachmentsProcessPage;
	let confirmDeleteModalComponent: ConfirmDeleteModalComponent;

	test.beforeEach(async ({ page }) => {
		await ensureLoggedIn(page, 'ADMIN');
		adminHomePage = new AdminHomePage(page);
		processAdminPage = new ProcessAdminPage(page);
		updateProcessAdminPage = new UpdateProcessAdminPage(page);
		attachmentsProcessPage = new AttachmentsProcessPage(page);
		confirmDeleteModalComponent = new ConfirmDeleteModalComponent(page);
		await adminHomePage.navigateToAdminHomePage();
	});

	test.describe('Main Flow', () => {
		test('should allows administrator to delete attachment of a process', async () => {
			let countPreviousDelete = 0;
			await test.step('1. User: navigates to the "Processes" section', async () => {
				// Navigate to processes section
				await adminHomePage.navigateViaAdminNav('processes');
				await processAdminPage.waitForLoadState('networkidle');
			});
			await test.step('2. System: Displays a list of all Processes that the City Administrator has created or has permissions to update.', async () => {
				await processAdminPage.expectToBeOnProcessesAdminPage();
				// Verify processes table is visible and has content
				const hasProcesses = await processAdminPage.processTable.hasProcesses();
				expect(hasProcesses).toBe(true);
			});
			await test.step('3. User: Selects the process that want to update', async () => {
				// Click edit on the first process in the table
				await processAdminPage.editFirstProcess();
				await processAdminPage.getPage().waitForLoadState('networkidle');
			});
			await test.step('4. System: Loads the selected process and displays the content in an editable form, including all existing information', async () => {
				await updateProcessAdminPage.expectToBeOnUpdateProcessPage();
			});
			await test.step('5. User: Navigates to the "Manage Attachments" section within the process management interface.', async () => {
				await updateProcessAdminPage.navigateToAttachments();
			});
			await test.step('6. System: Displays a list of existing attachments (if any) and provides options to add, edit, or remove attachments.', async () => {
				await attachmentsProcessPage.expectToBeOnAttachmentsProcessPage();
				await attachmentsProcessPage.expectAttachmentsTableVisible();
				countPreviousDelete = await attachmentsProcessPage.getAttachmentsCount();
			});
			await test.step('7. User: Selects an existing attachment to delete.', async () => {
				await attachmentsProcessPage.clickDeleteAttachmentByIndex(0);
			});
			await test.step('8. System: Prompts the user to confirm the deletion.', async () => {
				await confirmDeleteModalComponent.expectModalVisible();
			});
			await test.step('9. User: Confirms the deletion.', async () => {
				await confirmDeleteModalComponent.confirmDelete();
			});
			await test.step('10. System: Deletes the selected attachment from the process and updates the list of attachments.', async () => {
				await attachmentsProcessPage.waitForLoadState('networkidle');
				await confirmDeleteModalComponent.expectModalNotVisible();
			});
			await test.step('11. System: Notifies the City Administrator that the attachment has been successfully deleted.', async () => {
				await attachmentsProcessPage.expectSuccessFlashMessage('Attachment destroyed successfully.');
			});
			await test.step('Result.', async () => {
				const count = await attachmentsProcessPage.getAttachmentsCount();
				expect(count).toBeLessThan(countPreviousDelete);
			});
		});
	});

	test.describe('Alternative Flow', () => {
		test('should can abort the delete attachments', async () => {
			let countPreviousDelete = 0;
			await test.step('1. User: navigates to the "Processes" section', async () => {
				// Navigate to processes section
				await adminHomePage.navigateViaAdminNav('processes');
				await processAdminPage.waitForLoadState('networkidle');
				await process;
			});
			await test.step('2. System: Displays a list of all Processes that the City Administrator has created or has permissions to update.', async () => {
				await processAdminPage.expectToBeOnProcessesAdminPage();
				// Verify processes table is visible and has content
				const hasProcesses = await processAdminPage.processTable.hasProcesses();
				expect(hasProcesses).toBe(true);
			});
			await test.step('3. User: Selects the process that want to update', async () => {
				// Click edit on the first process in the table
				await processAdminPage.editFirstProcess();
				await processAdminPage.getPage().waitForLoadState('networkidle');
			});
			await test.step('4. System: Loads the selected process and displays the content in an editable form, including all existing information', async () => {
				await updateProcessAdminPage.expectToBeOnUpdateProcessPage();
			});
			await test.step('5. User: Navigates to the "Manage Attachments" section within the process management interface.', async () => {
				await updateProcessAdminPage.navigateToAttachments();
			});
			await test.step('6. System: Displays a list of existing attachments (if any) and provides options to add, edit, or remove attachments.', async () => {
				await attachmentsProcessPage.expectToBeOnAttachmentsProcessPage();
				await attachmentsProcessPage.expectAttachmentsTableVisible();
				countPreviousDelete = await attachmentsProcessPage.getAttachmentsCount();
			});
			await test.step('7. User: Selects an existing attachment to delete.', async () => {
				await attachmentsProcessPage.clickDeleteAttachmentByIndex(0);
			});
			await test.step('8. System: Prompts the user to confirm the deletion.', async () => {
				await confirmDeleteModalComponent.expectModalVisible();
			});
			await test.step('8.1. User: Decides not to proceed with deletion.', async () => {
				await confirmDeleteModalComponent.cancelDelete();
			});
			await test.step('8.2 System: Aborts the deletion process and returns the user to the list of attachments.', async () => {
				await attachmentsProcessPage.getPage().waitForLoadState('networkidle');
				await confirmDeleteModalComponent.expectModalNotVisible();
			});
			await test.step('Result.', async () => {
				const count = await attachmentsProcessPage.getAttachmentsCount();
				expect(count).toBe(countPreviousDelete);
			});
		});
	});
});
