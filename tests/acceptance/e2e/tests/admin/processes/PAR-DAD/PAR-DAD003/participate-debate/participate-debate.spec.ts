/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Simone Bianchelli
 * Gianfranco Cedro
 */

import { HomePage } from '@pages/pages/public/HomePage';
import { DebatesOverviewPage } from '@pages/pages/public/processes/DebatesOverviewPage';
import { ProcessDetailPage } from '@pages/pages/public/processes/ProcessDetailPage';
import { ProcessesOverviewPage } from '@pages/pages/public/processes/ProcessesOverviewPage';
import { DebateDetailPage } from '@pages/pages/user/processes/DebateDetailPage';
import { expect } from '@playwright/test';
import { test } from '@fixtures/parallel-test';

/**
 * Test suite for partecipate in a debate topic
 *
 * User Story: As a Citizen, I want to participate in debates so that I can share my views
 * and engage in discussions on specific process’s topics.
 *
 * Requirements: PAR R12a, PAR R12b
 *
 * Prerequisites:
 * - The authorized user (City Administrator or Moderator) has an active account on the platform and is logged in.
 * - The authorized user has permissions to create debates.
 * - The debate component is available and configured properly on Process.
 */
test.describe('[PAR-DAD003] – Participate in a debate', () => {
	let processesOverviewPage: ProcessesOverviewPage;
	let debatesOverviewPage: DebatesOverviewPage;
	let processDetailPage: ProcessDetailPage;
	let debateDetailPage: DebateDetailPage;
	let homePage: HomePage;

	// Use fixed process with known debates component
	const processSlug = 'test';
	const debatesComponentId = '3';
	const debateId = '24'; // Test Debates

	// Track created comment ID for cleanup
	let createdCommentId: string | null = null;

	// Generate unique comment text for each test run
	let testCommentText: string;

	test.beforeEach(async ({ adminPage }) => {
		// Generate unique comment text to avoid conflicts
		const timestamp = Date.now();
		testCommentText = `Test comment ${timestamp}`;

		homePage = new HomePage(adminPage);
		processesOverviewPage = new ProcessesOverviewPage(adminPage);
		processDetailPage = new ProcessDetailPage(adminPage);
		debatesOverviewPage = new DebatesOverviewPage(adminPage);
		debateDetailPage = new DebateDetailPage(adminPage);
		await homePage.navigateToHomePage();
	});

	test.afterEach(async ({ adminPage }) => {
		// Cleanup: delete created comment if it exists
		if (createdCommentId) {
			try {
				console.log(`[Cleanup] Attempting to delete comment ID: ${createdCommentId}`);

				// Navigate directly to the specific debate
				await adminPage.goto(`/processes/${processSlug}/f/${debatesComponentId}/debates/${debateId}`);
				await adminPage.waitForLoadState('load');

				// Delete the comment by ID
				await debateDetailPage.deleteCommentById(createdCommentId);
				console.log(`[Cleanup] Comment deleted successfully`);
			} catch (error) {
				console.error(`[Cleanup] Failed to delete comment:`, error);
			} finally {
				createdCommentId = null;
			}
		}
	});

	test.describe('Main Flow', () => {
		test('should allow user to participate in a debate', async ({ adminPage }) => {
			await test.step('1. User: navigates to the "Processes" section', async () => {
				// Navigate directly to the fixed process with debates
				await adminPage.goto(`/processes/${processSlug}`);
				await adminPage.waitForLoadState('load');
			});
			await test.step('2. System: Displays the details of the selected process', async () => {
				await processDetailPage.expectToBeOnProcessDetailPage();
			});
			await test.step('3. User: Navigate to the "Debates" section of the process', async () => {
				// Navigate directly to the debates section of the process
				await adminPage.goto(`/processes/${processSlug}/f/${debatesComponentId}/debates`);
				await adminPage.waitForLoadState('load');
			});
			await test.step('4. System: Loads all the debates related to the navigated process', async () => {
				await debatesOverviewPage.expectToBeOnDebatesOverviewPage();
			});
			await test.step('5. User: Selects a debate from the list of available debates.', async () => {
				// Navigate directly to the specific debate (Test Debates)
				await adminPage.goto(`/processes/${processSlug}/f/${debatesComponentId}/debates/${debateId}`);
				await adminPage.waitForLoadState('load');
			});
			await test.step('6. System: Displays the selected debate, including the title, description, instructions, and current comments or posts.', async () => {
				await debateDetailPage.expectToBeOnDebateDetailPage();
			});
			await test.step("7. User: Scrolls through the existing comments to review other participants' contributions.", async () => {
				await debateDetailPage.scrollThroughComments();
			});
			await test.step('8. User: Clicks on "Add Comment" to contribute to the debate.', async () => {
				await debateDetailPage.clickCommentButton();
			});
			await test.step('9. User: Types in their comment in the provided text box.', async () => {
				await debateDetailPage.fillComment(testCommentText);
			});
			await test.step('10. User: Clicks "Submit Comment".', async () => {
				await debateDetailPage.submitComment();
				// Track created comment ID for cleanup - find by the unique text we used
				createdCommentId = await debateDetailPage.getCommentIdByText(testCommentText);
				console.log(`[Test] Created comment ID: ${createdCommentId}`);
			});
			await test.step('11. System: Validates the form input for completeness, correctness, and permission checks.', async () => {
				await debateDetailPage.expectToBeOnDebateDetailPage();
			});
			await test.step('12. System: Publishes the comment, making it visible to all participants of the debate.', async () => {
				await debateDetailPage.expectCommentToBeVisible(testCommentText);
			});
			await test.step('13. User: Engages further by liking comments or replying to other posts.', async () => {
				// Upvote the comment we just created using its ID
				if (createdCommentId) {
					await debateDetailPage.upvoteCommentById(createdCommentId);
				}
			});
			await test.step('Result.', async () => {
				const commentsCount = await debateDetailPage.getExistingCommentsCount();
				expect(commentsCount).toBeGreaterThan(0);
			});
		});
	});
});
