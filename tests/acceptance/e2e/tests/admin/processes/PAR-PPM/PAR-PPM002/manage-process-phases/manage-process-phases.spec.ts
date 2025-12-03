/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Simone Bianchelli
 * Gianfranco Cedro
 */

import { AdminHomePage } from '@pages/pages/admin/AdminHomePage';
import { NewPhasePage } from '@pages/pages/admin/processes/detail/phases/NewPhasesPage';
import { PhasesPage } from '@pages/pages/admin/processes/detail/phases/PhasesPage';
import { UpdateProcessAdminPage } from '@pages/pages/admin/processes/detail/UpdateProcessAdminPage';
import { ProcessAdminPage } from '@pages/pages/admin/processes/ProcessAdminPage';
import { test, expect } from '@fixtures/parallel-test';

/**
 * Test suite for Allows City Administrators to manage phases of the process, including defining the name, description, start date, and end date of each phase.
 *
 * User Story: As a City Administrator, I want to manage the phases of a process by specifying the name, description, start date, and end date so that I can clearly define the timeline and milestones of the process.
 *
 * Requirements: PAR R8
 *
 * Prerequisites:
 * - The City Administrator has an active account on the platform and is logged in.
 * - The process has already been created.
 */

test.describe('[PAR-PPM002] – Manage process phases', () => {
	let adminHomePage: AdminHomePage;
	let processAdminPage: ProcessAdminPage;
	let updateProcessAdminPage: UpdateProcessAdminPage;
	let phasePage: PhasesPage;
	let newPhasePage: NewPhasePage;

	test.beforeEach(async ({ adminPage }) => {
		adminHomePage = new AdminHomePage(adminPage);
		processAdminPage = new ProcessAdminPage(adminPage);
		updateProcessAdminPage = new UpdateProcessAdminPage(adminPage);
		phasePage = new PhasesPage(adminPage);
		newPhasePage = new NewPhasePage(adminPage);
		await adminHomePage.navigateToAdminHomePage();
	});

	test.describe('Main Flow', () => {
		test('should allow admin to add a new phase to process', async () => {
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
				await processAdminPage.editFirstProcess();
				await processAdminPage.getPage().waitForLoadState('networkidle');
			});
			await test.step('4. System: Loads the selected process and displays the content in an editable form, including all existing information', async () => {
				await updateProcessAdminPage.expectToBeOnUpdateProcessPage();
			});
			await test.step('5. User: Navigates to the "Phases" section within the process management interface.', async () => {
				await updateProcessAdminPage.navigateToPhases();
			});
			await test.step('6. System: Displays a list of existing phases (if any) and provides options to add, edit, or remove phases.', async () => {
				await phasePage.expectToBeOnPhasesPage();
			});
			await test.step('7. User: Click on new Phase button.', async () => {
				await phasePage.createNewPhase();
			});
			await test.step('8. User: Fills in phase details (name, description, start date, end date, cta info)', async () => {
				await newPhasePage.expectToBeOnNewPhasePage();
				await newPhasePage.fillTitle('Test Phase');
				await newPhasePage.fillDescription('This is a test phase.');
				await newPhasePage.fillStartDateTime('2023-01-01', '10:00');
				await newPhasePage.fillEndDateTime('2023-01-02', '12:00');
				await newPhasePage.fillCtaPath('test-phase');
				await newPhasePage.fillCtaText('Test Phase CTA');
			});
			await test.step('9. User: Clicks on "Save Changes" to confirm the addition of the new administrator.   ', async () => {
				await newPhasePage.clickCreatePhase();
			});
			await test.step('10. System: Validates the user selection and checks permissions.', async () => {
				await phasePage.waitForLoadState('networkidle');
				await phasePage.expectToBeOnPhasesPage();
			});
			await test.step('11. System: Adds the selected user as an administrator of the process.', async () => {
				await phasePage.expectPhaseIsInTable('Test Phase');
			});
			await test.step('12. System: Notifies the City Administrator that the new administrator has been successfully added..', async () => {
				await phasePage.expectSuccessFlashMessage('Participatory process phase successfully created.');
			});
			await test.step('Result.', async () => {
				await phasePage.expectPhaseIsInTable('Test Phase');
			});
		});
	});

	test.describe('Alternative Flow', () => {
		test('should show validation fail when add new phase with wrong field', async () => {
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
				await processAdminPage.editFirstProcess();
				await processAdminPage.getPage().waitForLoadState('networkidle');
			});
			await test.step('4. System: Loads the selected process and displays the content in an editable form, including all existing information', async () => {
				await updateProcessAdminPage.expectToBeOnUpdateProcessPage();
			});
			await test.step('5. User: Navigates to the "Process Admins" section within the process management interface.', async () => {
				await updateProcessAdminPage.navigateToPhases();
			});
			await test.step('6. System: Displays a list of existing phases (if any) and provides options to add, edit, or remove phases.', async () => {
				await phasePage.expectToBeOnPhasesPage();
			});
			await test.step('7. User: Click on new Phase button.', async () => {
				await phasePage.createNewPhase();
			});
			await test.step('8.1. User: Enters incomplete or incorrect phase details.', async () => {
				await newPhasePage.expectToBeOnNewPhasePage();
				await newPhasePage.fillTitle('');
				await newPhasePage.fillDescription('This is a test phase.');
				await newPhasePage.fillStartDateTime('2023-01-01', '10:00');
				await newPhasePage.fillEndDateTime('2023-01-02', '12:00');
				await newPhasePage.fillCtaPath('/wrong-path');
				await newPhasePage.fillCtaText('Test Phase CTA');
				await newPhasePage.clickCreatePhase();
			});
			await test.step('9.2. System: Validates the phase information and detects errors.', async () => {
				await newPhasePage.expectErrorFlashMessage(
					'There was a problem creating a new participatory process phase.'
				);
			});
			await test.step('9.3. System: Highlights the fields with errors and displays appropriate error messages. ', async () => {
				const isFormError = await newPhasePage.isFormErrorVisible();
				expect(isFormError).toBeTruthy();
			});
			await test.step('9.4. User: Corrects the errors in the user information.   ', async () => {
				await newPhasePage.fillTitle('Correct Phase Name');
				await newPhasePage.fillCtaPath('test-path');
				await newPhasePage.clickCreatePhase();
			});
			await test.step('Result.', async () => {
				await phasePage.expectPhaseIsInTable('Correct Phase Name');
			});
		});
	});
});
