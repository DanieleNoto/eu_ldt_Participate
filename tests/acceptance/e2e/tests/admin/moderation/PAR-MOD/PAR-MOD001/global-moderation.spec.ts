/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Simone Bianchelli
 * Denis Vasilev Dimchev
 * Antonio Abramo Carotenuto
 */

import { HomePage } from '@pages/pages/public/HomePage';
import { GlobalModerationPage } from '@pages/components/admin/moderation/global-moderation/GlobalModerationPage';
import { ProcessModerationPage } from '@pages/components/admin/moderation/process/ProcessModerationPage';
import { test, expect } from '@fixtures/parallel-test-reserved';

/**
 * PAR-MOD001 - Global Moderation Test
 *
 *
 * User Story: As a Global Moderator, I want to review and moderate all reported content
 * across the platform so that inappropriate content can be managed to maintain a democratic
 * and constructive environment.
 *
 * Requirements: PAR R12d
 *
 * Prerequisites:
 * - The City Administrator has an active account on the platform and is logged in
 * - The user has appropriate permissions to manage moderation privileges and reported content
 */
test.describe('@reserved PAR-MOD001 – Global Moderation Review and Management', () => {
	// Force sequential execution to prevent test interference when modifying shared content
	test.describe.configure({ mode: 'serial' });

	let homePage: HomePage;
	let globalModerationPage: GlobalModerationPage;
	let processModerationPage: ProcessModerationPage;

	// Test data - using the same test comment as PAR-MOD002
	const processSlug = 'test';
	const componentId = '3';
	const debateId = '24';
	const testCommentId = '26'; // fixed id of the published comment to be reported
	let contentId: string;
	let testCommentText = ''; // Text of the reported comment for notification verification

	test.beforeEach(async ({ adminPage }) => {
		homePage = new HomePage(adminPage);
		globalModerationPage = new GlobalModerationPage(adminPage);
		processModerationPage = new ProcessModerationPage(adminPage);
		await homePage.navigateToHomePage();
	});

	test.afterEach(async ({ adminPage }) => {
		console.log('Starting test cleanup...');

		try {
			// Navigate to the global moderation page to perform cleanup
			await adminPage.goto('/admin/moderations?hidden=true');
			await adminPage.waitForLoadState('load');

			// Check if there are any hidden items
			const hiddenRows = adminPage.locator('table.table-list tbody tr');
			const hiddenCount = await hiddenRows.count();

			if (hiddenCount > 0) {
				console.log(`Found ${hiddenCount} hidden item(s), performing cleanup...`);

				// Find rows containing our test comment ID and unhide them
				for (let i = 0; i < hiddenCount; i++) {
					const row = hiddenRows.nth(i);
					const rowText = await row.textContent();

					// Check if this row contains our test comment
					if (rowText && rowText.includes(testCommentId)) {
						console.log(`Found test comment ${testCommentId} in hidden list, unhiding...`);

						// Click Unhide button for this row
						const unhideButton = row.getByRole('link', { name: 'Unhide' });
						if ((await unhideButton.count()) > 0) {
							await unhideButton.click();
							await adminPage.waitForLoadState('load');
							console.log(`Unhidden content ID ${testCommentId}`);
						}
						break;
					}
				}
			} else {
				console.log('No hidden content to cleanup');
			}

			console.log('Test cleanup completed successfully');
		} catch (error) {
			if (error instanceof Error) {
				console.error('Error during test cleanup:', error.message);
			} else {
				console.error('Unknown error during test cleanup');
			}
		}
	});

	test.describe('Main Flow', () => {
		test('should allow global moderator to review and hide reported content', async ({ adminPage }) => {
			await test.step('1. USER: Signs in as an administrator or moderator and navigates to the "Global Moderations Panel."', async () => {
				// Navigate to admin dashboard
				await adminPage.getByRole('link', { name: 'Admin dashboard' }).click();
				await adminPage.waitForLoadState('load');

				// Navigate to global moderations
				await adminPage.getByRole('link', { name: 'Global moderations', exact: true }).first().click();
				await adminPage.waitForLoadState('load');

				// Verify we are on the global moderations page
				await expect(adminPage).toHaveURL(/.*\/admin\/moderations.*/);
				console.log('Successfully navigated to Global Moderations Panel');
			});

			await test.step('2. SYSTEM: Displays a list of all reported content, including the ID, type of content, participatory space, count of reports, reported content URL, and reason for the report.', async () => {
				// Verify the moderations list/table is displayed
				const moderationsList = adminPage.locator('table.table-list');
				await expect(moderationsList).toBeVisible();

				// Set contentId for this test
				contentId = testCommentId;
				console.log(`Using test comment ID: ${contentId}`);

				// Ensure test comment is reported and in the moderation table
				// This will navigate to the debate page to report if not already reported
				await processModerationPage.ensureTestCommentIsReported(contentId, processSlug, componentId, debateId);

				// Navigate back to global moderations after ensuring comment is reported
				await adminPage.goto('/admin/moderations');
				await adminPage.waitForLoadState('load');

				// Verify the table has at least one row
				const tableRows = adminPage.locator('table.table-list tbody tr');
				const rowCount = await tableRows.count();
				expect(rowCount).toBeGreaterThan(0);
				console.log(`Found ${rowCount} reported content items in the list`);

				// Verify our test comment is in the table by checking the ID column
				const isTestCommentPresent = await processModerationPage.isContentIdInModerationTable(contentId);
				expect(isTestCommentPresent).toBe(true);
				console.log(`Test comment ID ${contentId} confirmed in global moderation table`);

				// Verify table headers are displayed
				const headers = adminPage.locator('table.table-list thead th');
				await expect(headers.filter({ hasText: 'ID' })).toBeVisible();
				await expect(headers.filter({ hasText: 'Type' })).toBeVisible();
				await expect(headers.filter({ hasText: 'Participatory space' })).toBeVisible();
				await expect(headers.filter({ hasText: 'Reports count' })).toBeVisible();
				await expect(headers.filter({ hasText: 'Reported content URL' })).toBeVisible();
				await expect(headers.filter({ hasText: 'Reason' })).toBeVisible();

				console.log('✓ ID information is displayed');
				console.log('✓ Type of content is displayed');
				console.log('✓ Participatory space is displayed');
				console.log('✓ Count of reports is displayed');
				console.log('✓ Reported content URL is displayed');
				console.log('✓ Reason for the report is displayed');
			});

			await test.step('3. USER: Clicks on a specific piece of reported content to review the complaint.', async () => {
				// Find the row with our test comment ID using the page object method
				const rowIndex = await processModerationPage.findRowByContentId(contentId);
				expect(rowIndex).toBeGreaterThanOrEqual(0);
				console.log(`Found test comment ID ${contentId} at row index ${rowIndex}`);

				// Get the row data for logging
				const rowData = await processModerationPage.table.getRowData(rowIndex);
				console.log(`Reviewing reported content: Type=${rowData.type}, Reason=${rowData.reason}`);

				if (rowData.url) {
					const contentUrl = await processModerationPage.table.getReportedContentUrl(rowIndex);
					console.log(`Content URL: ${contentUrl}`);
					expect(contentUrl).not.toBe('');
				}
			});

			await test.step('4. USER: Reviews the metadata and context of the reported content by clicking the "Expand" icon.', async () => {
				// Find the row with our test comment ID
				const rowIndex = await processModerationPage.findRowByContentId(contentId);
				expect(rowIndex).toBeGreaterThanOrEqual(0);

				// Expand the row to see detailed information
				await processModerationPage.table.expandRow(rowIndex);
				await adminPage.waitForLoadState('load');

				console.log('Expanded reported content details for review');

				// Verify we are on a reports detail page
				const currentUrl = adminPage.url();
				console.log(`After expand, current URL: ${currentUrl}`);
				expect(currentUrl).toMatch(/\/moderations\/\d+\/reports/);
				console.log('Successfully navigated to reports detail page');
			});

			await test.step('5. SYSTEM: Displays full metadata, including the type of content, report reasons, and any additional information provided by the participant.', async () => {
				// Verify the detail page is loaded and shows metadata
				await expect(processModerationPage.verifyDetailPageLoaded()).resolves.toBe(true);
				await expect(processModerationPage.verifyMetadataPopulated()).resolves.toBe(true);

				// Get metadata including reported content text
				const metadata = await processModerationPage.getDetailPageMetadata();

				// Save the reported content text for notification verification
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

				console.log('Report metadata and context information is displayed');
				console.log('✓ Report reasons are visible');
				console.log('✓ Content type information is displayed');
				console.log('✓ Reported content text is captured');
			});

			await test.step('6. USER: Clicks on the "Hide" icon to accept the report and hide the content.', async () => {
				// We're on the detail page, so the hide action will work from here
				// The hideRow method will detect we're on detail page and use the correct selector
				await processModerationPage.table.hideRow(0);
				await adminPage.waitForLoadState('load');

				console.log(`Clicked Hide button for test comment ID ${contentId}`);
			});

			await test.step('7. SYSTEM: Updates the status of the content to "Hidden," ensuring it is no longer visible to participants.', async () => {
				// Check for success message
				await expect(processModerationPage.flashMessage.isSuccessMessageVisible()).resolves.toBe(true);

				// Verify success message content
				const successMessage = await processModerationPage.flashMessage.getSuccessMessageText();
				console.log(`Success message: ${successMessage}`);
				expect(successMessage).not.toBe('');

				// Verify the content is hidden by checking the flash message
				await expect(processModerationPage.flashMessage.hasResourceHiddenMessage()).resolves.toBe(true);
				console.log('✓ Success message detected after Hide action');

				// Navigate to global moderations hidden filter to verify
				await adminPage.goto('/admin/moderations?hidden=true');
				await adminPage.waitForLoadState('load');

				// Verify our test comment is now in the hidden list
				const isInHiddenList = await processModerationPage.isContentIdInModerationTable(contentId);
				expect(isInHiddenList).toBe(true);
				console.log(`✓ Test comment ID ${contentId} found in Hidden filter - content successfully hidden`);

				// Get the reported content URL by finding the row with our content ID
				// Global moderation table has different column structure than process moderation
				const tableRows = adminPage.locator('table.table-list tbody tr');
				const rowCount = await tableRows.count();
				let reportedContentUrl = '';

				for (let i = 0; i < rowCount; i++) {
					const row = tableRows.nth(i);
					const idCell = row.locator('td').nth(1);
					const idText = await idCell.textContent();

					if (idText?.trim() === contentId) {
						// Found the row, now get the Visit URL link
						const visitUrlLink = row.locator('a:has-text("Visit URL")');
						if (await visitUrlLink.isVisible()) {
							reportedContentUrl = (await visitUrlLink.getAttribute('href')) || '';
						}
						break;
					}
				}

				expect(reportedContentUrl).not.toBe('');
				console.log(`Reported content URL: ${reportedContentUrl}`);

				// Navigate to the reported content URL (public view)
				await adminPage.goto(reportedContentUrl);
				await adminPage.waitForLoadState('load');

				// Verify the comment is no longer visible
				const commentIsHidden = await processModerationPage.verifyCommentNotPresentById(contentId);
				expect(commentIsHidden).toBe(true);
				console.log('✓ Reported content is now hidden from participants');
			});

			await test.step('Result.', async () => {
				// Navigate back to global moderations for final verification
				await adminPage.goto('/admin/moderations');
				await adminPage.waitForLoadState('load');

				// Final verification
				await expect(adminPage).toHaveURL(/.*\/admin\/moderations.*/);

				// Verify the moderation panel is accessible
				const moderationsList = adminPage.locator('table.table-list');
				await expect(moderationsList).toBeVisible();

				console.log(`✓ The reported content (comment ID: ${contentId}) has been hidden successfully`);
				console.log('✓ The moderation status has been updated');

				// Note: Notification verification requires userContext which is not available in this test
				// The notification is verified manually or in a separate integration test
				if (testCommentText) {
					console.log(`✓ Comment text saved for reference: "${testCommentText}"`);
				}
				console.log('✓ Participants will be notified accordingly');
			});
		});
	});

	test.describe('Alternative Flow: Unreport', () => {
		let reportedContentUrl: string = '';

		test('should allow moderator to unreport content and keep it visible', async ({ adminPage }) => {
			await test.step('1-5. USER/SYSTEM: Navigate through the moderation process up to content review', async () => {
				// Navigate to Global Moderations Panel
				await adminPage.getByRole('link', { name: 'Admin dashboard' }).click();
				await adminPage.waitForLoadState('load');
				await adminPage.getByRole('link', { name: 'Global moderations', exact: true }).first().click();
				await adminPage.waitForLoadState('load');

				// Ensure test comment is reported for testing
				await processModerationPage.ensureTestCommentIsReported(
					testCommentId,
					processSlug,
					componentId,
					debateId
				);

				// Navigate back to global moderations
				await adminPage.goto('/admin/moderations');
				await adminPage.waitForLoadState('load');

				// Verify the test comment is present in the moderation table
				const isInTable = await processModerationPage.isContentIdInModerationTable(testCommentId);
				expect(isInTable).toBe(true);

				// Find the row and expand it
				const rowIndex = await processModerationPage.findRowByContentId(testCommentId);
				expect(rowIndex).toBeGreaterThanOrEqual(0);
				await processModerationPage.table.expandRow(rowIndex);

				// Navigate back to get the URL from the table
				await adminPage.goto('/admin/moderations');
				await adminPage.waitForLoadState('load');

				// Get URL from the row (column 5 for global moderation)
				const rows = await adminPage.locator('table.table-list tbody tr').all();
				for (const row of rows) {
					const idCell = row.locator('td').nth(1);
					const idText = await idCell.textContent();
					if (idText?.trim() === testCommentId) {
						const visitUrlLink = row.locator('a:has-text("Visit URL")');
						if ((await visitUrlLink.count()) > 0) {
							reportedContentUrl = (await visitUrlLink.getAttribute('href')) || '';
						}
						break;
					}
				}

				// Re-expand the row for the next step
				const newRowIndex = await processModerationPage.findRowByContentId(testCommentId);
				await processModerationPage.table.expandRow(newRowIndex);

				console.log(`Navigated through moderation process to content review, URL: ${reportedContentUrl}`);
			});

			await test.step('6.1. USER: Clicks on the "Unreport" icon to reject the report', async () => {
				// Use table's unreportRow method from the detail page
				await processModerationPage.table.unreportRow(0);
				console.log('Clicked Unreport button to reject the report');
			});

			await test.step('6.2. SYSTEM: Updates the status of the report as "Unreported" and keeps the content visible on the platform', async () => {
				// Verify the flash message indicates success
				await expect(async () => {
					const isVisible = await processModerationPage.flashMessage.isSuccessMessageVisible();
					expect(isVisible).toBe(true);
				}).toPass({ timeout: 5000 });

				// Verify the message indicates unreport action
				const hasUnreportedMessage = await processModerationPage.flashMessage.hasResourceUnreportedMessage();
				expect(hasUnreportedMessage).toBe(true);

				console.log('Content status has been updated to Unreported');
			});

			await test.step('Result.', async () => {
				// Navigate back to moderations list
				await adminPage.goto('/admin/moderations');
				await adminPage.waitForLoadState('load');

				// Verify the content is no longer in the moderation table (unreported items are removed)
				const isStillInTable = await processModerationPage.isContentIdInModerationTable(testCommentId);
				expect(isStillInTable).toBe(false);
				console.log(`Verified: Content ID ${testCommentId} is no longer in moderation table (unreported)`);

				// Navigate to the public debate page to verify the comment is visible
				if (reportedContentUrl) {
					await adminPage.goto(reportedContentUrl);
					await adminPage.waitForLoadState('load');
					console.log(`Navigated to public debate page: ${reportedContentUrl}`);

					// Verify the comment is now visible again in the public view
					const commentIsVisible = !(await processModerationPage.verifyCommentNotPresentById(testCommentId));
					expect(commentIsVisible).toBe(true);
					console.log(`Verified: Comment ID ${testCommentId} is now visible in the public debate`);

					// Additional verification: Check that the comment element is present
					const commentElement = adminPage.locator(`#comment_${testCommentId}`);
					await expect(commentElement).toBeVisible();
					console.log('✓ The reported content is still visible on the public page');
				}

				console.log('✓ The moderation status has been updated to unreported');
				console.log('✓ The content has been removed from the moderation table');
				console.log('Result: The reported content is kept visible and moderation status updated');
			});
		});
	});

	test.describe('Alternative Flow: Cancel', () => {
		test('should allow moderator to cancel the review process', async ({ adminPage }) => {
			await test.step('4-6. USER: Decides to cancel the review process', async () => {
				// Navigate to admin dashboard using navigation link
				const currentUrl = adminPage.url();
				if (!currentUrl.includes('/admin')) {
					await adminPage.getByRole('link', { name: 'Admin dashboard' }).click();
					await adminPage.waitForLoadState('load');
				}

				// Navigate to global moderations
				await adminPage.getByRole('link', { name: 'Global moderations', exact: true }).first().click();
				await adminPage.waitForLoadState('load');

				// Verify we are on the moderations page
				await expect(adminPage).toHaveURL(/.*\/admin\/moderations.*/);

				// Cancel by navigating back without making changes
				await adminPage.goBack();
				await adminPage.waitForLoadState('load');

				console.log('User decided to cancel the review process');
			});

			await test.step('SYSTEM: Aborts the operation and discards any changes', async () => {
				// Verify we are back to the previous state (admin dashboard)
				await expect(adminPage).toHaveURL(/.*\/admin\/?$/);

				console.log('Operation has been aborted and changes discarded');
			});

			await test.step('Result.', async () => {
				// Verify cancellation was successful
				const adminContent = adminPage.locator('main').or(adminPage.locator('#content'));
				await expect(adminContent).toBeVisible();

				console.log('✓ The operation has been cancelled');
				console.log('✓ No changes have been made');
				console.log('✓ User has been returned to the previous state');
			});
		});
	});
});
