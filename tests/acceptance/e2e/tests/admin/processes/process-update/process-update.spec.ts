import { ProcessAdminPage } from '@pages/pages/admin/processes/ProcessAdminPage';
import { expect, test } from '@playwright/test';
import { STORAGE_STATE } from '@utils/constants';
import { ProcessTestDataGenerator } from '../../../../fixtures/process-fixtures';

test.describe('PAR R8 - City Administrator Process Update', () => {
	test.use({ storageState: STORAGE_STATE.ADMIN });

	let processAdminPage: ProcessAdminPage;
	let validProcessData: any;
	let updateData: any;

	test.beforeEach(async ({ page }) => {
		// Navigate directly to admin area and wait for it to load
		await page.goto('/admin');
		await page.waitForLoadState('networkidle');

		processAdminPage = new ProcessAdminPage(page);
		validProcessData = ProcessTestDataGenerator.generateValidProcessData();
		updateData = ProcessTestDataGenerator.generateUpdateProcessData();

		// Use the modular navigation method with proper waiting
		await processAdminPage.navigateToProcesses();
		await page.waitForLoadState('networkidle');

		// Verify we're on the processes page, with fallback navigation
		let isOnProcessesPage = await processAdminPage.isOnProcessesPage();

		if (!isOnProcessesPage) {
			// Try direct navigation if component navigation failed
			await page.goto('/admin/participatory_processes');
			await page.waitForLoadState('networkidle');
			isOnProcessesPage = await processAdminPage.isOnProcessesPage();
		}

		expect(isOnProcessesPage).toBe(true);
	});

	test.describe('Main Flow - Update Process', () => {
		test('should successfully update an existing participatory process with new information', async ({ page }) => {
			await test.step('City Administrator navigates to Processes section and selects process to update', async () => {
				// Step 1: City Administrator is already logged in via storage state
				// Step 2: System displays list of all processes the administrator can update
				const processCount = await processAdminPage.getProcessCount();
				expect(processCount).toBeGreaterThan(0);

				// Step 3: Selects the process that needs updating
				// Get the first available process for updating
				const firstProcessName = await processAdminPage.getFirstProcessName();
				expect(firstProcessName).toBeDefined();

				// Navigate to edit the selected process
				await processAdminPage.selectProcessForEdit(firstProcessName);
			});

			await test.step('System loads the selected process in editable form', async () => {
				// Step 4: System loads the selected process and displays content in editable form
				await processAdminPage.waitForEditFormToLoad();

				// Verify we're on the edit page
				const isOnEditPage = await processAdminPage.isOnProcessEditPage();
				expect(isOnEditPage).toBe(true);

				// Verify essential form elements are visible and pre-populated
				const titleTextbox = await processAdminPage.getTitleTextbox();
				await expect(titleTextbox).toBeVisible({ timeout: 30000 });

				const currentTitle = await titleTextbox.inputValue();
				expect(currentTitle).toBeTruthy(); // Should have existing content

				const subtitleTextbox = await processAdminPage.getSubtitleTextbox();
				await expect(subtitleTextbox).toBeVisible({ timeout: 30000 });
			});

			await test.step('City Administrator edits the desired fields of the process', async () => {
				// Step 5: Edits the desired fields of the process
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

			await test.step('City Administrator saves the changes', async () => {
				// Step 6: Clicks on "Save Changes" button to update the process
				await processAdminPage.saveProcessChanges();
			});

			await test.step('System validates, saves and confirms the update', async () => {
				// Step 7: System validates the updated information for completeness and correctness
				// Step 8: System saves the updated process to the database
				// Step 9: System displays confirmation message indicating successful update

				// Wait for and verify success message
				await processAdminPage.expectUpdateSuccessMessage();

				// Verify we're still on a valid admin page (could be process list or edit page)
				await expect(page).toHaveURL(/\/admin\/participatory_processes/);

				// Verify the updated data is reflected
				if (updateData.general?.title) {
					// Check if the updated title is visible somewhere on the page
					await expect(page.getByText(updateData.general.title)).toBeVisible({ timeout: 10000 });
				}
			});

			await test.step('Verify the process is updated and available', async () => {
				// Result: The process is updated with new information and available for viewing

				// Navigate back to processes list to verify the update
				await processAdminPage.navigateToProcesses();

				// Search for the updated process if we have a searchable title
				if (updateData.general?.title) {
					await processAdminPage.searchProcesses(updateData.general.title);

					// Verify the updated process appears in search results
					const searchResults = await processAdminPage.getProcessCount();
					expect(searchResults).toBeGreaterThanOrEqual(1);
				}
			});
		});
	});

	test.describe('Process Selection and Navigation', () => {
		test('should navigate to edit form for selected process', async ({ page }) => {
			await test.step('Select a specific process for editing', async () => {
				// Ensure we have processes to work with
				const hasProcesses = await processAdminPage.hasProcesses();
				expect(hasProcesses).toBe(true);

				// Select the first available process
				const firstProcessName = await processAdminPage.getFirstProcessName();
				await processAdminPage.selectProcessForEdit(firstProcessName);

				// Verify navigation to edit page
				const isOnEditPage = await processAdminPage.isOnProcessEditPage();
				expect(isOnEditPage).toBe(true);
			});

			await test.step('Verify edit form loads with existing data', async () => {
				// Verify form fields are populated with existing data
				const titleValue = await processAdminPage.getCurrentTitleValue();
				expect(titleValue).toBeTruthy();

				const subtitleValue = await processAdminPage.getCurrentSubtitleValue();
				// Subtitle might be optional, so we don't assert it's required
			});
		});
	});

	test.describe('Form Field Updates', () => {
		test('should handle individual field updates correctly', async ({ page }) => {
			await test.step('Navigate to process edit form', async () => {
				const firstProcessName = await processAdminPage.getFirstProcessName();
				await processAdminPage.selectProcessForEdit(firstProcessName);
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

		test('should handle metadata field updates', async ({ page }) => {
			await test.step('Navigate to process edit form', async () => {
				const firstProcessName = await processAdminPage.getFirstProcessName();
				await processAdminPage.selectProcessForEdit(firstProcessName);
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
			});
		});
	});
});
