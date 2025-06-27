import { AdminHomePage } from '@pages/pages/admin/AdminHomePage';
import { AttachmentsProcessPage } from '@pages/pages/admin/processes/detail/attachments/AttachmentsProcessPage';
import { NewAttachmentProcessPage } from '@pages/pages/admin/processes/detail/attachments/NewAttachmentProcessPage';
import { UpdateProcessAdminPage } from '@pages/pages/admin/processes/detail/UpdateProcessAdminPage';
import { ProcessAdminPage } from '@pages/pages/admin/processes/ProcessAdminPage';
import test, { expect } from '@playwright/test';
import { STORAGE_STATE } from '@utils/constants';

/**
 * Test suite for Allows City Administrators to edit an attachment of the process.
 *
 * User Story: As a City Administrator, I want to edit existing attachment of the process.
 *
 * Requirements: PAR R8, PAR R11
 *
 * Prerequisites:
 * - The City Administrator has an active account on the platform and is logged in.
 * - The process has already been created.
 * - The attachment has already been uploaded into the process.
 */
test.describe('[PAR-PPA002] – Edit attachment in a process', () => {
	test.use({ storageState: STORAGE_STATE.ADMIN });
	let adminHomePage: AdminHomePage;
	let processAdminPage: ProcessAdminPage;
	let updateProcessAdminPage: UpdateProcessAdminPage;
	let attachmentsProcessPage: AttachmentsProcessPage;
	let newAttachmentProcessPage: NewAttachmentProcessPage;

	test.beforeEach(async ({ page }) => {
		adminHomePage = new AdminHomePage(page);
		processAdminPage = new ProcessAdminPage(page);
		updateProcessAdminPage = new UpdateProcessAdminPage(page);
		attachmentsProcessPage = new AttachmentsProcessPage(page);
		newAttachmentProcessPage = new NewAttachmentProcessPage(page);
		await adminHomePage.navigateToAdminHomePage();
	});

	test.describe('Main Flow', () => {
		test('should allows administrator to edit attachment of a process', async () => {
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
			});
			await test.step('7. User: Selects an existing attachment to edit.', async () => {
				await attachmentsProcessPage.clickEditAttachmentByIndex(0);
			});
			await test.step('8. System: Displays the attachment details in an editable form.', async () => {
				await newAttachmentProcessPage.expectToBeOnNewAttachmentPage();
			});
			await test.step('9. User: Makes the desired changes to the attachment details (e.g., updates the title or description).', async () => {
				await newAttachmentProcessPage.fillTitle('Test updated title');
				await newAttachmentProcessPage.fillDescription(
					'This is a test attachment for the process with updated title.'
				);
				await newAttachmentProcessPage.expectRequiredFieldsFilled();
			});
			await test.step('10. User: Clicks on "Save Changes" to update the attachment details.', async () => {
				await newAttachmentProcessPage.submitForm();
			});
			await test.step('11. System: Validates the updated information.', async () => {
				await attachmentsProcessPage.expectToBeOnAttachmentsProcessPage();
			});
			await test.step('12. System: Saves the updated attachment details.', async () => {
				await attachmentsProcessPage.expectAttachmentsTableVisible();
			});
			await test.step('13. System: Notifies the City Administrator that the attachment has been successfully updated.', async () => {
				await attachmentsProcessPage.expectSuccessFlashMessage('Attachment updated successfully.');
			});
			await test.step('Result.', async () => {
				const title = await attachmentsProcessPage.getAttachmentTitleByIndex(0);
				expect(title).toBe('Test updated title');
			});
		});
	});

	test.describe('Alternative Flow', () => {
		test('should display submission error', async () => {
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
			});
			await test.step('7. User: Selects an existing attachment to edit.', async () => {
				await attachmentsProcessPage.clickEditAttachmentByIndex(0);
			});
			await test.step('8. System: Displays the attachment details in an editable form.', async () => {
				await newAttachmentProcessPage.expectToBeOnNewAttachmentPage();
			});
			await test.step('9. User: Makes the desired changes to the attachment details (e.g., updates the title or description).', async () => {
				await newAttachmentProcessPage.fillTitle('');
				await newAttachmentProcessPage.fillDescription(
					'This is a test attachment for the process with updated title.'
				);
				await newAttachmentProcessPage.expectAtLeastOneRequiredFieldEmpty();
			});
			await test.step('10.1 User: Clicks on "Save Changes" with invalid or incomplete fields', async () => {
				await newAttachmentProcessPage.submitForm();
			});
			await test.step('10.2. System: Detects errors in the updated attachment details.', async () => {
				await newAttachmentProcessPage.getPage().waitForTimeout(1000); // Wait for error message to appear
			});
			await test.step('10.3. System: Displays an error message highlighting the invalid or missing fields.', async () => {
				await newAttachmentProcessPage.expectErrorFlashMessage('There was a problem updating this attachment.');
			});
			await test.step('10.4. User: Corrects the errors in the attachment details.', async () => {
				await newAttachmentProcessPage.fillTitle('Corrected title');
			});
			await test.step('10.5 User:Clicks on "Save Changes" again.', async () => {
				await newAttachmentProcessPage.submitForm();
			});
			await test.step('Result.', async () => {
				await attachmentsProcessPage.expectSuccessFlashMessage('Attachment updated successfully.');
			});
		});
	});
});
