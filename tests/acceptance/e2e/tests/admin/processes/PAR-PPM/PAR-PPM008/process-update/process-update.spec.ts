/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Simone Bianchelli
 * Denise Scarcelli
 * Gianfranco Cedro
 */

import { ProcessTestDataGenerator } from '@fixtures/process-fixtures';
import { AdminHomePage } from '@pages/pages/admin/AdminHomePage';
import {
	ProcessAdminPage,
	CompleteProcessData,
	ProcessGeneralInfo
} from '@pages/pages/admin/processes/ProcessAdminPage';
import { test, expect } from '@fixtures/parallel-test-reserved';

/**
 * Test suite for Allows City Administrators to update existing process.
 *
 * User Story: As a City Administrator, I want to update process.
 *
 * Requirements: PAR R8
 *
 * Prerequisites:
 * - The City Administrator has an active account on the platform and is logged in.
 * - The process to be updated exists on the platform and the City Administrator has the necessary permissions to edit it.
 *
 * @reserved - This test creates and modifies a dedicated test process and must run sequentially.
 */

/**
 * Generate process data for the dedicated test process
 */
function generateTestProcessData(testRunId: string): CompleteProcessData {
	return {
		general: {
			title: `Test Process for Update ${testRunId}`,
			subtitle: `Subtitle for update test ${testRunId}`,
			orderPosition: 99,
			urlSlug: `test-update-${testRunId}`,
			shortDescription: `Short description for update test process`,
			hashtag: `UpdateTest${testRunId.slice(-6)}`,
			description: `This is a dedicated test process created for PAR-PPM008 update tests. ID: ${testRunId}`,
			announcement: `Test announcement for update process`
		},
		duration: {
			startDate: '01/01/2025',
			endDate: '31/12/2025'
		},
		metadata: {
			developerGroup: `Test Group ${testRunId}`,
			localArea: `Test Area`,
			metaScope: `Test Scope`,
			target: `Test Target`,
			participatoryScope: `Test Participatory Scope`,
			participatoryStructure: `Test Structure`
		},
		visibility: 'public'
	};
}

function generateInvalidGeneralData(
	base: ProcessGeneralInfo,
	keepFields: (keyof ProcessGeneralInfo)[]
): ProcessGeneralInfo {
	const invalid: ProcessGeneralInfo = { ...base };

	for (const key of Object.keys(base) as (keyof ProcessGeneralInfo)[]) {
		if (!keepFields.includes(key)) {
			(invalid as unknown as Record<string, unknown>)[key] = '';
		}
	}

	return invalid;
}

