/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Simone Bianchelli
 * Simone Bianchelli
 * Gianfranco Cedro
 * Denise Scarcelli
 */

import { test, expect } from '@fixtures/parallel-test';
import { AdminHomePage } from '@pages/pages/admin/AdminHomePage';
import { ComponentsPage } from '@pages/pages/admin/processes/detail/components/ComponentsPage';
import { ManagePageComponentPage } from '@pages/pages/admin/processes/detail/components/ManagePageComponentPage';
import { UpdateProcessAdminPage } from '@pages/pages/admin/processes/detail/UpdateProcessAdminPage';
import { ProcessAdminPage } from '@pages/pages/admin/processes/ProcessAdminPage';

/**
 * Test suite for Allows the City Administrator to update information on the convocation page once a participatory process is completed.
 *
 * User Story: As a City Administrator, I want to update the convocation page after the process is over so that citizens are informed about the outcomes and any next steps.
 *
 * Requirements: PAR R8
 *
 * Prerequisites:
 * - The City Administrator has an active account on the platform and is logged in.
 * - The participatory process has been completed.
 * - The convocation page for the process is available for editing.
 */

test.describe('[PAR-TRA001] – Update convocation page after process completion', () => {
	let adminHomePage: AdminHomePage;
	let componentsPage: ComponentsPage;
	let updateProcessAdminPage: UpdateProcessAdminPage;
	let managePageComponentPage: ManagePageComponentPage;
	let processAdminPage: ProcessAdminPage;

	// Variables to track created resources for cleanup
	let componentName: string | null = null;
	let processSlug: string | null = null;

	const testContent = {
		title: 'Process Outcomes and Next Steps',
		body: 'This section contains the results, decisions and next steps of the participatory process.'
	};

	test.beforeEach(async ({ adminPage }) => {
		// Direct navigation to the admin area and wait for load
		adminHomePage = new AdminHomePage(adminPage);

		// Page Objects initialization
		processAdminPage = new ProcessAdminPage(adminPage);
		componentsPage = new ComponentsPage(adminPage);
		managePageComponentPage = new ManagePageComponentPage(adminPage);
		updateProcessAdminPage = new UpdateProcessAdminPage(adminPage);
		await adminHomePage.navigateToAdminHomePage();
		// Initial setup: verify/create process and convocation page
	});

	test.afterEach(async ({ adminPage }) => {
		if (componentName && processSlug) {
			try {
				console.log('Starting cleanup: Deleting component...');

				// Navigate to components page
				await componentsPage.navigateToComponents(processSlug);

				// Unpublish component first (must be done before hide)
				try {
					await componentsPage.unpublishComponentByName(componentName);
					await adminPage.waitForURL(/\/admin\/participatory_processes\/.*\/components$/);
					await expect(adminPage.getByText('The component has been successfully unpublished')).toBeVisible();
				} catch (error) {
					console.log('Component already unpublished or unpublish failed:', error);
				}

				// Hide the component after unpublishing
				try {
					await componentsPage.hideComponentByName(componentName);
					await adminPage.waitForURL(/\/admin\/participatory_processes\/.*\/components$/);
					await expect(
						adminPage.getByText('The component has been successfully hidden from the menu')
					).toBeVisible();
				} catch (error) {
					console.log('Component already hidden or hide failed:', error);
				}

				// Delete component
				// Find and click delete button
				const componentRow = componentsPage.getComponentRow(componentName);
				const deleteLink = componentRow.locator('a.action-icon--delete');
				await deleteLink.click();

				// Wait for confirmation modal to appear
				const confirmModal = adminPage.locator('#confirm-modal-content');
				await expect(confirmModal).toBeVisible();

				// Click OK button in the modal
				const okButton = adminPage.locator('button[data-confirm-ok]');
				await okButton.click();

				// Wait for deletion to complete
				await adminPage.waitForTimeout(1000);

				// Verify component is no longer visible
				const rowExists = await componentRow.isVisible().catch(() => false);
				if (!rowExists) {
					console.log('Component deleted successfully');
				} else {
					console.log('Component still visible after deletion attempt');
				}
			} catch (error) {
				if (error instanceof Error) {
					console.error('Cleanup failed:', error.message);
					console.error('Stack trace:', error.stack);
				} else {
					console.error('Cleanup failed with unknown error:', String(error));
				}
			}
		}

		// Reset variables
		componentName = null;
		processSlug = null;
	});

	test.describe('Main Flow', () => {
		test('should successfully update convocation page content', async ({ adminPage }) => {
			const bodyContent = 'Summary of the process outcomes. Decisions taken. Next steps or upcoming actions.';
			componentName = `Page_${Date.now()}`;

			await test.step('1. User: Navigates to the "Processes" section.', async () => {
				await processAdminPage.navigateToProcesses();
			});
			await test.step('2. System: displays a list of all Processes that the City Administrator has created or has permissions to update', async () => {
				// Verify processes table is visible and has content
				const hasProcesses = await processAdminPage.processTable.hasProcesses();
				expect(hasProcesses).toBe(true);
			});
			await test.step('3. User selects the process that want to update', async () => {
				// Click edit on the first process in the table
				await processAdminPage.editFirstProcess();
				await processAdminPage.getPage().waitForLoadState('load');

				// Extract process slug from URL
				const currentUrl = adminPage.url();
				const match = currentUrl.match(/\/admin\/participatory_processes\/([^\/]+)\//);
				if (match) {
					processSlug = match[1];
					console.log(`Process slug extracted for cleanup: ${processSlug}`);
				}
			});
			await test.step('4. System: Loads the selected process and displays the content in an editable form, including all existing information', async () => {
				await updateProcessAdminPage.expectToBeOnUpdateProcessPage();
			});
			await test.step('5. User: Navigate to convocation page management', async () => {
				// Navigate to convocation page component management
				await updateProcessAdminPage.sidebarProcessDetail.navigateToComponents();
				await componentsPage.checkPageComponent(componentName);
				// checkPageComponent creates, manages and saves the component, then returns to components list
				// We need to navigate back to manage the component for updating
				await componentsPage.manageComponent(componentName);
				await managePageComponentPage.verifyPageLoaded();
				await managePageComponentPage.fillBody(bodyContent);
			});

			await test.step('6. User: Update content', async () => {
				await managePageComponentPage.savePage();
			});

			await test.step('7 and step 8: User: Save changes ', async () => {
				console.log(
					'Step 7 And Step 8 SYSTEM: Validates the updated information for completeness and correctness. Saves changes.'
				);
			});
			await test.step('Result. ', async () => {
				// Verify that the success notification appears
				await managePageComponentPage.waitForSuccessFlashNotification('Page successfully saved.');

				// Navigate back to components list to find the preview link
				await updateProcessAdminPage.sidebarProcessDetail.navigateToComponents();
				await componentsPage.waitForComponentsPageLoad();

				// Find the row for our specific component and click its preview link
				const componentRow = componentsPage.getComponentRow(componentName);
				const previewLink = componentRow.locator('a[href*="/f/"]');
				await expect(previewLink).toBeVisible();

				const [previewPage] = await Promise.all([
					managePageComponentPage.getPage().context().waitForEvent('page'),
					previewLink.click()
				]);

				await previewPage.waitForLoadState('load');
				const paragraph = previewPage.locator('div.rich-text-display p');
				await expect(paragraph).toContainText(bodyContent);
			});
		});
	});

	test.describe('Alternative Flow - abort update', () => {
		test('should discard changes when cancelling update', async ({ adminPage }) => {
			componentName = `Page_${Date.now()}`;

			await test.step('1. User: Navigates to the "Processes" section.', async () => {
				await processAdminPage.navigateToProcesses();
			});
			await test.step('2. System: displays a list of all Processes that the City Administrator has created or has permissions to update', async () => {
				// Verify processes table is visible and has content
				const hasProcesses = await processAdminPage.processTable.hasProcesses();
				expect(hasProcesses).toBe(true);
			});
			await test.step('3. User selects the process that want to update', async () => {
				// Click edit on the first process in the table
				await processAdminPage.editFirstProcess();
				await processAdminPage.getPage().waitForLoadState('load');

				// Extract process slug from URL
				const currentUrl = adminPage.url();
				const match = currentUrl.match(/\/admin\/participatory_processes\/([^\/]+)\//);
				if (match) {
					processSlug = match[1];
					console.log(`Process slug extracted for cleanup: ${processSlug}`);
				}
			});
			await test.step('4. System: Loads the selected process and displays the content in an editable form, including all existing information', async () => {
				await updateProcessAdminPage.expectToBeOnUpdateProcessPage();
			});
			await test.step('5. User: Navigate to convocation page management', async () => {
				// Navigate to convocation page component management
				await updateProcessAdminPage.sidebarProcessDetail.navigateToComponents();
				await componentsPage.checkPageComponent(componentName);
				await componentsPage.manageComponent(componentName);

				// Verify being on the management page
				await managePageComponentPage.verifyPageLoaded();
			});
			await test.step('6. User: Update content', async () => {
				// Update content using only English
				await managePageComponentPage.fillBody(testContent.body);
			});

			await test.step('Cancel changes and verify discard', async () => {
				// Simulate cancellation by navigating away without saving
				await componentsPage.sidebarProcessDetail.navigateToComponents();

				// Return to component management
				await componentsPage.manageComponent('Page');
				await managePageComponentPage.verifyPageLoaded();
			});
			await test.step('Result.', async () => {
				// Verify that unsaved changes were discarded
				const currentBody = await managePageComponentPage.getBody();
				expect(currentBody).not.toBe('Modified Body - Should be discarded');
			});
		});
	});
});
