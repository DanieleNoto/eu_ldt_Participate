import { ProcessTestDataGenerator } from '@fixtures/process-fixtures';
import { UploadFileModalComponent } from '@pages/components/admin/process/detail/UploadFileModalComponent';
import { AdminHomePage } from '@pages/pages/admin/AdminHomePage';
import { ImportCsvPage } from '@pages/pages/admin/processes/detail/private-participants/ImportCsvPage';
import { NewPrivateParticipantFormPage } from '@pages/pages/admin/processes/detail/private-participants/NewParticipantsPage';
import { PrivateParticipantsPage } from '@pages/pages/admin/processes/detail/private-participants/PrivateParticipantsPage';
import { UpdateProcessAdminPage } from '@pages/pages/admin/processes/detail/UpdateProcessAdminPage';
import { ProcessAdminPage } from '@pages/pages/admin/processes/ProcessAdminPage';
import test, { expect } from '@playwright/test';
import { ensureLoggedIn } from '@utils/auth-helper';
import { STORAGE_STATE } from '@utils/constants';

/**
 * Test suite for Allows City Administrators to manage participants for a private process by specifying who can participate through a form or CSV import, ensuring that only authorized individuals have access to the process and its activities.
 *
 * User Story: As a City Administrator, I want to manage participants for a private process by specifying who can participate, so that I can ensure only authorized individuals have access to the process and its activities.
 *
 * Requirements: PAR R8, PAR R12c
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
test.describe('[PAR-PPP001] – Manage private participants (Only If the process is private)', () => {
	test.use({ storageState: STORAGE_STATE.ADMIN });
	let adminHomePage: AdminHomePage;
	let processAdminPage: ProcessAdminPage;
	let updateProcessAdminPage: UpdateProcessAdminPage;
	let privateParticipantsPage: PrivateParticipantsPage;
	let newPrivateParticipantFormPage: NewPrivateParticipantFormPage;
	let importCsvPage: ImportCsvPage;
	let uploadFileModalComponent: UploadFileModalComponent;
	let validProcessData: any;

	test.beforeEach(async ({ page }) => {
		validProcessData = ProcessTestDataGenerator.generateValidProcessData();
		adminHomePage = new AdminHomePage(page);
		processAdminPage = new ProcessAdminPage(page);
		updateProcessAdminPage = new UpdateProcessAdminPage(page);
		privateParticipantsPage = new PrivateParticipantsPage(page);
		newPrivateParticipantFormPage = new NewPrivateParticipantFormPage(page);
		importCsvPage = new ImportCsvPage(page);
		uploadFileModalComponent = new UploadFileModalComponent(page);
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
		test('should add private participants to private process', async () => {
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
			await test.step('5. User: Navigates to the "Private Participants" section within the process management interface.', async () => {
				await updateProcessAdminPage.navigateToPrivateParticipants();
			});
			await test.step('6. System: Displays a list of current participants and provides options to add or remove participants.', async () => {
				await privateParticipantsPage.expectToBeOnPrivateParticipantsPage();
			});
			await test.step('7. User: Clicks on "Add New Participant" button.', async () => {
				await privateParticipantsPage.clickNewPrivateUser();
			});
			await test.step("8. User: Fills in the form with the participant's details: 1. Name 2. Email Address. ", async () => {
				await newPrivateParticipantFormPage.expectToBeOnNewPrivateParticipantsPage();
				await newPrivateParticipantFormPage.fillName('Test User');
				await newPrivateParticipantFormPage.fillEmail('testuser@example.com');
			});
			await test.step('9. User: Clicks on "Save Participant" to add the new participant.', async () => {
				await newPrivateParticipantFormPage.submitForm();
			});
			await test.step('10. System: Validates the participant information for completeness and correctness.', async () => {
				await privateParticipantsPage.waitForLoadState('networkidle');
				await privateParticipantsPage.expectToBeOnPrivateParticipantsPage();
			});
			await test.step('11. System: Saves the new participant and updates the list of participants for the private process.', async () => {
				await privateParticipantsPage.expectParticipantIsInTable('Test User', 'testuser@example.com');
			});
			await test.step('12. System: Notifies the City Administrator that the new participant has been successfully added.', async () => {
				await privateParticipantsPage.expectSuccessFlashMessage(
					'Participatory space private participant access successfully created.'
				);
			});
			await test.step('Result.', async () => {
				await privateParticipantsPage.expectParticipantIsInTable('Test User', 'testuser@example.com');
			});
		});
	});

	test.describe('Alternative Flow', () => {
		test('should can import users via CSV file', async () => {
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
			await test.step('5. User: Navigates to the "Private Participants" section within the process management interface.', async () => {
				await updateProcessAdminPage.navigateToPrivateParticipants();
			});
			await test.step('6. System: Displays a list of current participants and provides options to add or remove participants.', async () => {
				await privateParticipantsPage.expectToBeOnPrivateParticipantsPage();
				await privateParticipantsPage.expectTableIsVisible();
			});
			await test.step('7.1. User: Clicks on "Import Participants via CSV" button.', async () => {
				await privateParticipantsPage.clickImportViaCSV();
			});
			await test.step('7.2. User: Selects a CSV file from the local device.', async () => {
				await importCsvPage.expectToBeOnImportCsvPage();
				await importCsvPage.clickAddFile();
				await uploadFileModalComponent.expectModalVisible();
				await uploadFileModalComponent.uploadTestCsv();
			});
			await test.step('7.3. System: Validates the file format (e.g., CSV) and checks for mandatory fields (name and email).', async () => {
				await uploadFileModalComponent.clickSave();
				await uploadFileModalComponent.expectModalNotVisible();
				await importCsvPage.submitForm();
			});
			await test.step('7.4. System: Saves all valid participants from the CSV file to the list of participants for the private process.', async () => {
				await importCsvPage.waitForTimeout(1500);
				await privateParticipantsPage.getPage().waitForLoadState('networkidle');
				await privateParticipantsPage.expectToBeOnPrivateParticipantsPage();
			});
			await test.step('7.5. System: Notifies the City Administrator that participants have been successfully imported and added.', async () => {
				await privateParticipantsPage.expectSuccessFlashMessage(
					'CSV file uploaded successfully, we are sending an invitation email to participants. This might take a while.'
				);
			});
			await test.step('Result.', async () => {
				await privateParticipantsPage.expectParticipantIsInTable('John Doe', 'john.doe@example.org');
				await privateParticipantsPage.expectParticipantIsInTable('Jane Doe', 'jane.doe@example.org');
				await privateParticipantsPage.expectParticipantIsInTable('Mario Rossi', 'mario.rossi@example.org');
				await privateParticipantsPage.expectParticipantIsInTable('Anna Bianchi', 'anna.bianchi@example.org');
			});
		});
	});
	test.describe('Alternative Flow', () => {
		test('should show validation error on import users via CSV with wrong file', async () => {
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
			await test.step('5. User: Navigates to the "Private Participants" section within the process management interface.', async () => {
				await updateProcessAdminPage.navigateToPrivateParticipants();
			});
			await test.step('6. System: Displays a list of current participants and provides options to add or remove participants.', async () => {
				await privateParticipantsPage.expectToBeOnPrivateParticipantsPage();
				await privateParticipantsPage.expectTableIsVisible();
			});
			await test.step('7.1. User: Clicks on "Import Participants via CSV" button.', async () => {
				await privateParticipantsPage.clickImportViaCSV();
			});
			await test.step('10.1. System: Detects errors or missing mandatory fields in the participant form or CSV file.', async () => {
				await importCsvPage.expectToBeOnImportCsvPage();
				await importCsvPage.clickAddFile();
				await uploadFileModalComponent.expectModalVisible();
				await uploadFileModalComponent.uploadNotValidTestImage();
			});
			await test.step('10.2. System: Highlights the invalid fields and provides appropriate error messages.', async () => {
				await uploadFileModalComponent.expectNotValidTestFileHasError();
			});
			await test.step('10.3. User: Corrects the errors and resubmits the form or CSV file.', async () => {
				await uploadFileModalComponent.clickRemove();
				await uploadFileModalComponent.uploadTestCsv();
				await uploadFileModalComponent.clickSave();
				await uploadFileModalComponent.expectModalNotVisible();
				await importCsvPage.submitForm();
				await importCsvPage.waitForTimeout(1500);
				await privateParticipantsPage.getPage().waitForLoadState('networkidle');
				await privateParticipantsPage.expectToBeOnPrivateParticipantsPage();
			});
			await test.step('Result.', async () => {
				await privateParticipantsPage.expectParticipantIsInTable('John Doe', 'john.doe@example.org');
				await privateParticipantsPage.expectParticipantIsInTable('Jane Doe', 'jane.doe@example.org');
				await privateParticipantsPage.expectParticipantIsInTable('Mario Rossi', 'mario.rossi@example.org');
				await privateParticipantsPage.expectParticipantIsInTable('Anna Bianchi', 'anna.bianchi@example.org');
			});
		});
	});
	test.describe('Alternative Flow', () => {
		test('should show validation error when form is not filled correctly', async () => {
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
			await test.step('5. User: Navigates to the "Private Participants" section within the process management interface.', async () => {
				await updateProcessAdminPage.navigateToPrivateParticipants();
			});
			await test.step('6. System: Displays a list of current participants and provides options to add or remove participants.', async () => {
				await privateParticipantsPage.expectToBeOnPrivateParticipantsPage();
				await privateParticipantsPage.expectTableIsVisible();
			});
			await test.step('7. User: Clicks on "Add New Participant" button.', async () => {
				await privateParticipantsPage.clickNewPrivateUser();
			});
			await test.step("8. User: Fills in the form with the participant's details: 1. Name 2. Email Address. ", async () => {
				await newPrivateParticipantFormPage.expectToBeOnNewPrivateParticipantsPage();
			});
			await test.step('9. User: Clicks on "Save Participant" to add the new participant.', async () => {
				await newPrivateParticipantFormPage.submitForm();
			});
			await test.step('10.1. System: Detects errors or missing mandatory fields in the participant form or CSV file.', async () => {
				await newPrivateParticipantFormPage.expectFormValidationError();
			});
			await test.step('10.2. System: Highlights the invalid fields and provides appropriate error messages.', async () => {
				await newPrivateParticipantFormPage.expectFormValidationError();
			});
			await test.step('10.3. User: Corrects the errors and resubmits the form or CSV file.', async () => {
				await newPrivateParticipantFormPage.expectToBeOnNewPrivateParticipantsPage();
				await newPrivateParticipantFormPage.fillName('Test User');
				await newPrivateParticipantFormPage.fillEmail('testuser@example.com');
				await newPrivateParticipantFormPage.submitForm();
				await privateParticipantsPage.waitForLoadState('networkidle');
				await privateParticipantsPage.expectToBeOnPrivateParticipantsPage();
				await privateParticipantsPage.expectSuccessFlashMessage(
					'Participatory space private participant access successfully created.'
				);
			});
			await test.step('Result.', async () => {
				await privateParticipantsPage.expectParticipantIsInTable('Test User', 'testuser@example.com');
			});
		});
	});
});
