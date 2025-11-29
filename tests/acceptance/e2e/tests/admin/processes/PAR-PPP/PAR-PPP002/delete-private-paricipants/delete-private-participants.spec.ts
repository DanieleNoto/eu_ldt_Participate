/* SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Gianfranco Cedro
 */

import { ProcessTestDataGenerator } from '@fixtures/process-fixtures';
import { ConfirmDeleteModalComponent } from '@pages/components/common/ConfirmDeleteModalComponent';
import { AdminHomePage } from '@pages/pages/admin/AdminHomePage';
import { PrivateParticipantsPage } from '@pages/pages/admin/processes/detail/private-participants/PrivateParticipantsPage';
import { UpdateProcessAdminPage } from '@pages/pages/admin/processes/detail/UpdateProcessAdminPage';
import { ProcessAdminPage } from '@pages/pages/admin/processes/ProcessAdminPage';
import { test, expect } from '@fixtures/parallel-test';

/**
 * Test suite for Allows City Administrators to delete an Existing Participant of the process.
 *
 * User Story: As a City Administrator, I want to delete an Existing Participant of the process.
 *
 * Requirements: PAR R8
 *
 * Prerequisites:
 * - The City Administrator has an active account on the platform and is logged in.
 * - The process has already been created.
 * - The Participant has already been linked to the process.
 */

test.describe('[PAR-PPP002] – Delete an existing participant (only if the process is private)', () => {
	let adminHomePage: AdminHomePage;
	let processAdminPage: ProcessAdminPage;
	let updateProcessAdminPage: UpdateProcessAdminPage;
	let privateParticipantsPage: PrivateParticipantsPage;
	let confirmDeleteModalComponent: ConfirmDeleteModalComponent;
	let validProcessData: any;

	test.beforeEach(async ({ adminPage }) => {
		validProcessData = ProcessTestDataGenerator.generateValidProcessData();
		adminHomePage = new AdminHomePage(adminPage);
		processAdminPage = new ProcessAdminPage(adminPage);
		updateProcessAdminPage = new UpdateProcessAdminPage(adminPage);
		privateParticipantsPage = new PrivateParticipantsPage(adminPage);
		confirmDeleteModalComponent = new ConfirmDeleteModalComponent(adminPage);
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
		test('should delete private participants from private process', async () => {
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
			await test.step('5. User: Navigates to the "Private Participants" section within the process management interface.', async () => {
				await updateProcessAdminPage.navigateToPrivateParticipants();
			});
			await test.step('6. System: Displays a list of current participants and provides options to add or remove participants.', async () => {
				await privateParticipantsPage.expectToBeOnPrivateParticipantsPage();
				await privateParticipantsPage.expectTableIsVisible();
				countPreviousDelete = await privateParticipantsPage.getRowsCount();
			});
			await test.step('7. User: Selects an existing participant to remove.', async () => {
				await privateParticipantsPage.clickDelete(0);
			});
			await test.step('8. System: Prompts the user to confirm the removal. ', async () => {
				await confirmDeleteModalComponent.expectModalVisible();
			});
			await test.step('9. User: Confirms the removal.', async () => {
				await confirmDeleteModalComponent.clickOK();
			});
			await test.step('10. System: Removes the selected user from the list of participants for the private process.', async () => {
				await privateParticipantsPage.waitForLoadState('networkidle');
				await privateParticipantsPage.expectToBeOnPrivateParticipantsPage();
				await privateParticipantsPage.expectSearchResultsCount(countPreviousDelete - 1);
			});
			await test.step('11. System: Notifies the City Administrator that the participant has been successfully removed.', async () => {
				await privateParticipantsPage.expectSuccessFlashMessage(
					'Participatory space private participant access successfully destroyed.'
				);
			});
			await test.step('Result.', async () => {
				expect(countPreviousDelete).toBeGreaterThan(0);
				await privateParticipantsPage.expectSearchResultsCount(countPreviousDelete - 1);
			});
		});
	});

	test.describe('Alternative Flow', () => {
		test('should can abort delete private participants from private process', async () => {
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
			await test.step('5. User: Navigates to the "Private Participants" section within the process management interface.', async () => {
				await updateProcessAdminPage.navigateToPrivateParticipants();
			});
			await test.step('6. System: Displays a list of current participants and provides options to add or remove participants.', async () => {
				await privateParticipantsPage.expectToBeOnPrivateParticipantsPage();
				await privateParticipantsPage.expectTableIsVisible();
				countPreviousDelete = await privateParticipantsPage.getRowsCount();
			});
			await test.step('7. User: Selects an existing participant to remove.', async () => {
				await privateParticipantsPage.clickDelete(0);
			});
			await test.step('8. System: Prompts the user to confirm the removal. ', async () => {
				await confirmDeleteModalComponent.expectModalVisible();
			});
			await test.step('9.1. User: Decides not to proceed and clicks "Cancel" or navigates away.', async () => {
				await confirmDeleteModalComponent.clickCancel();
				await confirmDeleteModalComponent.expectModalNotVisible();
			});
			await test.step('9.2. System: Aborts the participant deletion process and returns to the list of participants.', async () => {
				await privateParticipantsPage.waitForLoadState('networkidle');
				await privateParticipantsPage.expectToBeOnPrivateParticipantsPage();
			});
			await test.step('Result.', async () => {
				await privateParticipantsPage.expectSearchResultsCount(countPreviousDelete);
			});
		});
	});
});
