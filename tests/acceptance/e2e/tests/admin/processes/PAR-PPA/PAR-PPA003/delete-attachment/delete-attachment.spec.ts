/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Simone Bianchelli
 * Gianfranco Cedro
 */

import { ConfirmDeleteModalComponent } from '@pages/components/common/ConfirmDeleteModalComponent';
import { AdminHomePage } from '@pages/pages/admin/AdminHomePage';
import { AttachmentsProcessPage } from '@pages/pages/admin/processes/detail/attachments/AttachmentsProcessPage';
import { NewAttachmentProcessPage } from '@pages/pages/admin/processes/detail/attachments/NewAttachmentProcessPage';
import { UpdateProcessAdminPage } from '@pages/pages/admin/processes/detail/UpdateProcessAdminPage';
import { ProcessAdminPage } from '@pages/pages/admin/processes/ProcessAdminPage';
import { test, expect } from '@fixtures/parallel-test-reserved';

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
 *
 * @reserved - PAR-PPA tests share the attachments of the first process and must run sequentially.
 */
test.describe('@reserved [PAR-PPA003] – Delete an existing attachment', () => {
	let adminHomePage: AdminHomePage;
	let processAdminPage: ProcessAdminPage;
	let updateProcessAdminPage: UpdateProcessAdminPage;
	let attachmentsProcessPage: AttachmentsProcessPage;
	let newAttachmentProcessPage: NewAttachmentProcessPage;
	let confirmDeleteModalComponent: ConfirmDeleteModalComponent;

	test.beforeEach(async ({ adminPage }) => {
		adminHomePage = new AdminHomePage(adminPage);
		processAdminPage = new ProcessAdminPage(adminPage);
		updateProcessAdminPage = new UpdateProcessAdminPage(adminPage);
		attachmentsProcessPage = new AttachmentsProcessPage(adminPage);
		newAttachmentProcessPage = new NewAttachmentProcessPage(adminPage);
		confirmDeleteModalComponent = new ConfirmDeleteModalComponent(adminPage);
		await adminHomePage.navigateToAdminHomePage();

		// Ensure at least one "Test" attachment exists before each test.
		await adminHomePage.navigateViaAdminNav('processes');
		await processAdminPage.waitForLoadState('load');
		await processAdminPage.editFirstProcess();
		await processAdminPage.getPage().waitForLoadState('load');
		await updateProcessAdminPage.navigateToAttachments();

		if (!(await attachmentsProcessPage.hasAttachmentWithTitle('Test'))) {
			await attachmentsProcessPage.clickNewAttachment();
			await newAttachmentProcessPage.expectToBeOnNewAttachmentPage();
			await newAttachmentProcessPage.clickLinkTab();
			await newAttachmentProcessPage.fillTitle('Test');
			await newAttachmentProcessPage.fillDescription('Test attachment description.');
			await newAttachmentProcessPage.fillLink('https://example.org');
			await newAttachmentProcessPage.submitForm();
			await attachmentsProcessPage.expectToBeOnAttachmentsProcessPage();
			console.log('Setup: created fresh "Test" attachment');
		}

		await adminHomePage.navigateToAdminHomePage();
	});

	test.afterEach(async () => {
		try {
			// If the test failed with the confirm modal open (e.g. between steps 8-9),
			// dismiss it first so it doesn't intercept subsequent navigation clicks.
			const confirmModal = attachmentsProcessPage
				.getPage()
				.locator('#confirm-modal[data-dialog="confirm-modal"]');
			if (await confirmModal.isVisible()) {
				await confirmModal.locator('button[data-confirm-cancel], button[data-dialog-close]').first().click();
				await confirmModal.waitFor({ state: 'hidden' });
			}

			await adminHomePage.navigateViaAdminNav('processes');
			await processAdminPage.waitForLoadState('load');
			await processAdminPage.editFirstProcess();
			await processAdminPage.getPage().waitForLoadState('load');
			await updateProcessAdminPage.navigateToAttachments();

			// Delete any leftover "Test" attachment (e.g. from the Alternative Flow
			// which aborts deletion and leaves the attachment in place).
			let found = true;
			while (found) {
				found = false;
				if (await attachmentsProcessPage.hasAttachmentWithTitle('Test')) {
					await attachmentsProcessPage.clickDeleteAttachmentByTitle('Test');
					console.log('Cleanup: deleted attachment "Test"');
					found = true;
				}
			}
		} catch (error: unknown) {
			console.error('PAR-PPA003 cleanup failed:', error instanceof Error ? error.message : String(error));
		}
	});

	test.describe('Main Flow', () => {
		test('should allows administrator to delete attachment of a process', async () => {
			let countPreviousDelete = 0;
			await test.step('1. User: navigates to the "Processes" section', async () => {
				// Navigate to processes section
				await adminHomePage.navigateViaAdminNav('processes');
				await processAdminPage.waitForLoadState('load');
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
				await processAdminPage.getPage().waitForLoadState('load');
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
				await attachmentsProcessPage.waitForLoadState('load');
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
				await processAdminPage.waitForLoadState('load');
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
				await processAdminPage.getPage().waitForLoadState('load');
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
				await attachmentsProcessPage.getPage().waitForLoadState('load');
				await confirmDeleteModalComponent.expectModalNotVisible();
			});
			await test.step('Result.', async () => {
				const count = await attachmentsProcessPage.getAttachmentsCount();
				expect(count).toBe(countPreviousDelete);
			});
		});
	});
});
