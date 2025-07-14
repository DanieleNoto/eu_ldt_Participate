import { UploadFileModalComponent } from '@pages/components/admin/process/detail/UploadFileModalComponent';
import { AdminHomePage } from '@pages/pages/admin/AdminHomePage';
import { AttachmentsProcessPage } from '@pages/pages/admin/processes/detail/attachments/AttachmentsProcessPage';
import { NewAttachmentProcessPage } from '@pages/pages/admin/processes/detail/attachments/NewAttachmentProcessPage';
import { UpdateProcessAdminPage } from '@pages/pages/admin/processes/detail/UpdateProcessAdminPage';
import { ProcessAdminPage } from '@pages/pages/admin/processes/ProcessAdminPage';
import test, { expect } from '@playwright/test';
import { ensureLoggedIn } from '@utils/auth-helper';
import { STORAGE_STATE } from '@utils/constants';

/**
 * Test suite for Allows City Administrators to manage attachments for the process, including adding, updating, and deleting supporting documents and relevant materials to provide context for participants.
 *
 * User Story: As a City Administrator, I want to manage attachments for the process so that I can provide supporting documents and relevant materials to participants for better understanding and context.
 *
 * Requirements: PAR R8, PAR R11
 *
 * Prerequisites:
 * - The City Administrator has an active account on the platform and is logged in.
 * - The process has already been created.
 */
test.beforeAll(async ({ browser }) => {
	const context = await browser.newContext();
	const page = await context.newPage();
	await ensureLoggedIn(page, 'ADMIN');
});
test.describe('[PAR-PPA001] – Manage attachments in process', () => {
	test.use({ storageState: STORAGE_STATE.ADMIN });
	let adminHomePage: AdminHomePage;
	let processAdminPage: ProcessAdminPage;
	let updateProcessAdminPage: UpdateProcessAdminPage;
	let attachmentsProcessPage: AttachmentsProcessPage;
	let newAttachmentProcessPage: NewAttachmentProcessPage;
	let uploadFileModal: UploadFileModalComponent;

	test.beforeEach(async ({ page }) => {
		adminHomePage = new AdminHomePage(page);
		processAdminPage = new ProcessAdminPage(page);
		updateProcessAdminPage = new UpdateProcessAdminPage(page);
		attachmentsProcessPage = new AttachmentsProcessPage(page);
		newAttachmentProcessPage = new NewAttachmentProcessPage(page);
		uploadFileModal = new UploadFileModalComponent(page);
		await adminHomePage.navigateToAdminHomePage();
	});

	test.describe('Main Flow', () => {
		test('should allows administrator to add attachments to process', async () => {
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
			});
			await test.step('7. User: Clicks on "Add New Attachment" button.', async () => {
				await attachmentsProcessPage.clickNewAttachment();
				await newAttachmentProcessPage.expectToBeOnNewAttachmentPage();
				await newAttachmentProcessPage.clickAddFile();
			});
			await test.step('8. User: Selects the file to be attached from the local device.', async () => {
				await uploadFileModal.expectModalVisible();
				await uploadFileModal.uploadTestImage();
				await uploadFileModal.clickSave();
			});
			await test.step('9. User: Fills in the attachment details: 1. Title 2. Description (optional).', async () => {
				await uploadFileModal.expectModalNotVisible();
				await newAttachmentProcessPage.fillTitle('Test');
				await newAttachmentProcessPage.fillDescription('This is a test attachment for the process.');
				await newAttachmentProcessPage.expectRequiredFieldsFilled();
			});
			await test.step('10. User: Clicks on "Create Attachment" to add the new file.', async () => {
				await newAttachmentProcessPage.submitForm();
			});
			await test.step('11. System: Validates the file format and size for compatibility.', async () => {
				await attachmentsProcessPage.expectToBeOnAttachmentsProcessPage();
			});
			await test.step('12. System: Saves the attachment and updates the list of attachments for the process.', async () => {
				await attachmentsProcessPage.expectAttachmentsTableVisible();
			});
			await test.step('13. System: Notifies the City Administrator that the attachment has been successfully added.', async () => {
				await attachmentsProcessPage.expectSuccessFlashMessage('Attachment created successfully.');
			});
			await test.step('Result.', async () => {
				await attachmentsProcessPage.expectTestAttachmentExists();
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
			await test.step('7. User: Clicks on "Add New Attachment" button.', async () => {
				await attachmentsProcessPage.clickNewAttachment();
				await newAttachmentProcessPage.expectToBeOnNewAttachmentPage();
				await newAttachmentProcessPage.clickAddFile();
			});
			await test.step('8. User: Selects the file to be attached from the local device.', async () => {
				await uploadFileModal.expectModalVisible();
				await uploadFileModal.uploadNotValidTestImage();
			});
			await test.step('8.1. System: Detects that the file format or size is invalid.', async () => {
				await uploadFileModal.expectNotValidTestFileHasError();
			});
			await test.step('8.2. System: Displays an error message highlighting the issue.', async () => {
				const error = await uploadFileModal.getFileValidationError('not.valid.file');
				expect(error).toContain('Validation error! Check that the file has an allowed extension or size.');
			});
			await test.step('8.3. User: Selects a valid file and retries the upload.', async () => {
				await uploadFileModal.clickRemove();
				await uploadFileModal.uploadTestImage();
				await uploadFileModal.clickSave();
			});
			await test.step('9. User: Fills in the attachment details: 1. Title 2. Description (optional).', async () => {
				await uploadFileModal.expectModalNotVisible();
				await newAttachmentProcessPage.fillTitle('Test');
				await newAttachmentProcessPage.fillDescription('This is a test attachment for the process.');
				await newAttachmentProcessPage.expectRequiredFieldsFilled();
			});
			await test.step('10. User: Clicks on "Create Attachment" to add the new file.', async () => {
				await newAttachmentProcessPage.submitForm();
			});
			await test.step('11. System: Validates the file format and size for compatibility.', async () => {
				await attachmentsProcessPage.expectToBeOnAttachmentsProcessPage();
			});
			await test.step('12. System: Saves the attachment and updates the list of attachments for the process.', async () => {
				await attachmentsProcessPage.expectAttachmentsTableVisible();
			});
			await test.step('13. System: Notifies the City Administrator that the attachment has been successfully added.', async () => {
				await attachmentsProcessPage.expectSuccessFlashMessage('Attachment created successfully.');
			});
			await test.step('Result.', async () => {
				await attachmentsProcessPage.expectTestAttachmentExists();
			});
		});
	});
});
