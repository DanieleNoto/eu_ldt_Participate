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
 * Test suite for Allows City Administrators to edit a category of the process.
 *
 * User Story: As a City Administrator, I want to edit existing category of the process.
 *
 * Requirements: PAR R8
 *
 * Prerequisites:
 * - The City Administrator has an active account on the platform and is logged in.
 * - The process has already been created.
 * - The category has already been created and linked to process.
 */

test.describe('[PAR-PPM005] – Edit category in process', () => {
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

		await setupTestProcess();
		await adminHomePage.navigateToAdminHomePage();
	});

	test.afterEach(async ({ adminPage }) => {
		// Clean up taxonomies created during tests
		await adminPage.goto('/admin/taxonomies');
		await newTaxonomyPage.waitForLoadState('load');

		// Try to delete test taxonomies
		await newTaxonomyPage.deleteTaxonomyByName(`New Beautiful Taxonomy ${timestamp}`);
		await newTaxonomyPage.deleteTaxonomyByName(`Updated Beautiful Taxonomy Name ${timestamp}`);
		await newTaxonomyPage.deleteTaxonomyByName(`Updated With Edited Beautiful Taxonomy ${timestamp}`);
	});

	/**
	 * Setup test environment by ensuring a test process exists
	 */
	async function setupTestProcess() {
		await test.step('Setup: Create test taxonomy ', async () => {
			await adminHomePage.navigateToAdminHomePage();
			await adminHomePage.navigateViaAdminNav('processes');
			await processAdminPage.processTable.editFirstProcess();
			await updateProcessAdminPage.navigateToTaxonomies();

			await newTaxonomyPage.createNewTaxonomy();
			await newTaxonomyPage.fillName(`New Beautiful Taxonomy ${timestamp}`);
			await newTaxonomyPage.submitForm();
			await newTaxonomyPage.expectTaxonomyIsInTable(`New Beautiful Taxonomy ${timestamp}`);
		});
	}

	test.describe('Main Flow', () => {
		test('should allow admin to edit categories of process', async () => {
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
				await processAdminPage.processTable.editFirstProcess();
				await processAdminPage.getPage().waitForLoadState('load');
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
			await test.step('7. User: Selects an existing category to edit.', async () => {
				// Find the taxonomy created in setup by name
				const taxonomyIndex = await newTaxonomyPage.getIndexByTitle(`New Beautiful Taxonomy ${timestamp}`);
				await newTaxonomyPage.clickEditButtonByIndex(taxonomyIndex);
			});
			await test.step('8. System: Displays the category details in an editable form.', async () => {
				await newTaxonomyPage.expectToBeOnEditTaxonomyPage();
			});
			await test.step('9. User: Makes the desired changes to the category (e.g., updates the name).', async () => {
				await newTaxonomyPage.fillName(`Updated Beautiful Taxonomy Name ${timestamp}`);
			});
			await test.step('10. User: Clicks on "Update" to save the changes.', async () => {
				await newTaxonomyPage.updateForm();
			});
			await test.step('11. System: Validates the category information for completeness and correctness.', async () => {
				await newTaxonomyPage.waitForLoadState('load');
				await newTaxonomyPage.expectToBeOnTaxonomiesPage();
			});
			await test.step('12. System: Saves the updated category details.', async () => {
				await newTaxonomyPage.expectTaxonomyIsInTable(`Updated Beautiful Taxonomy Name ${timestamp}`);
			});
			await test.step('12. System: Notifies the City Administrator that the category has been successfully updated.', async () => {
				await newTaxonomyPage.expectSuccessFlashMessage('Taxonomy updated successfully.');
			});
			await test.step('Result.', async () => {
				await newTaxonomyPage.expectTaxonomyIsInTable(`Updated Beautiful Taxonomy Name ${timestamp}`);
			});
		});
	});

	test.describe('Alternative Flow', () => {
		test('should show validation fail when edit category with wrong field', async () => {
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
				await processAdminPage.processTable.editFirstProcess();
				await processAdminPage.getPage().waitForLoadState('load');
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
			await test.step('7. User: Clicks on "Edit Category" button.', async () => {
				// Find the taxonomy created in setup by name
				const taxonomyIndex = await newTaxonomyPage.getIndexByTitle(`New Beautiful Taxonomy ${timestamp}`);
				await newTaxonomyPage.clickEditButtonByIndex(taxonomyIndex);
			});
			await test.step('8. User: Fills in the category details: 1. Name', async () => {
				await newTaxonomyPage.fillName('');
			});
			await test.step('9. User: Clicks on "Save Category" to add the new category.', async () => {
				await newTaxonomyPage.updateForm();
			});
			await test.step('10.1. System: Detects that the category details are incomplete or incorrect.', async () => {
				await newTaxonomyPage.waitForLoadState('load');
				await newTaxonomyPage.expectErrorFlashMessage('There was a problem updating this taxonomy.');
			});
			await test.step('10.2. System: Highlights the fields with errors and displays appropriate error messages.', async () => {
				await newTaxonomyPage.expectFormValidationError();
			});
			await test.step('10.3. User: Corrects the invalid category details.', async () => {
				await newTaxonomyPage.fillName(`Updated With Edited Beautiful Taxonomy ${timestamp}`);
			});
			await test.step('10.4. User: Clicks "Save Category" again.', async () => {
				await newTaxonomyPage.updateForm();
			});
			await test.step('Result.', async () => {
				await newTaxonomyPage.expectTaxonomyIsInTable(`Updated With Edited Beautiful Taxonomy ${timestamp}`);
			});
		});
	});
});
