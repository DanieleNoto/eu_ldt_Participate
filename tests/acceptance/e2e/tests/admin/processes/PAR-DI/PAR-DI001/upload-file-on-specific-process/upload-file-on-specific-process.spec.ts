import test, { expect } from '@playwright/test';
import { ProcessTestDataGenerator } from '@fixtures/process-fixtures';
import { AdminHomePage } from '@pages/pages/admin/AdminHomePage';
import { ProcessAdminPage } from '@pages/pages/admin/processes/ProcessAdminPage';
import { UpdateProcessAdminPage } from '@pages/pages/admin/processes/detail/UpdateProcessAdminPage';
import { AttachmentsProcessPage } from '@pages/pages/admin/processes/detail/attachments/AttachmentsProcessPage';
import { NewAttachmentProcessPage } from '@pages/pages/admin/processes/detail/attachments/NewAttachmentProcessPage';
import { SurveysManagePage } from '@pages/pages/admin/processes/detail/components/surveys/SurveysManagePage';
import { LandingPageAdminPage } from '@pages/pages/admin/processes/detail/LandingPageAdminPage';
import { ProcessDetailPage } from '@pages/pages/public/processes/ProcessDetailPage';
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
	let landingPageAdminPage: LandingPageAdminPage;
	let validProcessData: any;
	let processEditUrl: string;
	let processSlug: string;

	// Attachment test data
	const attachmentTitle = 'Test attachment';
	const attachmentDescription = 'Test attachment description';
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
		landingPageAdminPage = new LandingPageAdminPage(page);
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
			processSlug = slug;
			processEditUrl = url;
			console.log('Test process setup completed');
		});
	}

	test.describe('Main Flow', () => {
		let validFilePath: string;

		test.beforeEach(async () => {
			// Create a valid .txt file with dummy content in system temp directory
			const tempDir = tmpdir();
			validFilePath = path.join(tempDir, `valid-attachment-${Date.now()}.txt`);

			// Create the file with dummy content
			const loremIpsum = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. 
Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. 
Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`;

			fs.writeFileSync(validFilePath, loremIpsum, 'utf-8');
			console.log(`Created valid test file: ${validFilePath}`);
		});

		test.afterEach(async () => {
			// Clean up: delete the valid file after the test
			try {
				if (validFilePath && fs.existsSync(validFilePath)) {
					fs.unlinkSync(validFilePath);
					console.log(`Deleted valid test file: ${validFilePath}`);
				}
			} catch (error) {
				console.error(
					`Failed to delete test file ${validFilePath}:`,
					error instanceof Error ? error.message : String(error)
				);
			}
		});

		test('should upload file on specific process', async ({ page }) => {
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

				// Upload the valid file
				await newAttachmentProcessPage.uploadFile(validFilePath);

				console.log('Uploaded file with valid extension');

				// Extract filename from the full path
				const fileName = path.basename(validFilePath);

				// Wait for file to be validated and uploaded successfully
				await newAttachmentProcessPage.expectFileUploadedSuccessfully(fileName);
				console.log(`File "${fileName}" validated and uploaded successfully`);

				// Click Save button in the upload modal
				await newAttachmentProcessPage.clickSaveButton();
				console.log('Clicked Save button in upload modal');

				// Verify the uploaded file appears in the list (after Save)
				await newAttachmentProcessPage.expectUploadedFileVisible(fileName);
				console.log(`Uploaded file "${fileName}" is visible in the upload list`);
			});

			await test.step('9. User: Clicks the "Create attachment" button to confirm the action. ', async () => {
				await newAttachmentProcessPage.submitForm();
				console.log('Clicked Create attachment button');
			});

			await test.step('10. System: Displays a confirmation message indicating that the file was successfully uploaded', async () => {
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

			await test.step('11. User: Confirm that the uploaded file is visible to citizens on the process page', async () => {
				// Use the sidebar component to navigate to Landing page
				await updateProcessAdminPage.sidebarProcessDetail.navigateToLandingPage();

				// Verify we're on the landing page edit URL
				await page.waitForURL(/\/admin\/participatory_processes\/.*\/landing_page\/edit/);
				await page.waitForLoadState('networkidle');

				console.log('Navigated to Landing page configuration');

				// Add "Related documents" content block
				await landingPageAdminPage.openContentBlockDropdown();
				await landingPageAdminPage.clickRelatedDocuments();
				await landingPageAdminPage.expectContentBlockSuccessMessage();

				console.log('Added "Related documents" content block to inactive list');

				// Move it to active content blocks
				try {
					await landingPageAdminPage.dragRelatedDocumentsToActive();

					// Verify the drag operation was successful
					await landingPageAdminPage.expectRelatedDocumentsInActiveList();

					console.log('Successfully moved "Related documents" to active content blocks');
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
					console.error('Drag and drop failed:', errorMessage);
					throw new Error(`Failed to move "Related documents" to active content blocks: ${errorMessage}`);
				}

				// Load user authentication state
				const userContext = await page.context().browser()?.newContext({
					storageState: STORAGE_STATE.USER
				});

				if (!userContext) {
					throw new Error('Failed to create user context');
				}

				const userPage = await userContext.newPage();

				// Navigate to the public process page
				await userPage.goto(`/processes/${processSlug}`);
				await userPage.waitForLoadState('networkidle');

				console.log(`Navigated to public process page: /processes/${processSlug}`);

				// Verify that the attachment is visible and downloadable on the public page
				const processDetailPage = new ProcessDetailPage(userPage);
				try {
					await processDetailPage.verifyAndDownloadAttachment(attachmentTitle);
					console.log(`Attachment "${attachmentTitle}" is visible and downloadable on public process page`);
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
					console.error(`Attachment verification failed: ${errorMessage}`);
					throw new Error(`Failed to verify attachment on public page: ${errorMessage}`);
				}

				await userPage.close();
				await userContext.close();

				console.log(
					'Verified attachment file visibility and download functionality on public process page as user'
				);
			});
		});
	});

	test.describe('Alternative Flow - Upload Attachment with link', () => {
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

			await test.step('11. User: Confirm that the uploaded file is visible to citizens on the process page', async () => {
				// Use the sidebar component to navigate to Landing page
				await updateProcessAdminPage.sidebarProcessDetail.navigateToLandingPage();

				// Verify we're on the landing page edit URL
				await page.waitForURL(/\/admin\/participatory_processes\/.*\/landing_page\/edit/);
				await page.waitForLoadState('networkidle');

				console.log('Navigated to Landing page configuration');

				// Add "Related documents" content block
				await landingPageAdminPage.openContentBlockDropdown();
				await landingPageAdminPage.clickRelatedDocuments();
				await landingPageAdminPage.expectContentBlockSuccessMessage();

				console.log('Added "Related documents" content block to inactive list');

				// Move it to active content blocks
				try {
					await landingPageAdminPage.dragRelatedDocumentsToActive();

					// Verify the drag operation was successful
					await landingPageAdminPage.expectRelatedDocumentsInActiveList();

					console.log('Successfully moved "Related documents" to active content blocks');
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
					console.error('Drag and drop failed:', errorMessage);
					throw new Error(`Failed to move "Related documents" to active content blocks: ${errorMessage}`);
				}

				// Load user authentication state
				const userContext = await page.context().browser()?.newContext({
					storageState: STORAGE_STATE.USER
				});

				if (!userContext) {
					throw new Error('Failed to create user context');
				}

				const userPage = await userContext.newPage();

				// Navigate to the public process page
				await userPage.goto(`/processes/${processSlug}`);
				await userPage.waitForLoadState('networkidle');

				console.log(`Navigated to public process page: /processes/${processSlug}`);

				// Verify that the attachment link is visible and opens correctly on the public page
				const processDetailPage = new ProcessDetailPage(userPage);
				try {
					await processDetailPage.verifyAndOpenAttachmentLink(attachmentTitle, attachmentLink);

					console.log(
						`Attachment link "${attachmentTitle}" is visible and opens correctly on public process page`
					);
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
					console.error(`Attachment link verification failed: ${errorMessage}`);
					throw new Error(`Failed to verify attachment link on public page: ${errorMessage}`);
				}

				await userPage.close();
				await userContext.close();

				console.log('Verified attachment link visibility and functionality on public process page as user');
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

				// Upload the invalid file
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
