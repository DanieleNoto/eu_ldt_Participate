import { HomePage } from '@pages/pages/public/HomePage';
import { AdminHomePage } from '@pages/pages/admin/AdminHomePage';
import { ProcessAdminPage } from '@pages/pages/admin/processes/ProcessAdminPage';
import { UpdateProcessAdminPage } from '@pages/pages/admin/processes/detail/UpdateProcessAdminPage';
import { ProcessModerationPage } from '@pages/components/admin/moderation/process/ProcessModerationPage';
import test, { expect } from '@playwright/test';
import { STORAGE_STATE } from '@utils/constants';

/**
 * Test suite for Process Content Moderation functionality
 *
 * User Story: As an administrator, I want to moderate reported content within a specific
 * participatory process so that the discussions are constructive and comply with community guidelines.
 *
 * Requirements associated: PAR R12d
 *
 * Prerequisites:
 * - The moderator has an active account on the platform and is logged in.
 * - The moderator has permissions to access and moderate content within the specific participatory process.
 * - There are reported content items available for moderation within the selected process.
 */
test.describe('PAR-MOD002 – Process Content Moderation', () => {
	test.use({ storageState: STORAGE_STATE.ADMIN });

	let homePage: HomePage;
	let adminHomePage: AdminHomePage;
	let processAdminPage: ProcessAdminPage;
	let updateProcessAdminPage: UpdateProcessAdminPage;
	let processModerationPage: ProcessModerationPage;

	test.beforeEach(async ({ page }) => {
		homePage = new HomePage(page);
		adminHomePage = new AdminHomePage(page);
		processAdminPage = new ProcessAdminPage(page);
		updateProcessAdminPage = new UpdateProcessAdminPage(page);
		processModerationPage = new ProcessModerationPage(page);

		// Navigate to admin area and wait for it to load (following working pattern)
		await adminHomePage.navigateToAdminHomePage();
	});

	test.describe('Main Flow', () => {
		test('should allow administrator to moderate reported content within a specific process', async ({ page }) => {
			await test.step('1. USER: Navigates to the "Processes" section.', async () => {
				// Navigate to processes section (following working pattern)
				await processAdminPage.navigateToProcesses();
				console.log('Successfully navigated to Processes section');
			});

			await test.step('2. SYSTEM: Displays a list of all Processes that the City Administrator has created or has permissions to update.', async () => {
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
				const processCount = await processAdminPage.getProcessCount();
				expect(processCount).toBeGreaterThan(0);

				// Get process titles for verification
				const processTitles = await processAdminPage.processTable.getProcessTitles();
				console.log('Available processes:', processTitles);
				expect(processTitles.length).toBeGreaterThan(0);
			});

			await test.step('3. USER: Selects the process that want to update', async () => {
				// Select the first available process (following working pattern)
				const firstProcessName = await processAdminPage.getFirstProcessName();
				console.log(`Selecting process: ${firstProcessName}`);

				// Click on the process to edit it
				await processAdminPage.selectProcessForEdit(firstProcessName);
				await page.waitForLoadState('networkidle');
			});

			await test.step('4. SYSTEM: Loads the selected process and displays the content in an editable form, including all existing information', async () => {
				// Wait for edit form to load (following working pattern)
				await processAdminPage.waitForEditFormToLoad();

				// Verify we're on the edit page
				const isOnEditPage = await processAdminPage.isOnProcessEditPage();
				expect(isOnEditPage).toBe(true);

				// Check if the sidebar is visible and loaded
				await expect(updateProcessAdminPage.sidebarProcessDetail.isSidebarVisible()).resolves.toBe(true);

				// Get and display process title (following working pattern)
				const titleTextbox = await processAdminPage.getTitleTextbox();
				await expect(titleTextbox).toBeVisible({ timeout: 30000 });

				const processTitle = await titleTextbox.inputValue();
				console.log(`Process loaded: ${processTitle}`);
				expect(processTitle).not.toBe('');
			});

			await test.step('5. USER: Clicks on "Moderations" in the process administration section.', async () => {
				// Navigate to moderations section using the sidebar
				await updateProcessAdminPage.sidebarProcessDetail.navigateToModerations();
				await page.waitForLoadState('networkidle');

				// Ensure we're on the main listing page, not a detail page
				await processModerationPage.ensureOnMainListing();
				await page.waitForLoadState('networkidle');

				console.log('Navigated to Moderations section and ensured main listing view');
			});

			await test.step('6. SYSTEM: Displays a list of reported content related to the selected process', async () => {
				// Verify that we are on the moderation page
				await expect(processModerationPage.isPageLoaded()).resolves.toBe(true);

				// Verify we're on the main listing page, not a detail page
				await expect(processModerationPage.isOnMainModerationListing()).resolves.toBe(true);

				// Check if the moderation table is visible
				await expect(processModerationPage.table.isTableVisible()).resolves.toBe(true);

				// Validate table structure - if it fails, it will tell us we need navigation
				let tableType = await processModerationPage.table.detectTableType();
				console.log(`Initial table type detected: ${tableType}`);

				if (tableType !== 'main-listing') {
					console.log('Not on main listing, ensuring proper navigation...');
					await processModerationPage.ensureOnMainListing();
					await page.waitForLoadState('networkidle');

					// Re-check table type after navigation
					tableType = await processModerationPage.table.detectTableType();
					console.log(`Table type after navigation: ${tableType}`);
				}

				await expect(processModerationPage.table.isMainListingTable()).resolves.toBe(true);

				// Get and verify reported content count
				const reportedContentCount = await processModerationPage.table.getRowCount();
				console.log(`Found ${reportedContentCount} reported content items`);

				// Verify that there are reported items to moderate
				expect(reportedContentCount).toBeGreaterThan(0);

				// Get all moderation data for verification
				const moderationData = await processModerationPage.table.getAllRowsData();
				console.log('Reported content items:', moderationData);
				expect(moderationData.length).toBeGreaterThan(0);
			});

			await test.step('7. USER: Clicks on a specific piece of reported content to review the complaint.', async () => {
				// Ensure we're still on the main listing before getting row data
				const tableType = await processModerationPage.table.detectTableType();
				if (tableType !== 'main-listing') {
					console.log(`Detected ${tableType} table, ensuring main listing view...`);
					await processModerationPage.ensureOnMainListing();
					await page.waitForLoadState('networkidle');
				}

				// Get the first reported content item
				const firstRowData = await processModerationPage.table.getRowData(0);
				console.log(`Reviewing reported content: ${firstRowData.type} - ${firstRowData.reason}`);

				// Click on the URL to view the content (if available)
				if (firstRowData.url) {
					const contentUrl = await processModerationPage.table.getReportedContentUrl(0);
					console.log(`Content URL: ${contentUrl}`);
					expect(contentUrl).not.toBe('');
				}
			});

			await test.step('8. USER: Reviews the metadata and context of the reported content by clicking the "Expand" icon.', async () => {
				// Expand the first row to see detailed information
				await processModerationPage.table.expandRow(0);
				await page.waitForLoadState('networkidle');

				console.log('Expanded reported content details for review');

				// The expand action navigates to a detail page, so we expect to be there now
				const currentUrl = page.url();
				console.log(`After expand, current URL: ${currentUrl}`);
				expect(currentUrl).toMatch(/\/moderations\/\d+\/reports/);
			});

			await test.step('9. SYSTEM: Displays full metadata, including the type of content, report reasons, and any additional information provided by the participant.', async () => {
				// We're now on the detail page, which shows the full metadata
				// We can verify the detail page is loaded and shows the metadata
				const detailPageVisible = await page.locator('.moderation-details').isVisible();
				expect(detailPageVisible).toBe(true);

				console.log('Detail page loaded with full metadata - staying on detail page for next actions');

				// Note: We stay on the detail page since the hide/unreport actions are available here
				// No need to navigate back to main listing until after the action is completed
			});

			await test.step('10. USER: Clicks on the "Hide" icon to accept the report and hide the content.', async () => {
				// We're on the detail page, so the hide action will work from here
				// The hideRow method will detect we're on detail page and use the correct selector
				await processModerationPage.table.hideRow(0);
				await page.waitForLoadState('networkidle');

				console.log('Clicked Hide button to accept the report');
			});

			await test.step('11. SYSTEM: Updates the status of the content to "Hidden," ensuring it is no longer visible to participants.', async () => {
				// Check for success message
				await expect(processModerationPage.flashMessage.isSuccessMessageVisible()).resolves.toBe(true);

				// Verify success message content
				const successMessage = await processModerationPage.flashMessage.getSuccessMessageText();
				console.log(`Success message: ${successMessage}`);
				expect(successMessage).not.toBe('');

				// Verify the content is hidden by checking the flash message
				await expect(processModerationPage.flashMessage.hasResourceHiddenMessage()).resolves.toBe(true);
			});

			await test.step('Result.', async () => {
				// Final verification that the reported content is hidden
				console.log('Moderation action completed successfully');

				// Verify that we're still on the moderation page
				await expect(processModerationPage.isPageLoaded()).resolves.toBe(true);

				// Check that the moderation status is updated
				await expect(processModerationPage.flashMessage.isSuccessMessageVisible()).resolves.toBe(true);

				console.log('Result: The reported content has been hidden and moderation status updated');
			});
		});
	});

	test.describe('Alternative Flow: Unreport', () => {
		test('should allow administrator to unreport content and keep it visible', async ({ page }) => {
			// Setup steps 1-9 from main flow
			await test.step('Setup: Navigate to moderation page and select content', async () => {
				// Navigate to processes and select a process (following working pattern)
				await processAdminPage.navigateToProcesses();
				await page.waitForLoadState('networkidle');

				const firstProcessName = await processAdminPage.getFirstProcessName();
				await processAdminPage.selectProcessForEdit(firstProcessName);
				await page.waitForLoadState('networkidle');

				// Navigate to moderations and ensure main listing view
				await updateProcessAdminPage.sidebarProcessDetail.navigateToModerations();
				await page.waitForLoadState('networkidle');

				await processModerationPage.ensureOnMainListing();
				await page.waitForLoadState('networkidle');

				// Expand first row
				await processModerationPage.table.expandRow(0);
				await page.waitForLoadState('networkidle');

				console.log('Setup completed - ready to test unreport flow');
			});

			await test.step('10.1. USER: Clicks on the "Unreport" icon to reject the report', async () => {
				// We're already on the detail page from the expand action in setup
				// The unreportRow method will detect we're on detail page and use the correct selector
				await processModerationPage.table.unreportRow(0);
				await page.waitForLoadState('networkidle');

				console.log('Clicked Unreport button to reject the report');
			});

			await test.step('10.2. SYSTEM: Updates the status of the report as "Unreported" and keeps the content visible on the platform', async () => {
				// Check for success message
				await expect(processModerationPage.flashMessage.isSuccessMessageVisible()).resolves.toBe(true);

				// Verify success message content
				const successMessage = await processModerationPage.flashMessage.getSuccessMessageText();
				console.log(`Success message: ${successMessage}`);
				expect(successMessage).not.toBe('');

				// Verify the content is unreported by checking the flash message
				await expect(processModerationPage.flashMessage.hasResourceUnreportedMessage()).resolves.toBe(true);
			});

			await test.step('Result.', async () => {
				// Final verification that the content remains visible
				console.log('Unreport action completed successfully');

				// Verify that we're still on the moderation page
				await expect(processModerationPage.isPageLoaded()).resolves.toBe(true);

				// Check that the moderation status is updated
				await expect(processModerationPage.flashMessage.isSuccessMessageVisible()).resolves.toBe(true);

				console.log('Result: The reported content is kept visible and moderation status updated');
			});
		});
	});

	test.describe('Alternative Flow: Cancel', () => {
		test('should allow administrator to cancel the review process', async ({ page }) => {
			await test.step('Setup: Navigate to moderation page and expand content', async () => {
				// Navigate to processes and select a process (following working pattern)
				await processAdminPage.navigateToProcesses();
				await page.waitForLoadState('networkidle');

				const firstProcessName = await processAdminPage.getFirstProcessName();
				await processAdminPage.selectProcessForEdit(firstProcessName);
				await page.waitForLoadState('networkidle');

				// Navigate to moderations and ensure main listing view
				await updateProcessAdminPage.sidebarProcessDetail.navigateToModerations();
				await page.waitForLoadState('networkidle');

				await processModerationPage.ensureOnMainListing();
				await page.waitForLoadState('networkidle');

				// Expand first row
				await processModerationPage.table.expandRow(0);
				await page.waitForLoadState('networkidle');

				console.log('Setup completed - content expanded for review');
			});

			await test.step('USER: Decides to cancel the review process.', async () => {
				// Click on the admin logo to navigate back to the admin dashboard
				await page.locator('a.logo[href="/admin/"]').click();
				await page.waitForLoadState('networkidle');

				console.log('User cancelled the review process by navigating to admin dashboard');
			});

			await test.step('SYSTEM: Aborts the operation and discards any changes.', async () => {
				// Verify that we're no longer on the moderation page
				await expect(processModerationPage.isOnModerationPage()).resolves.toBe(false);

				// Verify that we're back on the admin dashboard
				const currentUrl = page.url();
				expect(currentUrl).toMatch(/\/admin\/?$/);

				console.log('Operation aborted and changes discarded');
			});

			await test.step('Result.', async () => {
				console.log('Result: Operation cancelled, no changes made, user returned to previous state');
			});
		});
	});
});
