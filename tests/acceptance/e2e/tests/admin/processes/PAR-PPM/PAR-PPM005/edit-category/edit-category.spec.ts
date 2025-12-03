/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Simone Bianchelli
 * Gianfranco Cedro
 */

import { AdminHomePage } from '@pages/pages/admin/AdminHomePage';
import { CategoriesPage } from '@pages/pages/admin/processes/detail/categories/CategoriesPage';
import { UpdateProcessAdminPage } from '@pages/pages/admin/processes/detail/UpdateProcessAdminPage';
import { ProcessAdminPage } from '@pages/pages/admin/processes/ProcessAdminPage';
import { test, expect } from '@fixtures/parallel-test';
import { NewCategoryPage } from '../../../../../../pages/pages/admin/processes/detail/categories/NewCategoryPage';

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
	let categoriesPage: CategoriesPage;
	let newCategoryPage: NewCategoryPage;

	test.beforeEach(async ({ adminPage }) => {
		adminHomePage = new AdminHomePage(adminPage);
		processAdminPage = new ProcessAdminPage(adminPage);
		updateProcessAdminPage = new UpdateProcessAdminPage(adminPage);
		categoriesPage = new CategoriesPage(adminPage);
		newCategoryPage = new NewCategoryPage(adminPage);
		await setupTestProcess();
		await adminHomePage.navigateToAdminHomePage();
	});

	/**
	 * Setup test environment by ensuring a test process exists
	 */
	async function setupTestProcess() {
		await test.step('Setup: Create test categories ', async () => {
			await adminHomePage.navigateToAdminHomePage();
			await adminHomePage.navigateViaAdminNav('processes');
			await processAdminPage.processTable.editFirstProcess();
			await updateProcessAdminPage.navigateToCategories();

			await categoriesPage.createNewCategory();
			await newCategoryPage.fillName('New Beautiful Category 1');
			await newCategoryPage.submitForm();
			await categoriesPage.expectCategoryIsInTable('New Beautiful Category 1');
		});
	}

	test.describe('Main Flow', () => {
		test('should allow admin to edit categories of process', async () => {
			let parentName = '';
			let position = 0;
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
				await updateProcessAdminPage.navigateToCategories();
			});
			await test.step('6. System: Displays a list of existing categories (if any) and provides options to add, edit, or remove categories.', async () => {
				await categoriesPage.expectToBeOnCategoriesPage();
			});
			await test.step('7. User: Selects an existing category to edit.', async () => {
				await categoriesPage.clickEditButtonByIndex(0);
			});
			await test.step('8. System: Displays the category details in an editable form.', async () => {
				await newCategoryPage.expectToBeOnEditCategoryPage();
			});
			await test.step('9. User: Makes the desired changes to the category (e.g., updates the name or parent link).', async () => {
				parentName = await newCategoryPage.getSelectedOption();
				position = await newCategoryPage.getOrderPosition();
				await newCategoryPage.fillName('Updated Beautiful Category Name');
				await newCategoryPage.fillOrderPosition(-10); // Negative Index to move it to the top
				await newCategoryPage.selectParentByIndex(1); // Assuming '1' is the value for the desired parent category
			});
			await test.step('10. User: Clicks on "Update" to save the changes.', async () => {
				await newCategoryPage.submitForm();
			});
			await test.step('11. System: Validates the category information for completeness and correctness.', async () => {
				await categoriesPage.waitForLoadState('networkidle');
				await categoriesPage.expectToBeOnCategoriesPage();
			});
			await test.step('12. System: Saves the updated category details.', async () => {
				await categoriesPage.expectCategoryIsInTable('Updated Beautiful Category Name');
			});
			await test.step('12. System: Notifies the City Administrator that the category has been successfully updated.', async () => {
				await categoriesPage.expectSuccessFlashMessage('Category updated successfully.');
			});
			await test.step('Result.', async () => {
				await categoriesPage.expectCategoryIsInTable('Updated Beautiful Category Name');
				const updatedIndex = await categoriesPage.getIndexByTitle('Updated Beautiful Category Name');
				await categoriesPage.clickEditButtonByIndex(updatedIndex);
				await newCategoryPage.expectToBeOnEditCategoryPage();
				const updatedParentName = await newCategoryPage.getSelectedOption();
				const updatedPosition = await newCategoryPage.getOrderPosition();
				expect(updatedParentName).not.toBe(parentName);
				expect(updatedPosition).not.toBe(position);
			});
		});
	});

	test.describe('Alternative Flow', () => {
		test('should show validation fail when edit category with wrong field', async () => {
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
				await updateProcessAdminPage.navigateToCategories();
			});
			await test.step('6. System: Displays a list of existing categories (if any) and provides options to add, edit, or remove categories.', async () => {
				await categoriesPage.expectToBeOnCategoriesPage();
			});
			await test.step('7. User: Clicks on "Add New Category" button.', async () => {
				await categoriesPage.clickEditButtonByIndex(0);
			});
			await test.step('8. User: Fills in the category details: 1. Name', async () => {
				await newCategoryPage.fillName('');
			});
			await test.step('9. User: Clicks on "Save Category" to add the new category.', async () => {
				await newCategoryPage.submitForm();
			});
			await test.step('10.1. System: Detects that the category details are incomplete or incorrect.', async () => {
				await newCategoryPage.waitForLoadState('networkidle');

				await newCategoryPage.expectErrorFlashMessage('There was a problem updating this category.');
			});
			await test.step('10.2. System: Highlights the fields with errors and displays appropriate error messages.', async () => {
				await newCategoryPage.expectFormValidationError();
			});
			await test.step('10.3. User: Corrects the invalid category details.', async () => {
				await newCategoryPage.fillName('Updated With Edited Beautiful Category');
			});
			await test.step('10.4. User: Clicks "Save Category" again.', async () => {
				await newCategoryPage.submitForm();
			});
			await test.step('Result.', async () => {
				await categoriesPage.expectCategoryIsInTable('Updated With Edited Beautiful Category');
			});
		});
	});
});
