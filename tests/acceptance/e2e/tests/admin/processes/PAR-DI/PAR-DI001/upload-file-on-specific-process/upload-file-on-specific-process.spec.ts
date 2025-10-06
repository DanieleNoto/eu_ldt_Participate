import test, { expect } from '@playwright/test';
import { ProcessTestDataGenerator } from '@fixtures/process-fixtures';
import { AdminHomePage } from '@pages/pages/admin/AdminHomePage';
import { ProcessAdminPage } from '@pages/pages/admin/processes/ProcessAdminPage';
import { UpdateProcessAdminPage } from '@pages/pages/admin/processes/detail/UpdateProcessAdminPage';
import { AttachmentsProcessPage } from '@pages/pages/admin/processes/detail/attachments/AttachmentsProcessPage';
import { NewAttachmentProcessPage } from '@pages/pages/admin/processes/detail/attachments/NewAttachmentProcessPage';
import { SurveysManagePage } from '@pages/pages/admin/processes/detail/components/surveys/SurveysManagePage';
import { ensureLoggedIn } from '@utils/auth-helper';
import { STORAGE_STATE } from '@utils/constants';
import * as fs from 'fs';
import * as path from 'path';
import { tmpdir } from 'os';

/**
 * Allows administrators to upload files as attachments to a specific participatory process, making them visible to citizens to enhance context and provide additional information.
 * User Story: As an Administrator, I want to upload files as attachments to a specific process so that citizens can access additional documents and resources related to the process.
 * Requirements: PAR R21
 * Prerequisites:
 * - The City Administrator has an active account on the platform and is logged in.
 * - The process to which the files will be uploaded is already created and published.
 */
test.beforeAll(async ({ browser }) => {
	const context = await browser.newContext();
	const page = await context.newPage();
	await ensureLoggedIn(page, 'ADMIN');
	await page.close();
	await context.close();
});

