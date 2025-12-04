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
	let categoriesPage: CategoriesPage;
	let newCategoryPage: NewCategoryPage;

	test.beforeEach(async ({ adminPage }) => {
		adminHomePage = new AdminHomePage(adminPage);
		processAdminPage = new ProcessAdminPage(adminPage);
		updateProcessAdminPage = new UpdateProcessAdminPage(adminPage);
		categoriesPage = new CategoriesPage(adminPage);
		newCategoryPage = new NewCategoryPage(adminPage);

		await adminHomePage.navigateToAdminHomePage();
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
				await updateProcessAdminPage.navigateToCategories();
			});
			await test.step('6. System: Displays a list of existing categories (if any) and provides options to add, edit, or remove categories.', async () => {
				await categoriesPage.expectToBeOnCategoriesPage();
			});
			await test.step('7. User: Clicks on "Add New Category" button.', async () => {
				await categoriesPage.createNewCategory();
			});
			await test.step('8. User: Fills in the category details: 1. Name', async () => {
				await newCategoryPage.fillName('New Beautiful Category');
			});
			await test.step('9. User: Clicks on "Save Category" to add the new category.', async () => {
				await newCategoryPage.submitForm();
			});
			await test.step('10. System: Validates the category information for completeness and correctness.', async () => {
				await categoriesPage.waitForLoadState('networkidle');
				await categoriesPage.expectToBeOnCategoriesPage();
			});
			await test.step('11. System: Saves the category details and updates the list of categories for the process.', async () => {
				await categoriesPage.expectCategoryIsInTable('New Beautiful Category');
			});
			await test.step('12. System: Notifies the City Administrator that the category has been successfully added.', async () => {
				await categoriesPage.expectSuccessFlashMessage('Category created successfully.');
			});
			await test.step('Result.', async () => {
				await categoriesPage.expectCategoryIsInTable('New Beautiful Category');
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
				await updateProcessAdminPage.navigateToCategories();
			});
			await test.step('6. System: Displays a list of existing categories (if any) and provides options to add, edit, or remove categories.', async () => {
				await categoriesPage.expectToBeOnCategoriesPage();
			});
			await test.step('7. User: Clicks on "Add New Category" button.', async () => {
				await categoriesPage.createNewCategory();
			});
			await test.step('8. User: Fills in the category details: 1. Name', async () => {
				await newCategoryPage.fillName('');
			});
			await test.step('9. User: Clicks on "Save Category" to add the new category.', async () => {
				await newCategoryPage.submitForm();
			});
			await test.step('10.1. System: Detects that the category details are incomplete or incorrect.', async () => {
				await newCategoryPage.waitForLoadState('networkidle');
				await newCategoryPage.expectToBeOnNewCategoryPage();
				await newCategoryPage.expectErrorFlashMessage('There was a problem creating this category.');
			});
			await test.step('10.2. System: Highlights the fields with errors and displays appropriate error messages.', async () => {
				await newCategoryPage.expectFormValidationError();
			});
			await test.step('10.3. User: Corrects the invalid category details.', async () => {
				await newCategoryPage.fillName('New Updated Beautiful Category');
			});
			await test.step('10.4. User: Clicks "Save Category" again.', async () => {
				await newCategoryPage.submitForm();
			});
			await test.step('Result.', async () => {
				await categoriesPage.expectCategoryIsInTable('New Updated Beautiful Category');
			});
		});
	});
});
