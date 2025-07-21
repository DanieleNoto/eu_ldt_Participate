import { AdminHomePage } from '@pages/pages/admin/AdminHomePage';
import { expect, test } from '@playwright/test';

import { ComponentsPage } from '@pages/pages/admin/processes/detail/components/ComponentsPage';
import { NewDebatesComponentPage } from '@pages/pages/admin/processes/detail/components/NewDebatesComponentPage';
import { ProcessAdminPage } from '@pages/pages/admin/processes/ProcessAdminPage';
import { STORAGE_STATE } from '@utils/constants';

/**
 * Test suite for adding a debate component to a participatory process
 *
 * User Story: As a City Administrator, I want to add a debate component to a specific process
 * so that participants can engage in structured discussions related to the process.
 *
 * Requirements: PAR R12a, PAR R12b
 *
 * Prerequisites:
 * - The admin has an active account on the platform and is logged in (uses admin.state.json)
 * - There are processes available on the platform
 * - The debate allows citizen participation (not blocked or restricted by permissions)
 */
test.describe('[PAR-DAD001] – Add Debates Component to Process', () => {
	// Use admin storage state for authentication
	test.use({ storageState: STORAGE_STATE.ADMIN });
	let adminHomePage: AdminHomePage;
	let processAdminPage: ProcessAdminPage;
	let componentsPage: ComponentsPage;
	let newDebatesComponentPage: NewDebatesComponentPage;

	const debatesComponentData = {
		name: 'Community Debates',
		orderPosition: 1,
		commentsEnabled: true,
		commentsBlocked: false,
		commentsMaxLength: 1000,
		createDebatesPermission: 'all' as const,
		globalAnnouncement: 'Welcome to our community debates section!',
		stepAnnouncement: 'Phase 1: Initial discussions and idea sharing'
	};

	test.beforeEach(async ({ page }) => {
		// Initialize Page Objects
		adminHomePage = new AdminHomePage(page);
		processAdminPage = new ProcessAdminPage(page);
		componentsPage = new ComponentsPage(page);
		newDebatesComponentPage = new NewDebatesComponentPage(page);

		await adminHomePage.navigateToAdminHomePage();
	});

	test.describe('Main Flow - Successfully add debates component to process', () => {
		test('should allow City Administrator to add a debate component to a specific process', async () => {
			await test.step('1. User navigates to the "Processes" section', async () => {
				await processAdminPage.navigateToProcesses();
				await processAdminPage.getPage().waitForLoadState('networkidle');

				const isOnProcessesPage = await processAdminPage.isOnProcessesPage();
				expect(isOnProcessesPage).toBe(true);
			});

			await test.step('2. System displays a list of all Processes that the City Administrator has created or has permissions to update', async () => {
				// Verify processes table is visible and has content
				const hasProcesses = await processAdminPage.processTable.hasProcesses();
				expect(hasProcesses).toBe(true);
			});

			await test.step('3. User selects the process that want to update', async () => {
				// Click edit on the first process in the table
				await processAdminPage.editFirstProcess();
				await processAdminPage.getPage().waitForLoadState('networkidle');
			});

			await test.step('4. System loads the selected process and displays the content in an editable form, including all existing information', async () => {
				// Verify we're on the process edit/management page
				const currentUrl = processAdminPage.getPage().url();
				expect(currentUrl).toMatch(/\/admin\/participatory_processes\/.*\/edit/);

				// Navigate to components page using the sidebar
				await componentsPage.sidebarProcessDetail.navigateToComponents();
				await componentsPage.waitForComponentsPageLoad();

				// Verify we're on the components page
				const isOnComponentsPage = await componentsPage.isOnComponentsPage();
				expect(isOnComponentsPage).toBe(true);

				// Verify page title indicates we're managing components
				const pageTitle = await componentsPage.getPageTitle();
				expect(pageTitle).toContain('Components');

				// Verify sidebar is visible for navigation
				const isSidebarVisible = await componentsPage.sidebarProcessDetail.isSidebarVisible();
				expect(isSidebarVisible).toBe(true);
			});

			await test.step('5. User clicks on "Add Component" and selects "Debate" as the type of component', async () => {
				// Click on debates component (this will also open the dropdown internally)
				await componentsPage.addDebatesComponent();
			});

			await test.step('6. System displays the "Add Debate Component" form', async () => {
				// Wait for new debates component page to load
				await newDebatesComponentPage.waitForNewDebatesComponentPageLoad();

				// Verify we're on the new debates component page
				await newDebatesComponentPage.expectToBeOnNewDebatesComponentPage();

				// Verify page title
				const pageTitle = await newDebatesComponentPage.getPageTitle();
				expect(pageTitle).toContain('Add component: Debates');

				// Verify sidebar is accessible
				const isSidebarVisible = await newDebatesComponentPage.sidebar.isSidebarVisible();
				expect(isSidebarVisible).toBe(true);

				// Verify form is present
				const isSubmitButtonVisible = await newDebatesComponentPage.isSubmitButtonVisible();
				expect(isSubmitButtonVisible).toBe(true);
			});

			await test.step('7. User fills in the debate component form', async () => {
				// Fill the complete form with test data
				await newDebatesComponentPage.fillNewDebatesComponentForm({
					name: debatesComponentData.name,
					orderPosition: debatesComponentData.orderPosition,
					commentsEnabled: debatesComponentData.commentsEnabled,
					commentsBlocked: debatesComponentData.commentsBlocked,
					commentsMaxLength: debatesComponentData.commentsMaxLength,
					createDebatesPermission: debatesComponentData.createDebatesPermission,
					globalAnnouncement: debatesComponentData.globalAnnouncement,
					stepAnnouncement: debatesComponentData.stepAnnouncement
				});

				// Verify form data has been filled correctly
				await newDebatesComponentPage.expectComponentName(debatesComponentData.name);
				await newDebatesComponentPage.expectOrderPosition(debatesComponentData.orderPosition);
				await newDebatesComponentPage.expectCommentsEnabled(debatesComponentData.commentsEnabled);
				await newDebatesComponentPage.expectCommentsBlocked(debatesComponentData.commentsBlocked);
				await newDebatesComponentPage.expectCommentsMaxLength(debatesComponentData.commentsMaxLength);
				await newDebatesComponentPage.expectCreateDebatesPermission(true);
			});

			await test.step('8. User clicks on "Save Component" to add the debate component to the process', async () => {
				// Verify submit button is enabled
				await newDebatesComponentPage.expectSubmitButtonToBeEnabled();

				// Submit the form
				await newDebatesComponentPage.submitForm();
			});

			await test.step('9. System validates the input for completeness and correctness', async () => {
				// Wait for form submission to complete
				await newDebatesComponentPage.getPage().waitForLoadState('networkidle');

				// Check if we're redirected back to components page (success case)
				// or if there are validation errors on the same page
				const currentUrl = newDebatesComponentPage.getPage().url();

				if (currentUrl.includes('/components/new')) {
					// Still on form page - check for validation errors
					const hasErrors = await newDebatesComponentPage.getValidationErrors();
					expect(hasErrors.length).toBe(0); // Should not have validation errors with valid data
				}
			});

			await test.step('10. System saves the component settings and adds it to the process', async () => {
				// Wait for redirect to components page
				await componentsPage.waitForComponentsPageLoad();

				// Verify we're back on components page
				await componentsPage.expectToBeOnComponentsPage();

				// Verify success flash message
				const hasSuccessMessage = await componentsPage.hasSuccessFlashNotification();
				expect(hasSuccessMessage).toBe(true);
			});

			await test.step('Result: The debate component is successfully added and configured within the specified participatory process', async () => {
				// Verify the new component appears in the components list
				const componentExists = await componentsPage.findComponentByName(debatesComponentData.name);
				expect(componentExists).toBe(true);

				// Verify component settings are accessible
				await componentsPage.manageComponent(debatesComponentData.name);

				// Component management page should load
				await newDebatesComponentPage.getPage().waitForLoadState('networkidle');

				// Verify we can access the component settings
				const currentUrl = newDebatesComponentPage.getPage().url();
				expect(currentUrl).toMatch(/\/admin\/participatory_processes\/.*\/components\/.*\/manage/);
			});
		});
	});

	test.describe('Alternative Flow - Cancel operation', () => {
		test('should allow user to cancel adding a debate component', async () => {
			await test.step('Navigate to add debates component form', async () => {
				await processAdminPage.navigateToProcesses();
				await processAdminPage.editFirstProcess();
				await componentsPage.sidebarProcessDetail.navigateToComponents();
				await componentsPage.waitForComponentsPageLoad();
				await componentsPage.addDebatesComponent();
				await newDebatesComponentPage.waitForNewDebatesComponentPageLoad();
			});

			await test.step('User decides not to proceed with adding a debate component', async () => {
				// Fill some data first
				await newDebatesComponentPage.fillComponentName('Test Debates');

				// Navigate away using sidebar (equivalent to canceling)
				await newDebatesComponentPage.navigateToComponents();
			});

			await test.step('System aborts the operation and discards any changes', async () => {
				// Verify we're back on components page
				await componentsPage.expectToBeOnComponentsPage();

				// Verify the test component was not created
				const componentExists = await componentsPage.findComponentByName('Test Debates');
				expect(componentExists).toBe(false);
			});
		});
	});

	test.describe('Alternative Flow - Field validation fail', () => {
		test('should handle validation errors when required fields are missing', async () => {
			await test.step('Navigate to add debates component form', async () => {
				await processAdminPage.navigateToProcesses();
				await processAdminPage.editFirstProcess();
				await componentsPage.sidebarProcessDetail.navigateToComponents();
				await componentsPage.waitForComponentsPageLoad();
				await componentsPage.addDebatesComponent();
				await newDebatesComponentPage.waitForNewDebatesComponentPageLoad();
			});

			await test.step('User submits form with missing required fields', async () => {
				// Try to submit without filling required name field
				await newDebatesComponentPage.fillComponentName('');
				await newDebatesComponentPage.submitForm();
			});

			await test.step('System detects missing or incorrect fields and displays error messages', async () => {
				// Wait for validation
				await newDebatesComponentPage.getPage().waitForTimeout(1000);

				// Verify we're still on the form page
				const isStillOnFormPage = await newDebatesComponentPage.isOnNewDebatesComponentPage();
				expect(isStillOnFormPage).toBe(true);

				// Check for validation errors
				const validationErrors = await newDebatesComponentPage.getValidationErrors();
				expect(validationErrors.length).toBeGreaterThan(0);
			});

			await test.step('User corrects the errors and resubmits the form', async () => {
				// Fill the required name field
				await newDebatesComponentPage.fillComponentName(debatesComponentData.name);

				// Submit again
				await newDebatesComponentPage.submitForm();

				// Wait for successful submission
				await componentsPage.waitForComponentsPageLoad();

				// Verify success
				await componentsPage.expectToBeOnComponentsPage();
				const componentExists = await componentsPage.findComponentByName(debatesComponentData.name);
				expect(componentExists).toBe(true);
			});
		});
	});
});
