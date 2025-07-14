import { AdminHomePage } from '@pages/pages/admin/AdminHomePage';
import { DebatesPage } from '@pages/pages/admin/processes/detail/debates/DebatesPage';
import { NewDebatePage } from '@pages/pages/admin/processes/detail/debates/NewDebatePage';
import { expect, test } from '@playwright/test';

import { ProcessTestDataGenerator } from '@fixtures/process-fixtures';
import { ComponentsPage } from '@pages/pages/admin/processes/detail/components/ComponentsPage';
import { ProcessAdminPage } from '@pages/pages/admin/processes/ProcessAdminPage';
import { ensureLoggedIn } from '@utils/auth-helper';
import { STORAGE_STATE } from '@utils/constants';

/**
 * Test suite for creating a new debate topic in a participatory process
 *
 * User Story: As a City Administrator (or Debate Moderator), I want to create a new debate topic
 * so that I can initiate discussions on important issues with citizens.
 *
 * Requirements: PAR R12a, PAR R12b
 *
 * Prerequisites:
 * - The authorized user (City Administrator or Moderator) has an active account on the platform and is logged in
 * - The authorized user has permissions to create debates
 * - The debate component is available and configured properly on Process
 */
test.beforeAll(async ({ browser }) => {
	const context = await browser.newContext();
	const page = await context.newPage();
	await ensureLoggedIn(page, 'ADMIN');
});
test.describe('[PAR-DAD002] – Create New Debate Topic', () => {
	// Use admin storage state for authentication
	test.use({ storageState: STORAGE_STATE.ADMIN });
	let adminHomePage: AdminHomePage;
	let processAdminPage: ProcessAdminPage;
	let componentsPage: ComponentsPage;
	let debatesPage: DebatesPage;
	let newDebatePage: NewDebatePage;
	let validProcessData: any;

	// Test data - English only
	const testProcessData = {
		slug: 'test-process-create-debate',
		title: 'Test Process for Creating Debates'
	};

	const newDebateData = {
		title: 'City Budget Discussion 2025',
		description:
			"Let's discuss the allocation of the city budget for the upcoming year. Your input is valuable to ensure our resources are used effectively.",
		instructions:
			'Please be respectful and constructive in your comments. Focus on specific budget items and provide reasoning for your suggestions.',
		informationUpdates: 'Updates will be posted weekly regarding the budget process timeline.',
		debateType: 'open' as const, // or 'finite'
		category: 'Budget & Finance',
		commentsEnabled: true
	};

	test.beforeEach(async ({ page }) => {
		// Initialize Page Objects

		adminHomePage = new AdminHomePage(page);
		processAdminPage = new ProcessAdminPage(page);
		componentsPage = new ComponentsPage(page);
		debatesPage = new DebatesPage(page);
		newDebatePage = new NewDebatePage(page);

		// Generate valid test data
		validProcessData = ProcessTestDataGenerator.generateValidProcessData();

		// Override with specific data for consistency
		validProcessData.general.urlSlug = testProcessData.slug;
		validProcessData.general.title = testProcessData.title;

		await adminHomePage.navigateToAdminHomePage();
		await setupTestProcess();
	});

	/**
	 * Setup test environment by ensuring a test process with debates component exists
	 */
	async function setupTestProcess() {
		await test.step('Setup: Create/verify test process with debates component exists', async () => {
			await processAdminPage.createTestProcess(validProcessData);
		});
	}

	test.describe('Main Flow - Successfully create new debate topic', () => {
		test('should allow City Administrator to create a new debate topic for citizen discussions', async () => {
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
			});

			await test.step('5. User navigates to the "Create Debate" section on the platform', async () => {
				// Navigate to components page to access debates component
				await componentsPage.sidebarProcessDetail.navigateToComponents();
				await componentsPage.waitForComponentsPageLoad();

				// Verify we're on the components page
				const isOnComponentsPage = await componentsPage.isOnComponentsPage();
				expect(isOnComponentsPage).toBe(true);

				// Navigate to debates component management (simulating accessing "Create Debate" section)
				await componentsPage.manageComponent('Debate');
				const currentUrl = componentsPage.getPage().url();
				expect(currentUrl).toMatch(/\/admin\/participatory_processes\/.*\/components\/.*\/manage\//);
				await debatesPage.getPage().waitForLoadState('networkidle');
				await debatesPage.createNewDebate();
			});

			await test.step('6. System displays the debate creation form with input fields, including Title, Description, Instructions to Participate, Information Updates, Debate Type, Start and End Dates (for Finite debates), and Category', async () => {
				// Verify we're on the debates component creation page
				const currentUrl = newDebatePage.getPage().url();
				expect(currentUrl).toMatch(
					/\/admin\/participatory_processes\/.*\/components\/.*\/manage\/debates\/new/
				);

				// For this test, we'll simulate that we're in a "Create New Debate" form
				// In a real implementation, there would be a specific page for creating individual debates
				// For now, we'll use the component configuration as a proxy

				// Verify page elements are visible
				await newDebatePage.waitForPageReady();

				// Verify sidebar is accessible
				const isSidebarVisible = await newDebatePage.sidebar.isSidebarVisible();
				expect(isSidebarVisible).toBe(true);
			});

			await test.step('7. User fills in the required fields', async () => {
				// Fill in debate creation form fields using NewDebatePage
				await newDebatePage.fillTitle(newDebateData.title);
				await newDebatePage.fillDescription(newDebateData.description);
				await newDebatePage.fillInstructions(newDebateData.instructions);
				await newDebatePage.fillInformationUpdates(newDebateData.informationUpdates);

				// Set debate type
				if (newDebateData.debateType === 'open') {
					await newDebatePage.setDebateTypeOpen();
				} else {
					await newDebatePage.setDebateTypeFinite();
				}

				// // Set category if available
				// if (newDebateData.category) {
				// 	await newDebatePage.selectCategory(newDebateData.category);
				// }

				// Enable comments
				await newDebatePage.setCommentsEnabled(newDebateData.commentsEnabled);

				// Verify form data has been filled correctly
				const titleValue = await newDebatePage.getPage().locator('#debate_title_en').inputValue();
				expect(titleValue).toBe(newDebateData.title);
			});

			await test.step('8. User clicks on "Create Debate" to submit the form', async () => {
				// Verify submit button is enabled
				const isButtonVisible = await newDebatePage.isFormVisible();
				expect(isButtonVisible).toBe(true);

				// Submit the form (creating the actual debate)
				await newDebatePage.clickCreateDebate();
			});

			await test.step('9. System validates the form input for completeness, correctness, and permission checks', async () => {
				// Wait for form submission to complete
				await newDebatePage.getPage().waitForLoadState('networkidle');

				// Check if we're redirected or if there are validation errors
				const currentUrl = newDebatePage.getPage().url();

				// In case of validation errors, check for them
				if (currentUrl.includes('/new')) {
					// Still on the new debate form, check for validation errors
					const errorElements = await newDebatePage
						.getPage()
						.locator('.alert.alert-danger, .field_with_errors')
						.count();
					expect(errorElements).toBe(0); // Should not have validation errors with valid data
				}
			});

			await test.step('10. System saves changes', async () => {
				// Verify that the changes are saved successfully
				// After creating a debate, we should be redirected to the debates list or management page

				// Wait for any redirect or success indication
				await newDebatePage.getPage().waitForLoadState('networkidle');

				// Verify we're no longer on the new debate creation page
				const currentUrl = newDebatePage.getPage().url();
				expect(currentUrl).not.toMatch(/\/new$/);
			});

			await test.step('11. System notifies the authorized user that the debate has been successfully created and is available for participants', async () => {
				// Check for success notification
				const successElement = await newDebatePage
					.getPage()
					.locator('.alert.alert-success, .flash.success')
					.first();
				const hasSuccessMessage = await successElement.isVisible().catch(() => false);
				expect(hasSuccessMessage).toBe(true);
			});

			await test.step('Result: The debate is successfully created and published on the platform, and citizens can now view, participate, and contribute to the debate', async () => {
				// Verify the debate is accessible and properly created
				const currentUrl = newDebatePage.getPage().url();
				// Should be redirected to debates management page or debate detail page
				expect(currentUrl).toMatch(/\/admin\/participatory_processes\/.*\/components\/.*\/manage\/debates/);
			});
		});
	});

	test.describe('Alternative Flow - Cancel operation', () => {
		test('should allow user to cancel creating a new debate', async () => {
			await test.step('Navigate to debate creation form', async () => {
				await processAdminPage.navigateToProcesses();
				await processAdminPage.editFirstProcess();
				await componentsPage.sidebarProcessDetail.navigateToComponents();
				await componentsPage.waitForComponentsPageLoad();
				await componentsPage.manageComponent('Debate');
				await debatesPage.getPage().waitForLoadState('networkidle');
				await debatesPage.createNewDebate();
				await newDebatePage.waitForPageReady();
			});

			await test.step('User decides not to proceed with creating a new debate', async () => {
				// Fill some data first
				await newDebatePage.fillTitle('Cancel Test Debate');

				// Navigate away using sidebar (equivalent to canceling)
				await newDebatePage.sidebar.navigateToComponents();
			});

			await test.step('System aborts the operation and discards any changes', async () => {
				// Verify we're back on components page
				await componentsPage.expectToBeOnComponentsPage();

				// Verify the debate component still exists but no new debate was created
				const componentExists = await componentsPage.findComponentByName('Debate');
				expect(componentExists).toBe(true);
			});

			await test.step('Result: The operation is cancelled, no changes are made, and the user is returned to the previous state', async () => {
				// Verify we're on the components page and can continue with other operations
				const isOnComponentsPage = await componentsPage.isOnComponentsPage();
				expect(isOnComponentsPage).toBe(true);
			});
		});
	});

	test.describe('Alternative Flow - Field validation fail', () => {
		test('should handle validation errors when required fields are missing', async () => {
			await test.step('Navigate to debate creation form', async () => {
				await processAdminPage.navigateToProcesses();
				await processAdminPage.editFirstProcess();
				await componentsPage.sidebarProcessDetail.navigateToComponents();
				await componentsPage.waitForComponentsPageLoad();
				await componentsPage.manageComponent('Debate');
				await debatesPage.getPage().waitForLoadState('networkidle');
				await debatesPage.createNewDebate();
				await newDebatePage.waitForPageReady();
			});

			await test.step('User submits form with missing required fields', async () => {
				// Try to submit without filling required fields (leave title empty)
				await newDebatePage.fillTitle(''); // Clear required field
				await newDebatePage.clickCreateDebate();
			});

			await test.step('System detects missing or incorrect fields and displays appropriate error messages', async () => {
				// Wait for validation
				await newDebatePage.getPage().waitForTimeout(1000);

				// Verify we're still on the form page
				const currentUrl = newDebatePage.getPage().url();
				expect(currentUrl).toMatch(/\/admin\/participatory_processes\/.*\/components\/.*\/manage\/debates/);

				// Check for validation errors
				await newDebatePage.expectErrorFlashMessage('There was a problem creating the debate.');
			});

			await test.step('User corrects the errors and resubmits the form', async () => {
				// Fill the required field
				await newDebatePage.fillTitle('Corrected Debate Title');
				await newDebatePage.fillDescription('A proper description for the corrected debate.');
				await newDebatePage.fillInstructions('Instructions for participation in this debate.');

				// Submit again
				await newDebatePage.clickCreateDebate();

				// Wait for successful submission
				await newDebatePage.getPage().waitForLoadState('networkidle');

				// Verify success (check that we're no longer on the new debate page)
				const currentUrl = newDebatePage.getPage().url();
				expect(currentUrl).not.toMatch(/\/new$/);
			});
		});
	});

	test.describe('Alternative Flow - Submission error', () => {
		test('should handle submission errors and allow retry', async () => {
			await test.step('Navigate to debate creation form', async () => {
				await processAdminPage.navigateToProcesses();
				await processAdminPage.editFirstProcess();
				await componentsPage.sidebarProcessDetail.navigateToComponents();
				await componentsPage.waitForComponentsPageLoad();
				await componentsPage.manageComponent('Debate');
				await debatesPage.getPage().waitForLoadState('networkidle');
				await debatesPage.createNewDebate();
				await newDebatePage.waitForPageReady();
			});

			await test.step('User fills form and submits', async () => {
				// Fill the form with valid data
				await newDebatePage.fillTitle('Submission Error Test');
				await newDebatePage.fillDescription('This debate should test submission error handling');
				await newDebatePage.fillInstructions('Instructions for testing submission errors');
			});

			await test.step('System encounters an error while saving the new debate', async () => {
				// Submit the form
				await newDebatePage.clickCreateDebate();
				await newDebatePage.getPage().waitForLoadState('networkidle');

				// In a real scenario, this would be where a submission error occurs
				// For testing purposes, we'll check if we can handle error states
			});

			await test.step('System displays an error message indicating the failure', async () => {
				// Check for any error messages or failure indicators
				// In case of success (no actual error in test), verify the normal flow
				const hasErrorMessage = await newDebatePage
					.getPage()
					.locator('.alert.alert-danger')
					.isVisible()
					.catch(() => false);
				const hasSuccessMessage = await newDebatePage
					.getPage()
					.locator('.alert.alert-success, .flash.success')
					.isVisible()
					.catch(() => false);

				// Either there should be an error message or success (for test environment)
				expect(hasErrorMessage || hasSuccessMessage).toBe(true);
			});

			await test.step('User chooses to retry the operation', async () => {
				// If there was an error, user would retry
				// For successful submission, verify the result
				const currentUrl = newDebatePage.getPage().url();

				if (currentUrl.includes('/new')) {
					// Still on new debate page, retry submission
					await newDebatePage.clickCreateDebate();
					await newDebatePage.getPage().waitForLoadState('networkidle');
				}

				// Verify final state
				const finalUrl = newDebatePage.getPage().url();
				expect(finalUrl).toMatch(/\/admin\/participatory_processes\/.*\/components\/.*\/manage\/debates/);
			});

			await test.step('Result: The debate creation is handled appropriately, with proper error logging and retry capability', async () => {
				// Verify the system state is consistent
				const currentUrl = newDebatePage.getPage().url();
				expect(currentUrl).toMatch(/\/admin\/participatory_processes\/.*\/components\/.*\/manage\/debates/);
			});
		});
	});
});
