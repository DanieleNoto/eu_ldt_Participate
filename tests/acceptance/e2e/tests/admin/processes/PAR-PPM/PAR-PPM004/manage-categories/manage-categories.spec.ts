/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Simone Bianchelli
 * Gianfranco Cedro
 */

import { AdminHomePage } from '@pages/pages/admin/AdminHomePage';
import { UpdateProcessAdminPage } from '@pages/pages/admin/processes/detail/UpdateProcessAdminPage';
import { ProcessAdminPage } from '@pages/pages/admin/processes/ProcessAdminPage';
import { test, expect } from '@fixtures/parallel-test';
import { NewTaxonomyPage } from '../../../../../../pages/pages/admin/taxonomies/NewTaxonomyPage';

/**
 * Test suite for Allows City Administrators to manage the categories of the process, which helps in organizing information and activities effectively.
 *
 * User Story: As a City Administrator, I want to manage the categories of the process so that I can organize information and activities, making it easier for participants to navigate and engage with relevant content.
 *
 * Requirements: PAR R8
 *
 * Prerequisites:
 * - The City Administrator has an active account on the platform and is logged in.
 * - The process has already been created.
 */

test.describe('[PAR-PPM004] – Manage categories in process', () => {
	let adminHomePage: AdminHomePage;
	let processAdminPage: ProcessAdminPage;
	let updateProcessAdminPage: UpdateProcessAdminPage;
	let newTaxonomyPage: NewTaxonomyPage;
	let timestamp: string;

	test.beforeEach(async ({ adminPage }) => {
		adminHomePage = new AdminHomePage(adminPage);
		processAdminPage = new ProcessAdminPage(adminPage);
		updateProcessAdminPage = new UpdateProcessAdminPage(adminPage);
		newTaxonomyPage = new NewTaxonomyPage(adminPage);

		// Generate timestamp for unique taxonomy names
		timestamp = Date.now().toString();

		await adminHomePage.navigateToAdminHomePage();
	});

	test.afterEach(async ({ adminPage }) => {
		// Clean up taxonomies created during tests
		await adminPage.goto('/admin/taxonomies');
		await newTaxonomyPage.waitForLoadState('networkidle');

		// Try to delete both taxonomies
		await newTaxonomyPage.deleteTaxonomyByName(`New Beautiful Taxonomy ${timestamp}`);
		await newTaxonomyPage.deleteTaxonomyByName(`New Updated Beautiful Taxonomy ${timestamp}`);
	});

	test.describe('Main Flow', () => {
		test('should allow admin to manage categories of process', async () => {
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
				await processAdminPage.processTable.editFirstProcess();
				await processAdminPage.getPage().waitForLoadState('networkidle');
			});
			await test.step('4. System: Loads the selected process and displays the content in an editable form, including all existing information', async () => {
				await updateProcessAdminPage.expectToBeOnUpdateProcessPage();
			});
			await test.step('5. User: Navigates to the "Manage categories" section within the process management interface.', async () => {
				await updateProcessAdminPage.navigateToTaxonomies();
			});
			await test.step('6. System: Displays a list of existing categories (if any) and provides options to add, edit, or remove categories.', async () => {
				await newTaxonomyPage.expectToBeOnTaxonomiesPage();
			});
			await test.step('7. User: Clicks on "Add New Category" button.', async () => {
				await newTaxonomyPage.createNewTaxonomy();
			});
			await test.step('8. User: Fills in the category details: 1. Name', async () => {
				await newTaxonomyPage.fillName(`New Beautiful Taxonomy ${timestamp}`);
			});
			await test.step('9. User: Clicks on "Save Category" to add the new category.', async () => {
				await newTaxonomyPage.submitForm();
			});
			await test.step('10. System: Validates the category information for completeness and correctness.', async () => {
				await newTaxonomyPage.waitForLoadState('networkidle');
				await newTaxonomyPage.expectToBeOnTaxonomiesPage();
			});
			await test.step('11. System: Saves the category details and updates the list of categories for the process.', async () => {
				await newTaxonomyPage.expectTaxonomyIsInTable(`New Beautiful Taxonomy ${timestamp}`);
			});
			await test.step('12. System: Notifies the City Administrator that the category has been successfully added.', async () => {
				await newTaxonomyPage.expectSuccessFlashMessage('Taxonomy created successfully.');
			});
			await test.step('Result.', async () => {
				await newTaxonomyPage.expectTaxonomyIsInTable(`New Beautiful Taxonomy ${timestamp}`);
			});
		});
	});

	test.describe('Alternative Flow', () => {
		test('should show validation fail when create category with wrong field', async () => {
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
				await processAdminPage.processTable.editFirstProcess();
				await processAdminPage.getPage().waitForLoadState('networkidle');
			});
			await test.step('4. System: Loads the selected process and displays the content in an editable form, including all existing information', async () => {
				await updateProcessAdminPage.expectToBeOnUpdateProcessPage();
			});
			await test.step('5. User: Navigates to the "Manage categories" section within the process management interface.', async () => {
				await updateProcessAdminPage.navigateToTaxonomies();
			});
			await test.step('6. System: Displays a list of existing categories (if any) and provides options to add, edit, or remove categories.', async () => {
				await newTaxonomyPage.expectToBeOnTaxonomiesPage();
			});
			await test.step('7. User: Clicks on "Add New Category" button.', async () => {
				await newTaxonomyPage.createNewTaxonomy();
			});
			await test.step('8. User: Fills in the category details: 1. Name', async () => {
				await newTaxonomyPage.fillName('');
			});
			await test.step('9. User: Clicks on "Save Category" to add the new category.', async () => {
				await newTaxonomyPage.submitForm();
			});
			await test.step('10.1. System: Detects that the category details are incomplete or incorrect.', async () => {
				await newTaxonomyPage.waitForLoadState('networkidle');
				await newTaxonomyPage.expectToBeOnTaxonomiesPageWithValidationError();
				await newTaxonomyPage.expectErrorFlashMessage('There was a problem creating this taxonomy.');
			});
			await test.step('10.2. System: Highlights the fields with errors and displays appropriate error messages.', async () => {
				await newTaxonomyPage.expectFormValidationError();
			});
			await test.step('10.3. User: Corrects the invalid category details.', async () => {
				await newTaxonomyPage.fillName(`New Updated Beautiful Taxonomy ${timestamp}`);
			});
			await test.step('10.4. User: Clicks "Save Category" again.', async () => {
				await newTaxonomyPage.submitForm();
			});
			await test.step('Result.', async () => {
				await newTaxonomyPage.expectTaxonomyIsInTable(`New Updated Beautiful Taxonomy ${timestamp}`);
			});
		});
	});
});