test.describe('@reserved [PAR-PPM008] – Update process', () => {
	// Force sequential execution to prevent test interference
	test.describe.configure({ mode: 'serial' });

	let adminHomePage: AdminHomePage;
	let processAdminPage: ProcessAdminPage;
	let updateData: any;

	// Unique identifier for each test run
	let testRunId: string;
	let testProcessSlug: string;
	let testProcessTitle: string;
	let testProcessCreated = false;
	let testProcessData: CompleteProcessData;

	test.beforeEach(async ({ adminPage }) => {
		// Generate unique ID for this test
		testRunId = Date.now().toString();
		testProcessSlug = `test-update-${testRunId}`;
		testProcessTitle = `Test Process for Update ${testRunId}`;

		// Initialize page objects
		adminHomePage = new AdminHomePage(adminPage);
		processAdminPage = new ProcessAdminPage(adminPage);
		updateData = ProcessTestDataGenerator.generateUpdateProcessData(testRunId);

		// Navigate to admin home
		await adminHomePage.navigateToAdminHomePage();
		await processAdminPage.navigateToProcesses();
		// Create a dedicated test process for this test
		await processAdminPage.navigateToNewProcess();

		//const testProcessData = generateTestProcessData(testRunId);
		testProcessData = generateTestProcessData(testRunId);
		// Fill general information
		await processAdminPage.fillGeneralInfo(testProcessData.general);

		// Fill duration information
		await processAdminPage.fillDurationInfo(testProcessData.duration);

		// Fill metadata information
		await processAdminPage.fillMetadataInfo(testProcessData.metadata);

		// Set public visibility
		await processAdminPage.setVisibilityToPublic();

		// Submit process
		await processAdminPage.submitProcess();

		// Verify success
		await processAdminPage.expectSuccessMessage();
		testProcessCreated = true;
		console.log(`Created dedicated test process: slug=${testProcessSlug}`);

		// Navigate back to processes list so test starts from correct state
		await processAdminPage.navigateToProcesses();
	});

	test.afterEach(async ({ adminPage }) => {
		if (!testProcessCreated) {
			return;
		}

		try {
			// Navigate to processes list page where delete action is available
			await adminPage.goto('/admin/participatory_processes');
			await adminPage.waitForLoadState('load');

			// Search for the process by updated title (more reliable than slug)
			const updatedTitle = updateData.general.title;
			await processAdminPage.searchProcesses(updatedTitle);

			// Find the process row
			const processRow = adminPage.locator('table.table-list tbody tr').first();

			if (await processRow.isVisible()) {
				// Open the actions dropdown for the row
				await processRow.locator('button[data-controller="dropdown"]').click();

				const softDeleteLink = adminPage.locator('a.dropdown__button:has-text("Move to trash")');
				const isSoftDeleteVisible = await softDeleteLink.isVisible();
				if (isSoftDeleteVisible) {
					await softDeleteLink.click();

					// Wait for confirmation modal and click OK button
					const confirmModal = adminPage.locator('#confirm-modal-content');
					await confirmModal.waitFor({ state: 'visible' });
					await confirmModal.locator('button[data-confirm-ok]').click();

					await adminPage.waitForLoadState('load');
				} else {
					// If Soft delete is absent, the process is published — navigate to edit via dropdown "Edit"
					await adminPage.locator('a.dropdown__button[href*="/edit"]').click();
					await adminPage.waitForLoadState('load');

					// Try to unpublish
					const unpublishButton = adminPage.getByRole('button', { name: /unpublish/i });
					if (await unpublishButton.isVisible()) {
						await unpublishButton.click();
						await adminPage.waitForLoadState('load');
					}

					// Go back to list and delete
					await adminPage.goto('/admin/participatory_processes');
					await adminPage.waitForLoadState('load');
					await processAdminPage.searchProcesses(updatedTitle);

					const rowAfterUnpublish = adminPage.locator('table.table-list tbody tr').first();
					await rowAfterUnpublish.locator('button[data-controller="dropdown"]').click();
					await adminPage.locator('a.dropdown__button:has-text("Move to trash")').click();

					// Wait for confirmation modal and click OK
					const modal = adminPage.locator('#confirm-modal-content');
					await modal.waitFor({ state: 'visible' });
					await modal.locator('button[data-confirm-ok]').click();

					await adminPage.waitForLoadState('load');
				}
			}
		} catch (error) {
			// Don't throw - cleanup failure shouldn't fail the test
		}
	});

	test.describe('Main Flow', () => {
		test('should successfully update an existing participatory process with new information', async ({
			adminPage
		}) => {
			await test.step('1. User: Navigates to the "Processes" section.', async () => {
				await processAdminPage.navigateToProcesses();
			});

			await test.step('2. System: Displays a list of all Processes that the City Administrator has created or has permissions to update.', async () => {
				await adminPage.waitForLoadState('load');

				// Verify we're on the processes page, with fallback navigation
				let isOnProcessesPage = await processAdminPage.isOnProcessesPage();

				if (!isOnProcessesPage) {
					// Try direct navigation if component navigation failed
					await adminPage.goto('/admin/participatory_processes');
					await adminPage.waitForLoadState('load');
					isOnProcessesPage = await processAdminPage.isOnProcessesPage();
				}

				expect(isOnProcessesPage).toBe(true);
				const processCount = await processAdminPage.getProcessCount();
				expect(processCount).toBeGreaterThan(0);
			});

			await test.step('3. User: Selects the process that needs updating', async () => {
				// Use the dedicated test process created in beforeEach (search by title, not slug)
				await processAdminPage.searchProcesses(testProcessTitle);
				const processName = await processAdminPage.getFirstProcessName();
				await processAdminPage.selectProcessForEdit(processName);
			});

			await test.step('4. System: Loads the selected process in editable form', async () => {
				await processAdminPage.waitForEditFormToLoad();

				// Verify we're on the edit page
				const isOnEditPage = await processAdminPage.isOnProcessEditPage();
				expect(isOnEditPage).toBe(true);

				// Verify essential form elements are visible and pre-populated
				const titleTextbox = await processAdminPage.getTitleTextbox();
				await expect(titleTextbox).toBeVisible();

				const currentTitle = await titleTextbox.inputValue();
				expect(currentTitle).toBeTruthy(); // Should have existing content

				const subtitleTextbox = await processAdminPage.getSubtitleTextbox();
				await expect(subtitleTextbox).toBeVisible();
			});

			await test.step('5. User: edits the desired fields of the process', async () => {
				console.log('Updating process fields with new information...');
				// Update General Info fields
				await processAdminPage.updateGeneralInfo(updateData.general);

				// Update Duration Info if provided
				if (updateData.duration) {
					await processAdminPage.updateDurationInfo(updateData.duration);
				}

				// Update image if provided
				if (updateData.image) {
					await processAdminPage.updateImage(updateData.image);
				}

				// Update Metadata Info if provided
				if (updateData.metadata) {
					await processAdminPage.updateMetadataInfo(updateData.metadata);
				}

				// Update visibility settings if specified
				if (updateData.visibility) {
					await processAdminPage.updateVisibilitySettings(updateData.visibility);
				}
			});

			await test.step('6. User: saves the changes', async () => {
				await processAdminPage.saveProcessChanges();
			});

			await test.step('7. System: validates, saves and confirms the update', async () => {
				// Wait for and verify success message
				await processAdminPage.expectUpdateSuccessMessage();

				// Verify we're still on a valid admin page (could be process list or edit page)
				await expect(adminPage).toHaveURL(/\/admin\/participatory_processes/);

				// Verify the updated data is reflected
				if (updateData.general?.title) {
					const titleInput = adminPage.locator('#participatory_process_title_en');
					await expect(titleInput).toBeVisible();
					await expect(titleInput).toHaveValue(updateData.general.title);
				}
			});

			await test.step('8. System: Verify the process is updated and available', async () => {
				await processAdminPage.navigateToProcesses();
				await processAdminPage.searchProcesses(updateData.general.title);
				const searchResults = await processAdminPage.getProcessCount();
				expect(searchResults).toBe(1);
				const processName = await processAdminPage.getFirstProcessName();
				await processAdminPage.selectProcessForEdit(processName);
				await processAdminPage.waitForEditFormToLoad();
				const titleInput = await processAdminPage.getTitleTextbox();
				await expect(titleInput).toHaveValue(updateData.general.title);
				const subtitleInput = await processAdminPage.getSubtitleTextbox();
				await expect(subtitleInput).toHaveValue(updateData.general.subtitle);
				const slugInput = await processAdminPage.getSlugTextbox();
				await expect(slugInput).toHaveValue(updateData.general.urlSlug);
				const orderPositionInput = await processAdminPage.getOrderPositionSpinbutton();
				await expect(orderPositionInput).toHaveValue(updateData.general.orderPosition.toString());
			});
		});
	});

	test.describe('Process Selection and Navigation', () => {
		test('should navigate to edit form for selected process', async ({ adminPage }) => {
			await test.step('Select a specific process for editing', async () => {
				await processAdminPage.navigateToProcesses();

				// Ensure we have processes to work with
				const hasProcesses = await processAdminPage.hasProcesses();
				expect(hasProcesses).toBe(true);

				// Use the dedicated test process created in beforeEach (search by title, not slug)
				await processAdminPage.searchProcesses(testProcessTitle);
				const processName = await processAdminPage.getFirstProcessName();
				await processAdminPage.selectProcessForEdit(processName);

				// Verify navigation to edit page
				const isOnEditPage = await processAdminPage.isOnProcessEditPage();
				expect(isOnEditPage).toBe(true);
			});
		});
	});

	test.describe('Form Field Updates', () => {
		test('should handle individual field updates correctly', async ({ adminPage }) => {
			await test.step('Navigate to process edit form', async () => {
				await processAdminPage.navigateToProcesses();
				// Use the dedicated test process (search by title, not slug)
				await processAdminPage.searchProcesses(testProcessTitle);
				const processName = await processAdminPage.getFirstProcessName();
				await processAdminPage.selectProcessForEdit(processName);
				await processAdminPage.waitForEditFormToLoad();
			});

			await test.step('Update only title field', async () => {
				const newTitle = `Updated Process Title - ${Date.now()}`;
				await processAdminPage.updateProcessTitle(newTitle);
				await processAdminPage.saveProcessChanges();

				await processAdminPage.expectUpdateSuccessMessage();

				// Verify title was updated
				const currentTitle = await processAdminPage.getCurrentTitleValue();
				expect(currentTitle).toBe(newTitle);
			});
		});

		test('should handle metadata field updates', async ({ adminPage }) => {
			await test.step('Navigate to process edit form', async () => {
				await processAdminPage.navigateToProcesses();
				// Use the dedicated test process (search by title, not slug)
				await processAdminPage.searchProcesses(testProcessTitle);
				const processName = await processAdminPage.getFirstProcessName();
				await processAdminPage.selectProcessForEdit(processName);
				await processAdminPage.waitForEditFormToLoad();
			});

			await test.step('Update metadata fields', async () => {
				const metadataUpdates = {
					developerGroup: 'Updated Promoter Organization',
					localArea: 'Updated Local Area',
					metaScope: 'Updated Scope',
					target: 'Updated Target Audience',
					participatoryScope: 'Updated Decision Scope',
					participatoryStructure: 'Updated Decision Process'
				};

				await processAdminPage.updateMetadataInfo(metadataUpdates);
				await processAdminPage.saveProcessChanges();

				await processAdminPage.expectUpdateSuccessMessage();
				await processAdminPage.expectMetadataInfoUpdated(metadataUpdates);
			});
		});
	});

	test.describe('Alternative Flow – Required fields validation', () => {
		test('should show validation errors when required fields are empty', async ({ adminPage }) => {
			await test.step('Navigate to process edit form', async () => {
				const invalidData = generateInvalidGeneralData(testProcessData.general, []);
				await processAdminPage.searchProcesses(testProcessTitle);
				const processName = await processAdminPage.getFirstProcessName();
				await processAdminPage.selectProcessForEdit(processName);
				await processAdminPage.waitForEditFormToLoad();
				await processAdminPage.fillGeneralInfo(invalidData);
				await processAdminPage.expectFieldError('participatory_process_weight');
				await processAdminPage.expectFieldError('participatory_process_slug');

				const partiallyValidData = generateInvalidGeneralData(testProcessData.general, [
					'orderPosition',
					'urlSlug'
				]);
				await processAdminPage.fillGeneralInfo(partiallyValidData);
				await processAdminPage.saveProcessChanges();

				await processAdminPage.expectMultilangFieldError('participatory_process_title');

				await processAdminPage.expectMultilangFieldError('participatory_process_subtitle');
			});
		});
	});
});
