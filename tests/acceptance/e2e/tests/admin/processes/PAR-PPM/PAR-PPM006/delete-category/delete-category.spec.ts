import { ConfirmDeleteModalComponent } from '@pages/components/common/ConfirmDeleteModalComponent';
import { AdminHomePage } from '@pages/pages/admin/AdminHomePage';
import { CategoriesPage } from '@pages/pages/admin/processes/detail/categories/CategoriesPage';
import { UpdateProcessAdminPage } from '@pages/pages/admin/processes/detail/UpdateProcessAdminPage';
import { ProcessAdminPage } from '@pages/pages/admin/processes/ProcessAdminPage';
import test, { expect } from '@playwright/test';
import { STORAGE_STATE } from '@utils/constants';

/**
 * Test suite for Allows City Administrators to delete a category of the process.
 *
 * User Story: As a City Administrator, I want to delete existing category of the process.
 * Requirements: PAR R8
 *
 * Prerequisites:
 * - The City Administrator has an active account on the platform and is logged in.
 * - The process has already been created.
 * - The category has already been created and linked to process.
 */
test.describe('[PAR-PPM006] – Delete category in process', () => {
	test.use({ storageState: STORAGE_STATE.ADMIN });
	let adminHomePage: AdminHomePage;
	let processAdminPage: ProcessAdminPage;
	let updateProcessAdminPage: UpdateProcessAdminPage;
	let categoriesPage: CategoriesPage;
	let confirmDeleteModalComponent: ConfirmDeleteModalComponent;

	test.beforeEach(async ({ page }) => {
		adminHomePage = new AdminHomePage(page);
		processAdminPage = new ProcessAdminPage(page);
		updateProcessAdminPage = new UpdateProcessAdminPage(page);
		categoriesPage = new CategoriesPage(page);
		confirmDeleteModalComponent = new ConfirmDeleteModalComponent(page);

		await adminHomePage.navigateToAdminHomePage();
	});

	test.describe('Main Flow', () => {
		test('should allow admin to delete categories of process', async () => {
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
				countPreviousDelete = await categoriesPage.getCategoryCount();
			});
			await test.step('7. User: Selects an existing category to delete.', async () => {
				await categoriesPage.clickFirstEnabledDeleteButton();
			});
			await test.step('8. System: Prompts the user to confirm the deletion.', async () => {
				await confirmDeleteModalComponent.expectModalVisible();
			});
			await test.step('9. User: Confirms the deletion.', async () => {
				await confirmDeleteModalComponent.confirmDelete();
			});
			await test.step('10. System: Deletes the selected category from the process and updates the list of categories.', async () => {
				await categoriesPage.waitForLoadState('networkidle');
				await confirmDeleteModalComponent.expectModalNotVisible();
			});
			await test.step('11. System: Notifies the City Administrator that the category has been successfully deleted.', async () => {
				await categoriesPage.expectSuccessFlashMessage('Category deleted successfully.');
			});
			await test.step('Result.', async () => {
				const count = await categoriesPage.getCategoryCount();
				expect(count).toBeLessThan(countPreviousDelete);
			});
		});
	});

	test.describe('Alternative Flow', () => {
		test('should can abort the delete of category', async () => {
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
				countPreviousDelete = await categoriesPage.getCategoryCount();
			});
			await test.step('7. User: Selects an existing category to delete.', async () => {
				await categoriesPage.clickFirstEnabledDeleteButton();
			});
			await test.step('8. System: Prompts the user to confirm the deletion.', async () => {
				await confirmDeleteModalComponent.expectModalVisible();
			});
			await test.step('9.1. User: Decides not to proceed and clicks "Cancel" or navigates away.', async () => {
				await confirmDeleteModalComponent.cancelDelete();
			});
			await test.step('10. System: Aborts the deletion process and returns the user to the list of categories.', async () => {
				await categoriesPage.waitForLoadState('networkidle');
				await confirmDeleteModalComponent.expectModalNotVisible();
			});
			await test.step('Result.', async () => {
				const count = await categoriesPage.getCategoryCount();
				expect(count).toBe(countPreviousDelete);
			});
		});
	});
});
