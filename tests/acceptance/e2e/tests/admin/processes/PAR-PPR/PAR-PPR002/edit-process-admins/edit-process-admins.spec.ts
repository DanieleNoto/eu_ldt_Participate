/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Simone Bianchelli
 * Gianfranco Cedro
 */

import { ProcessTestDataGenerator } from '@fixtures/process-fixtures';
import { AdminHomePage } from '@pages/pages/admin/AdminHomePage';
import { NewAdminPage } from '@pages/pages/admin/processes/detail/admins/NewAdminPage';
import { ParticipatoryProcessAdminsPage } from '@pages/pages/admin/processes/detail/admins/ParticipatoryProcessAdminsPage';
import { UpdateProcessAdminPage } from '@pages/pages/admin/processes/detail/UpdateProcessAdminPage';
import { ProcessAdminPage } from '@pages/pages/admin/processes/ProcessAdminPage';
import { test, expect } from '@fixtures/parallel-test';

/**
 * Test suite for Allows City Administrators to edit a Process Administrator role.
 *
 * User Story: 	As a City Administrator, I want to edit a Process Administrator role.
 *
 * Requirements: PAR R8
 *
 * Prerequisites:
 * - The City Administrator has an active account on the platform and is logged in.
 * - The process has already been created.
 * - The Process Administrator has already been linked to the process.
 */

test.describe('[PAR-PPR002] – Edit process administrator role', () => {
	let adminHomePage: AdminHomePage;
	let processAdminPage: ProcessAdminPage;
	let updateProcessAdminPage: UpdateProcessAdminPage;
	let participatoryProcessAdminsPage: ParticipatoryProcessAdminsPage;
	let newAdminPage: NewAdminPage;

	let validProcessData: any;
	let editedAdminName: string;
	let editedAdminEmail: string;

	test.beforeEach(async ({ adminPage }) => {
		validProcessData = ProcessTestDataGenerator.generateValidProcessData();
		adminHomePage = new AdminHomePage(adminPage);
		processAdminPage = new ProcessAdminPage(adminPage);
		updateProcessAdminPage = new UpdateProcessAdminPage(adminPage);
		participatoryProcessAdminsPage = new ParticipatoryProcessAdminsPage(adminPage);
		newAdminPage = new NewAdminPage(adminPage);
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
		test('should allow admin to edit admins role of process', async () => {
			await test.step('1. User: navigates to the "Processes" section', async () => {
				// Navigate to processes section
				await adminHomePage.navigateViaAdminNav('processes');
				await processAdminPage.waitForLoadState('load');

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
				await processAdminPage.getPage().waitForLoadState('load');
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
			});
			await test.step('7. User: Select a specific Process Admin that want to edit', async () => {
				editedAdminName = await participatoryProcessAdminsPage.getAdminNameAtRow(0);
				editedAdminEmail = await participatoryProcessAdminsPage.getAdminEmailAtRow(0);
				await participatoryProcessAdminsPage.performActionOnRow(0, 'edit');
			});
			await test.step('8. System: Displays the current permissions assigned to the administrator.', async () => {
				await newAdminPage.expectToBeOnEditAdminPage();
			});
			await test.step('9. User: Makes changes to the role.', async () => {
				await newAdminPage.selectRole('collaborator');
			});
			await test.step('10. User: Clicks on "Save Changes" to update the administrator\'s permissions.', async () => {
				await newAdminPage.submitForm();
			});
			await test.step('11. System: Validates the updated permissions.', async () => {
				await participatoryProcessAdminsPage.waitForLoadState('load');
			});
			await test.step('12. System: Saves the updated permissions for the administrator.', async () => {
				await participatoryProcessAdminsPage.expectToBeOnParticipatoryProcessAdminsPage();
			});
			await test.step('12. System: Notifies the City Administrator that the permissions have been successfully updated.', async () => {
				await participatoryProcessAdminsPage.expectSuccessFlashMessage(
					'Admin successfully updated for this participatory process.'
				);
			});
			await test.step('Result.', async () => {
				await participatoryProcessAdminsPage.expectAdminIsInTable(editedAdminName, editedAdminEmail);
				const newRole = await participatoryProcessAdminsPage.getRoleForAdmin(editedAdminEmail);
				expect(newRole.toLowerCase()).toBe('collaborator');
			});
		});
	});
});