test.describe('[PAR-DI001] – Upload file on specific process', () => {
	test.use({ storageState: STORAGE_STATE.ADMIN });
	let adminHomePage: AdminHomePage;
	let processAdminPage: ProcessAdminPage;
	let updateProcessAdminPage: UpdateProcessAdminPage;
	let attachmentsProcessPage: AttachmentsProcessPage;
	let newAttachmentProcessPage: NewAttachmentProcessPage;
	let surveysManagePage: SurveysManagePage;
	let validProcessData: any;
	let processEditUrl: string;

	// Attachment test data
	const attachmentTitle = 'Test Attachment';
	const attachmentDescription = 'This is a test attachment with a link';
	// Array of fallback URLs in case one is unreachable
	const attachmentLinkOptions = [
		'https://decidim.org/images/decidim-logo-claim.svg',
		'https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Decidim-logo.svg/254px-Decidim-logo.svg.png?20240902225349',
		'https://interoperable-europe.ec.europa.eu/sites/default/files/2023-09/Decidim_0.png'
	];

	test.beforeEach(async ({ page }) => {
		adminHomePage = new AdminHomePage(page);
		processAdminPage = new ProcessAdminPage(page);
		updateProcessAdminPage = new UpdateProcessAdminPage(page);
		attachmentsProcessPage = new AttachmentsProcessPage(page);
		newAttachmentProcessPage = new NewAttachmentProcessPage(page);
		surveysManagePage = new SurveysManagePage(page);
		validProcessData = ProcessTestDataGenerator.generateValidProcessData();

		// Setup test environment
		await setupTestProcess();
	});

	/**
	 * Setup test environment by creating a new test process as prerequisite
	 */
	async function setupTestProcess() {
		await test.step('Setup: Create new test process as prerequisite', async () => {
			const { processSlug: slug, processEditUrl: url } = await surveysManagePage.setupTestProcess(
				validProcessData,
				adminHomePage,
				processAdminPage,
				true // publish the process
			);
			processEditUrl = url;
			console.log('Test process setup completed');
		});
	}

	test.describe('Main Flow', () => {
		let attachmentLink: string;

		test.beforeEach(async () => {
			// Find an accessible URL for the attachment
			attachmentLink = await NewAttachmentProcessPage.findAccessibleUrl(attachmentLinkOptions);
		});

		test('should add attachment with link to specific process', async ({ page }) => {
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

			await test.step('3. User: Selects the process that want to update.', async () => {
				// Search for our created process by title and select it
				await surveysManagePage.searchAndSelectProcess(validProcessData.general.title);
				console.log('Selected process to update');
			});

			await test.step('4. System: Loads the selected process and displays the content in an editable form, including all existing information.', async () => {
				await page.waitForURL(processEditUrl);
				await page.waitForLoadState('networkidle');

				// Verify we're on the edit page with process information using Page Object
				await updateProcessAdminPage.expectToBeOnUpdateProcessPage();
				console.log('Process loaded with editable form containing existing information');
			});

			await test.step('5. User: Navigates to the "Attachments" section in the admin panel.', async () => {
				await updateProcessAdminPage.navigateToAttachments();
				console.log('Navigated to Attachments section');
			});

			await test.step('6. User: Clicks on "New Attachment".', async () => {
				await attachmentsProcessPage.clickNewAttachment();
				console.log('Clicked on New Attachment button');
			});

			await test.step('7. System: Displays new attachment page.', async () => {
				await page.waitForURL(/\/admin\/participatory_processes\/.*\/attachments\/new/);
				await page.waitForLoadState('networkidle');

				// Verify we're on the new attachment page with the form visible
				await newAttachmentProcessPage.expectToBeOnNewAttachmentPage();
				console.log('New attachment page displayed with form');
			});

			await test.step('8. User: Fulfil all info inside the page: Attachment name, Description, File/URL', async () => {
				// Click on Link tab to use URL instead of file upload
				await newAttachmentProcessPage.clickLinkTab();

				// Fill the attachment form with test data
				await newAttachmentProcessPage.fillAttachmentForm({
					title: attachmentTitle,
					description: attachmentDescription,
					link: attachmentLink
				});

				console.log('Filled attachment form with title, description and link');
			});

			await test.step('9. User: Clicks the "Create attachment" button to confirm the action.', async () => {
				await newAttachmentProcessPage.submitForm();
				console.log('Clicked Create attachment button');
			});

			await test.step('10. System: Displays a confirmation message indicating that the attachment has been successfully created.', async () => {
				// Verify success message
				await newAttachmentProcessPage.expectAttachmentCreatedSuccessMessage();
				console.log('Success message "Attachment created" is displayed');

				// Wait for redirect to attachments list page
				await page.waitForURL(/\/admin\/participatory_processes\/.*\/attachments$/);
				await page.waitForLoadState('networkidle');

				// Verify the attachment appears in the table
				await attachmentsProcessPage.expectAttachmentWithTitleExists(attachmentTitle);
				console.log(`Attachment "${attachmentTitle}" found in the attachments table`);
			});
		});
	});

	test.describe('Alternative Flow - File upload with invalid extension or size', () => {
		let invalidFilePath: string;

		test.beforeEach(async () => {
			// Create a dummy file with invalid extension in system temp directory
			const tempDir = tmpdir();
			invalidFilePath = path.join(tempDir, `invalid-file-${Date.now()}.notvalidext`);

			// Create the file with some dummy content
			fs.writeFileSync(invalidFilePath, 'This is a test file with invalid extension');
			console.log(`Created invalid test file: ${invalidFilePath}`);
		});

		test.afterEach(async () => {
			// Clean up: delete the dummy file after the test
			try {
				if (invalidFilePath && fs.existsSync(invalidFilePath)) {
					fs.unlinkSync(invalidFilePath);
					console.log(`Deleted invalid test file: ${invalidFilePath}`);
				}
			} catch (error) {
				// Log the error but don't fail the test cleanup
				console.error(
					`Failed to delete test file ${invalidFilePath}:`,
					error instanceof Error ? error.message : String(error)
				);
			}
		});

		test('should upload file on specific process - invalid file extension or file size exceeded', async ({
			page
		}) => {
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

			await test.step('3. User: Selects the process that want to update.', async () => {
				// Search for our created process by title and select it
				await surveysManagePage.searchAndSelectProcess(validProcessData.general.title);
				console.log('Selected process to update');
			});

			await test.step('4. System: Loads the selected process and displays the content in an editable form, including all existing information.', async () => {
				await page.waitForURL(processEditUrl);
				await page.waitForLoadState('networkidle');

				// Verify we're on the edit page with process information using Page Object
				await updateProcessAdminPage.expectToBeOnUpdateProcessPage();
				console.log('Process loaded with editable form containing existing information');
			});

			await test.step('5. User: Navigates to the "Attachments" section in the admin panel.', async () => {
				await updateProcessAdminPage.navigateToAttachments();
				console.log('Navigated to Attachments section');
			});

			await test.step('6. User: Clicks on "New Attachment".', async () => {
				await attachmentsProcessPage.clickNewAttachment();
				console.log('Clicked on New Attachment button');
			});

			await test.step('7. System: Displays new attachment page.', async () => {
				await page.waitForURL(/\/admin\/participatory_processes\/.*\/attachments\/new/);
				await page.waitForLoadState('networkidle');

				// Verify we're on the new attachment page with the form visible
				await newAttachmentProcessPage.expectToBeOnNewAttachmentPage();
				console.log('New attachment page displayed with form');
			});

			await test.step('8. User: Fulfil all info inside the page: Attachment name, Description, File/URL', async () => {
				// Fill title and description
				await newAttachmentProcessPage.fillAttachmentForm({
					title: attachmentTitle,
					description: attachmentDescription
				});

				// Click on "Add file" button to open file upload dialog
				await newAttachmentProcessPage.clickAddFile();

				console.log('Filled attachment form and clicked Add file button');

				// Upload the invalid file directly (bypasses the Select file button)
				await newAttachmentProcessPage.uploadFile(invalidFilePath);

				console.log('Uploaded file with invalid extension');
			});

			await test.step('9. System: Displays an error message indicating that the file does not meet the criteria.', async () => {
				// Verify validation error message is visible
				await newAttachmentProcessPage.expectValidationErrorMessage();

				console.log('Validation error message displayed for invalid file');
			});
		});
	});
});
