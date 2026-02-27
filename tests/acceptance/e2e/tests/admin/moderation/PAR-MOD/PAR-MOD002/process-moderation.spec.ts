/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Simone Bianchelli
 * Denis Vasilev Dimchev
 */

import { AdminHomePage } from '@pages/pages/admin/AdminHomePage';
import { ProcessAdminPage } from '@pages/pages/admin/processes/ProcessAdminPage';
import { UpdateProcessAdminPage } from '@pages/pages/admin/processes/detail/UpdateProcessAdminPage';
import { ProcessModerationPage } from '@pages/components/admin/moderation/process/ProcessModerationPage';
import { test, expect } from '@fixtures/parallel-test-reserved';
import { WebmailPage } from '@pages/base/WebmailPage';

/**
 * Test suite for Process Content Moderation functionality
 *
 * @reserved - This test uses reserved/fixed user accounts
 * and must be run sequentially with --workers=1 to avoid session conflicts.
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
test.describe('@reserved PAR-MOD002 – Process Content Moderation', () => {
	// Force sequential execution: Main Flow → Alternative Flows (in order)
	// This prevents test interference when modifying the same content
	test.describe.configure({ mode: 'serial' });

	let adminHomePage: AdminHomePage;
	let processAdminPage: ProcessAdminPage;
	let updateProcessAdminPage: UpdateProcessAdminPage;
	let processModerationPage: ProcessModerationPage;

	let contentId: string;
	const processSlug = 'test'; // Fixed slug for "Update Test0" process
	const componentId = '3';
	const debateId = '24';
	let reportedContentCount: number;
	const targetProcessName = 'Update Test0';
	const testCommentId = '26'; // fixed id of the published comment to be reported
	let testCommentText = '';

	test.beforeEach(async ({ adminPage }) => {
		adminHomePage = new AdminHomePage(adminPage);
		processAdminPage = new ProcessAdminPage(adminPage);
		updateProcessAdminPage = new UpdateProcessAdminPage(adminPage);
		processModerationPage = new ProcessModerationPage(adminPage);

		// Navigate to admin area
		await adminHomePage.navigateToAdminHomePage();
		await adminPage.waitForLoadState('networkidle');

		console.log('Navigated to Admin Homepage');
	});

	test.afterEach(async ({ adminPage }) => {
		console.log('Starting test cleanup...');

		try {
			if (processSlug) {
				console.log(`Found process slug: ${processSlug}, performing cleanup...`);

				// Navigate to the process moderation page to perform cleanup
				await adminPage.goto(`/admin/participatory_processes/${processSlug}/moderations`);
				await adminPage.waitForLoadState('networkidle');

				// Perform cleanup
				await processModerationPage.cleanupHiddenContent();

				// Wait for cleanup to complete
				await adminPage.waitForLoadState('networkidle');

				console.log('Test cleanup completed successfully');
			} else {
				console.log('No process slug available, skipping cleanup');
			}
		} catch (error) {
			if (error instanceof Error) {
				console.error('Error during test cleanup:', error.message);
			} else {
				console.error('Unknown error during test cleanup');
			}
		}
	});

	test.describe('Main Flow', () => {
		test('should allow administrator to moderate reported content within a specific process', async ({
			adminPage
		}) => {
			await test.step('1. USER: Navigates to the "Processes" section.', async () => {
				// Navigate to processes section
				await processAdminPage.navigateToProcesses();
				console.log('Successfully navigated to Processes section');
			});

			await test.step('2. SYSTEM: Displays a list of all Processes that the City Administrator has created or has permissions to update.', async () => {
				await adminPage.waitForLoadState('networkidle');

				// Verify we're on the processes page, with fallback navigation
				let isOnProcessesPage = await processAdminPage.isOnProcessesPage();

				if (!isOnProcessesPage) {
					// Try direct navigation if component navigation failed
					await adminPage.goto('/admin/participatory_processes');
					await adminPage.waitForLoadState('networkidle');
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
				console.log(`Selecting process: ${targetProcessName} (slug: ${processSlug})`);

				// Navigate directly to the process edit page using the fixed slug
				// This avoids ambiguity between "Update Test0" and "Update Test0 private"
				await adminPage.goto(`/admin/participatory_processes/${processSlug}/edit`);
				await adminPage.waitForLoadState('networkidle');
			});

			await test.step('4. SYSTEM: Loads the selected process and displays the content in an editable form, including all existing information', async () => {
				// Wait for edit form to load
				await processAdminPage.waitForEditFormToLoad();

				// Verify we're on the edit page
				const isOnEditPage = await processAdminPage.isOnProcessEditPage();
				expect(isOnEditPage).toBe(true);

				// Check if the sidebar is visible and loaded
				await expect(updateProcessAdminPage.sidebarProcessDetail.isSidebarVisible()).resolves.toBe(true);

				// Get and display process title
				const titleTextbox = await processAdminPage.getTitleTextbox();
				await expect(titleTextbox).toBeVisible();

				const processTitle = await titleTextbox.inputValue();
				console.log(`Process loaded: ${processTitle}`);
				expect(processTitle).not.toBe('');
			});

			await test.step('5. USER: Clicks on "Moderations" in the process administration section.', async () => {
				// Navigate to moderations section using the sidebar
				await updateProcessAdminPage.sidebarProcessDetail.navigateToProcessModerations();
				await adminPage.waitForLoadState('networkidle');

				// Ensure we're on the main listing page, not a detail page
				await processModerationPage.ensureOnMainListing();
				await adminPage.waitForLoadState('networkidle');

				console.log('Navigated to Moderations section and ensured main listing view');
			});

			await test.step('6. SYSTEM: Displays a list of reported content related to the selected process', async () => {
				// Verify that we are on the moderation page
				await expect(processModerationPage.isPageLoaded()).resolves.toBe(true);

				// Verify we're on the main listing page, not a detail page
				await expect(processModerationPage.isOnMainModerationListing()).resolves.toBe(true);

				// Check if the moderation table is visible
				await expect(processModerationPage.table.isTableVisible()).resolves.toBe(true);

				// Set contentId to our test comment ID
				contentId = testCommentId;
				console.log(`Using test comment ID: ${contentId}`);

				// Ensure test comment is reported and in the moderation table
				await processModerationPage.ensureTestCommentIsReported(contentId, processSlug, componentId, debateId);

				// Verify table structure
				const tableType = await processModerationPage.table.detectTableType();
				console.log(`Table type: ${tableType}`);
				await expect(processModerationPage.table.isMainListingTable()).resolves.toBe(true);

				// Get and verify reported content count
				reportedContentCount = await processModerationPage.table.getRowCount();
				console.log(`Found ${reportedContentCount} reported content items`);
				expect(reportedContentCount).toBeGreaterThan(0);

				// Verify our test comment is in the table
				const isTestCommentPresent = await processModerationPage.isContentIdInModerationTable(contentId);
				expect(isTestCommentPresent).toBe(true);
				console.log(`Test comment ID ${contentId} confirmed in moderation table`);
			});

			await test.step('7. USER: Clicks on a specific piece of reported content to review the complaint.', async () => {
				// Find the row with our test comment ID
				const rowIndex = await processModerationPage.findRowByContentId(contentId);
				expect(rowIndex).toBeGreaterThanOrEqual(0);

				// Get the reported content item
				const rowData = await processModerationPage.table.getRowData(rowIndex);
				console.log(`Reviewing reported content at row ${rowIndex}: ${rowData.type} - ${rowData.reason}`);

				if (rowData.url) {
					const contentUrl = await processModerationPage.table.getReportedContentUrl(rowIndex);
					console.log(`Content URL: ${contentUrl}`);
					expect(contentUrl).not.toBe('');
				}
			});

			await test.step('8. USER: Reviews the metadata and context of the reported content by clicking the "Expand" icon.', async () => {
				// Find the row with our test comment ID
				const rowIndex = await processModerationPage.findRowByContentId(contentId);
				expect(rowIndex).toBeGreaterThanOrEqual(0);

				// Expand the row to see detailed information
				await processModerationPage.table.expandRow(rowIndex);
				await adminPage.waitForLoadState('networkidle');

				console.log('Expanded reported content details for review');

				const currentUrl = adminPage.url();
				console.log(`After expand, current URL: ${currentUrl}`);
				expect(currentUrl).toMatch(/\/moderations\/\d+\/reports/);
			});

			await test.step('9. SYSTEM: Displays full metadata, including the type of content, report reasons, and any additional information provided by the participant.', async () => {
				// We're now on the detail page, which shows the full metadata
				// We can verify the detail page is loaded and shows the metadata
				const detailPageVisible = await adminPage.locator('.moderation-details').isVisible();
				expect(detailPageVisible).toBe(true);

				await expect(processModerationPage.verifyDetailPageLoaded()).resolves.toBe(true);
				await expect(processModerationPage.verifyMetadataPopulated()).resolves.toBe(true);

				// Get metadata including reported content text
				const metadata = await processModerationPage.getDetailPageMetadata();

				// Save the reported content text for later use in notification verification
				testCommentText = metadata.reportedContent;
				console.log(`Saved reported content text: "${testCommentText}"`);

				// Get and verify content ID from the detail page
				const detailPageContentId = await processModerationPage.getContentIdFromDetailPage();
				console.log(`Content ID extracted from detail page: ${detailPageContentId}`);

				// Verify that the detail page shows the correct content ID
				expect(detailPageContentId).toBe(contentId);
				console.log(
					`Verified: Detail page content ID (${detailPageContentId}) matches expected ID (${contentId})`
				);

				// Note: We stay on the detail page since the hide/unreport actions are available here
				// No need to navigate back to main listing until after the action is completed
			});

			await test.step('10. USER: Clicks on the "Hide" icon to accept the report and hide the content.', async () => {
				// We're on the detail page, so the hide action will work from here
				// The hideRow method will detect we're on detail page and use the correct selector
				await processModerationPage.table.hideRow(0);
				await adminPage.waitForLoadState('networkidle');

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

				// Verify the content ID is in hidden list
				const isInHiddenList = await processModerationPage.verifyContentIdInHiddenListWithSlug(
					contentId,
					processSlug
				);
				expect(isInHiddenList).toBe(true);
				console.log(`Content ID ${contentId} confirmed in hidden list`);

				// We are in the page /moderations?hidden=true, so we can get the URL for the specific content ID we just hid
				const reportedContentUrl = await processModerationPage.getReportedContentUrlByContentId(contentId);

				// Navigate to the reported content URL (public view)
				await adminPage.goto(reportedContentUrl);
				await adminPage.waitForLoadState('networkidle');

				// Verify the comment is no longer visible
				const commentIsHidden = await processModerationPage.verifyCommentNotPresentById(contentId);
				expect(commentIsHidden).toBe(true);
				console.log('The comment is no longer visible in the public view');
			});

			await test.step('Result.', async () => {
				// Verify moderation notification via webmail
				const webmailEmail = process.env.OVH_USER_EMAIL || 'info@ldttoolbox.eu';
				const webmailPassword = process.env.OVH_USER_PASSWORD || '';

				const webmailPage = new WebmailPage(adminPage);

				// Navigate to webmail and login
				await webmailPage.navigateToWebmail();
				await webmailPage.login(webmailEmail, webmailPassword);
				console.log(`Logged into webmail as ${webmailEmail}`);

				// Verify the notification email arrived
				await webmailPage.verifyCommentRemovedEmail();

				console.log('Result: The reported content has been hidden and moderation notification email verified');
			});
		});
	});

	test.describe('Alternative Flow: Unreport', () => {
		let reportedContentUrl: string = '';
		test('should allow administrator to unreport content and keep it visible', async ({ adminPage }) => {
			await test.step('Setup: Navigate to moderation page and select content', async () => {
				// Navigate to moderations section
				await updateProcessAdminPage.sidebarProcessDetail.navigateToProcessModerations();
				await adminPage.waitForLoadState('networkidle');

				// Ensure we're on the correct process moderation page
				await adminPage.goto(`/admin/participatory_processes/${processSlug}/moderations`);
				await adminPage.waitForLoadState('networkidle');

				await processModerationPage.ensureOnMainListing();
				await adminPage.waitForLoadState('networkidle');

				// Set contentId to our test comment ID
				contentId = testCommentId;
				console.log(`Using test comment ID: ${contentId}`);

				// Ensure test comment is reported and in the moderation table
				await processModerationPage.ensureTestCommentIsReported(contentId, processSlug, componentId, debateId);

				// Verify table structure
				const tableType = await processModerationPage.table.detectTableType();
				console.log(`Table type: ${tableType}`);
				await expect(processModerationPage.table.isMainListingTable()).resolves.toBe(true);

				// Get and verify reported content count
				reportedContentCount = await processModerationPage.table.getRowCount();
				console.log(`Found ${reportedContentCount} reported content items`);
				expect(reportedContentCount).toBeGreaterThan(0);

				// Verify our test comment is in the table
				const isTestCommentPresent = await processModerationPage.isContentIdInModerationTable(contentId);
				expect(isTestCommentPresent).toBe(true);
				console.log(`Test comment ID ${contentId} confirmed in moderation table`);

				// Find the row with our test comment ID
				const rowIndex = await processModerationPage.findRowByContentId(contentId);
				expect(rowIndex).toBeGreaterThanOrEqual(0);

				// Save the reported content URL for later verification
				reportedContentUrl = await processModerationPage.getReportedContentUrlByContentId(contentId);
				console.log(`Saved reported content URL for later verification: ${reportedContentUrl}`);

				// Expand the row to see detailed information
				await processModerationPage.table.expandRow(rowIndex);
				await adminPage.waitForLoadState('networkidle');

				console.log('Expanded reported content details for unreport review');

				const currentUrl = adminPage.url();
				console.log(`After expand, current URL: ${currentUrl}`);
				expect(currentUrl).toMatch(/\/moderations\/\d+\/reports/);

				console.log('Setup completed - ready to test unreport flow');
			});

			await test.step('10.1. USER: Clicks on the "Unreport" icon to reject the report', async () => {
				// We're already on the detail page from the expand action in setup
				// The unreportRow method will detect we're on detail page and use the correct selector
				await processModerationPage.table.unreportRow(0);
				await adminPage.waitForLoadState('networkidle');

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

				// Verify that the content ID is no longer in the moderation table
				// (since it's been unreported and should be removed from the not-hidden list)
				const isStillInTable = await processModerationPage.isContentIdInModerationTable(contentId);
				expect(isStillInTable).toBe(false);
				console.log(`Verified: Content ID ${contentId} is no longer in moderation table (unreported)`);

				// Navigate to the public debate page to verify the comment is visible
				await adminPage.goto(reportedContentUrl);
				await adminPage.waitForLoadState('networkidle');
				console.log(`Navigated to public debate page: ${reportedContentUrl}`);

				// Verify the comment is now visible again in the public view
				const commentIsVisible = !(await processModerationPage.verifyCommentNotPresentById(contentId));
				expect(commentIsVisible).toBe(true);
				console.log(`Verified: Comment ID ${contentId} is now visible in the public debate`);

				// Additional verification: Check that the comment content is present
				const commentElement = adminPage.locator(`#comment_${contentId}`);
				await expect(commentElement).toBeVisible();

				const commentText = await commentElement.textContent();
				expect(commentText).toContain('test comment for moderation');
				console.log(`Verified: Comment contains expected text`);

				console.log('Result: The reported content is kept visible and moderation status updated');
			});
		});
	});

	test.describe('Alternative Flow: Cancel', () => {
		test('should allow administrator to cancel the review process', async ({ adminPage }) => {
			await test.step('Setup: Navigate to moderation page and expand content', async () => {
				// Navigate to moderations section
				await updateProcessAdminPage.sidebarProcessDetail.navigateToProcessModerations();
				await adminPage.waitForLoadState('networkidle');

				// Ensure we're on the correct process moderation page
				await adminPage.goto(`/admin/participatory_processes/${processSlug}/moderations`);
				await adminPage.waitForLoadState('networkidle');

				await processModerationPage.ensureOnMainListing();
				await adminPage.waitForLoadState('networkidle');

				// Set contentId to our test comment ID
				contentId = testCommentId;
				console.log(`Using test comment ID: ${contentId}`);

				// Ensure test comment is reported and in the moderation table
				await processModerationPage.ensureTestCommentIsReported(contentId, processSlug, componentId, debateId);

				// Verify table structure
				const tableType = await processModerationPage.table.detectTableType();
				console.log(`Table type: ${tableType}`);
				await expect(processModerationPage.table.isMainListingTable()).resolves.toBe(true);

				// Get and verify reported content count
				reportedContentCount = await processModerationPage.table.getRowCount();
				console.log(`Found ${reportedContentCount} reported content items`);
				expect(reportedContentCount).toBeGreaterThan(0);

				// Verify our test comment is in the table
				const isTestCommentPresent = await processModerationPage.isContentIdInModerationTable(contentId);
				expect(isTestCommentPresent).toBe(true);
				console.log(`Test comment ID ${contentId} confirmed in moderation table`);

				// Find the row with our test comment ID
				const rowIndex = await processModerationPage.findRowByContentId(contentId);
				expect(rowIndex).toBeGreaterThanOrEqual(0);

				// Expand the row to see detailed information
				await processModerationPage.table.expandRow(rowIndex);
				await adminPage.waitForLoadState('networkidle');

				console.log('Setup completed - content expanded for review');
			});

			await test.step('USER: Decides to cancel the review process.', async () => {
				// Click on the admin logo to navigate back to the admin dashboard
				await adminPage.locator('a.logo[href="/admin/"]').click();
				await adminPage.waitForLoadState('networkidle');

				console.log('User cancelled the review process by navigating to admin dashboard');
			});

			await test.step('SYSTEM: Aborts the operation and discards any changes.', async () => {
				// Verify that we're no longer on the moderation page
				await expect(processModerationPage.isOnModerationPage()).resolves.toBe(false);

				// Verify that we're back on the admin dashboard
				const currentUrl = adminPage.url();
				expect(currentUrl).toMatch(/\/admin\/?$/);

				console.log('Operation aborted and changes discarded');
			});

			await test.step('Result.', async () => {
				console.log('Result: Operation cancelled, no changes made, user returned to previous state');
			});
		});

		test.describe('Alternative Flow: Submission error', () => {
			test('should handle submission error and allow user to retry with valid data', async ({ adminPage }) => {
				await test.step('Setup: Navigate to moderation page and verify content status', async () => {
					// Navigate to moderations section
					await updateProcessAdminPage.sidebarProcessDetail.navigateToProcessModerations();
					await adminPage.waitForLoadState('networkidle');

					// Ensure we're on the correct process moderation page
					await adminPage.goto(`/admin/participatory_processes/${processSlug}/moderations`);
					await adminPage.waitForLoadState('networkidle');

					await processModerationPage.ensureOnMainListing();
					await adminPage.waitForLoadState('networkidle');

					// Set contentId to our test comment ID
					contentId = testCommentId;
					console.log(`Using test comment ID: ${contentId}`);

					// Check if the comment is present in the moderation table
					const isCommentInTable = await processModerationPage.isContentIdInModerationTable(contentId);

					if (isCommentInTable) {
						console.log(`Test comment ID ${contentId} found in moderation table`);

						// Verify our test comment is in the table
						reportedContentCount = await processModerationPage.table.getRowCount();
						console.log(`Found ${reportedContentCount} reported content items`);
						expect(reportedContentCount).toBeGreaterThan(0);

						// Find the row with our test comment ID
						const rowIndex = await processModerationPage.findRowByContentId(contentId);
						expect(rowIndex).toBeGreaterThanOrEqual(0);

						// Expand the row to see detailed information
						await processModerationPage.table.expandRow(rowIndex);
						await adminPage.waitForLoadState('networkidle');

						console.log('Expanded reported content details');

						// Unreport the content to make it visible again
						await processModerationPage.table.unreportRow(0);
						await adminPage.waitForLoadState('networkidle');

						console.log('Unreported the content to make it visible again');

						// Wait for success message
						await expect(processModerationPage.flashMessage.isSuccessMessageVisible()).resolves.toBe(true);
					} else {
						console.log(`Test comment ID ${contentId} not found in moderation table, skipping unreport`);
					}

					// Navigate to the public debate page
					await processModerationPage.navigateToDebate(processSlug, componentId, debateId);
					await adminPage.waitForLoadState('networkidle');

					console.log('Setup completed - navigated to public debate page');

					// Generate oversized text
					const longReportReason = processModerationPage.generateOversizedText();

					// Report comment with oversized content
					await processModerationPage.reportCommentById(contentId, longReportReason);
					await adminPage.waitForLoadState('networkidle');

					console.log('Submitted report with oversized content');
				});

				await test.step('10.1. SYSTEM: Encounters an error while updating the status', async () => {
					const has413Error = await processModerationPage.verify413ErrorPage();
					expect(has413Error).toBe(true);
					console.log('Displays an error message indicating the failure');
				});

				await test.step('10.3. USER: Chooses to retry the operation', async () => {
					// Simulate browser back button
					await adminPage.goBack();
					await adminPage.waitForLoadState('networkidle');

					const currentUrl = adminPage.url();
					console.log(`Navigated back to: ${currentUrl}`);

					// Verify we're back on the debate page
					expect(currentUrl).toContain(`/processes/${processSlug}/f/${componentId}/debates/${debateId}`);

					// Verify the comment is still visible
					const commentSelector = `#comment_${contentId}`;
					await expect(adminPage.locator(commentSelector)).toBeVisible();

					console.log('User returned to debate page');

					// Report comment again with valid content
					const validReportReason = 'Additional report comment.';
					await processModerationPage.reportCommentById(contentId, validReportReason);

					console.log('Submitted report with valid content');

					// Wait for and verify success message
					const hasSuccessMessage = await processModerationPage.waitForReportSuccessMessage();
					expect(hasSuccessMessage).toBe(true);
					console.log('Success message confirmed');

					console.log(
						'Result: The reported content status is not updated due to a submission error. The user is informed and can retry the operation.'
					);
				});
			});
		});
	});
});
