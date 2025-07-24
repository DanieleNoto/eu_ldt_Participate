import { expect, test } from '@playwright/test';

import { ProcessTestDataGenerator } from '@fixtures/process-fixtures';
import { AdminHomePage } from '@pages/pages/admin/AdminHomePage';
import { ComponentsPage } from '@pages/pages/admin/processes/detail/components/ComponentsPage';
import { ManagePageComponentPage } from '@pages/pages/admin/processes/detail/components/ManagePageComponentPage';
import { NewPageComponentPage } from '@pages/pages/admin/processes/detail/components/NewPageComponentPage';
import { ProcessAdminPage } from '@pages/pages/admin/processes/ProcessAdminPage';
import { STORAGE_STATE } from '@utils/constants';

/**
 * Test suite for updating the convocation page (Page component) of a participatory process
 *
 * Requirements:
 * - The City Administrator must be authenticated
 * - There must be a participatory process with edit permissions
 * - There must be a convocation page (Page component) associated with the process
 */
test.describe('[PAR-TRA001] – Update convocation page after process completion', () => {
	// Use admin storage state for authentication
	test.use({ storageState: STORAGE_STATE.ADMIN });
	let adminHomePage: AdminHomePage;
	let componentsPage: ComponentsPage;
	let newPageComponentPage: NewPageComponentPage;
	let managePageComponentPage: ManagePageComponentPage;
	let processAdminPage: ProcessAdminPage;
	let validProcessData: any;

	// Test data - English only
	const testProcessData = {
		slug: 'test-process-convocation',
		title: 'Test Process for Convocation Page'
	};

	const convocationPageData = {
		name: 'Convocation Page',
		orderPosition: 1
	};

	const testContent = {
		title: 'Process Outcomes and Next Steps',
		body: 'This section contains the results, decisions and next steps of the participatory process.'
	};

	test.beforeEach(async ({ page }) => {
		// Direct navigation to the admin area and wait for load
		adminHomePage = new AdminHomePage(page);

		// Page Objects initialization
		processAdminPage = new ProcessAdminPage(page);
		componentsPage = new ComponentsPage(page);
		newPageComponentPage = new NewPageComponentPage(page);
		managePageComponentPage = new ManagePageComponentPage(page);

		// Generate valid test data
		validProcessData = ProcessTestDataGenerator.generateValidProcessData();

		// Override with specific data for this test to ensure consistency
		validProcessData.general.urlSlug = testProcessData.slug;
		validProcessData.general.title = testProcessData.title;
		await adminHomePage.navigateToAdminHomePage();
		// Initial setup: verify/create process and convocation page
		await setupTestEnvironment();
	});

	/**
	 * Setup to ensure a process with convocation page exists
	 */
	async function setupTestEnvironment() {
		await test.step('Setup: Create/verify test process exists', async () => {
			await processAdminPage.createTestProcess(validProcessData);
			await processAdminPage.editFirstProcess();
		});

		await test.step('Setup: Create/verify convocation page component exists', async () => {
			// Navigate to the Components page of the process
			await componentsPage.sidebarProcessDetail.navigateToComponents();
			await componentsPage.waitForComponentsPageLoad();

			// Check if a Page component already exists
			const convocationPageExists = await componentsPage.findComponentByName(convocationPageData.name);

			if (!convocationPageExists) {
				// If it does not exist, create the convocation page
				await createConvocationPage();
			}
		});
	}

	/**
	 * Creates a convocation page if it does not exist
	 */
	async function createConvocationPage() {
		await test.step('Create convocation page component', async () => {
			// Add Page component
			await componentsPage.addPagesComponent();

			// Verify being on the new Page component creation page
			await newPageComponentPage.expectToBeOnNewPageComponentPage();

			// Fill in the creation form
			await newPageComponentPage.fillNewPageComponentForm({
				name: convocationPageData.name,
				orderPosition: convocationPageData.orderPosition
			});

			// Save the component
			await newPageComponentPage.submitForm();

			// Verify being back on the Components page
			await componentsPage.expectToBeOnComponentsPage();

			// Verify that the component was created
			await componentsPage.expectComponentExists(convocationPageData.name);
		});
	}

	test.describe('Main Flow - Update convocation page after process completion', () => {
		test('should successfully update convocation page content', async () => {
			await test.step('Navigate to convocation page management', async () => {
				// Navigate to convocation page component management
				await componentsPage.sidebarProcessDetail.navigateToComponents();
				await componentsPage.manageComponent(convocationPageData.name);

				// Verify being on the management page
				await managePageComponentPage.verifyPageLoaded();
			});

			await test.step('Update content', async () => {
				// Update content using only English
				await managePageComponentPage.fillBody(testContent.body);
			});

			await test.step('Save changes and verify success', async () => {
				// Save changes
				await managePageComponentPage.savePage();

				// Verify that the success notification appears
				await managePageComponentPage.waitForSuccessFlashNotification('Page successfully saved.');
			});
		});
	});

	test.describe('Alternative Flow - abort update', () => {
		test('should discard changes when cancelling update', async () => {
			await test.step('Get original content and start editing', async () => {
				// Navigate to component management
				await componentsPage.navigateToComponents(testProcessData.slug);
				await componentsPage.manageComponent(convocationPageData.name);
				await managePageComponentPage.verifyPageLoaded();

				// Start editing
				await managePageComponentPage.fillBody('Modified Body - Should be discarded');
			});

			await test.step('Cancel changes and verify discard', async () => {
				// Simulate cancellation by navigating away without saving
				await componentsPage.navigateToComponents(testProcessData.slug);

				// Return to component management
				await componentsPage.manageComponent(convocationPageData.name);
				await managePageComponentPage.verifyPageLoaded();

				// Verify that unsaved changes were discarded
				const currentBody = await managePageComponentPage.getBody();
				expect(currentBody).not.toBe('Modified Body - Should be discarded');
			});
		});
	});
});
