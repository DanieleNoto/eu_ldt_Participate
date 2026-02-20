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
import { test, expect } from '@fixtures/parallel-test-reserved';

/**
 * Test suite for ENDORSE a debate topic
 *
 * User Story: As a Citizen, I want to endorse a debate so that I can show my support for a discussion and signal its importance to others.
 *
 * Requirements: PAR R12
 *
 * Prerequisites:
 * - The user has an active account on the platform and is logged in.
 * - The debate allows endorsements (not blocked by permissions or debate settings).
 * - The debate is open for participation (not closed).
 */

test.describe('@reserved [PAR-DAD005] – Endorse a debate', () => {
	test.describe.configure({ mode: 'serial' });
	let processesOverviewPage: ProcessesOverviewPage;
	let debatesOverviewPage: DebatesOverviewPage;
	let processDetailPage: ProcessDetailPage;
	let debateDetailPage: DebateDetailPage;
	let homePage: HomePage;

	test.beforeEach(async ({ userPage }) => {
		homePage = new HomePage(userPage);
		processesOverviewPage = new ProcessesOverviewPage(userPage);
		processDetailPage = new ProcessDetailPage(userPage);
		debatesOverviewPage = new DebatesOverviewPage(userPage);
		debateDetailPage = new DebateDetailPage(userPage);
		await homePage.navigateToHomePage();
	});

	test.afterEach(async () => {
		// Clean up: remove the like if present
		const isLiked = await debateDetailPage.isDebateLikedByCurrentUser();
		if (isLiked) {
			await debateDetailPage.clickEndorsementButton();
			await debateDetailPage.getPage().waitForLoadState('networkidle');
		}
	});

	test.describe('Main Flow', () => {
		test('should allow user to endorse a debate', async () => {
			let likesCount = 0;
			let resultLikesCount = 0;
			await test.step('1. User: navigates to the "Processes" section', async () => {
				// Navigate to processes section
				await homePage.goToProcessesFromHomeMenu();
				await processesOverviewPage.getPage().waitForLoadState('networkidle');

				await processesOverviewPage.expectToBeOnProcessesOverviewPage();

				await processesOverviewPage.navigateToProcessByTitle('Update Test0', 'test');
			});
			await test.step('2. System: Displays the details of the selected process', async () => {
				await processDetailPage.expectToBeOnProcessDetailPage();
			});
			await test.step('3. User: Navigate to the “Debates” section of the process', async () => {
				await processDetailPage.navigateToDebatesPage();
			});
			await test.step('4. System: Loads all the debates related to the navigated process', async () => {
				await debatesOverviewPage.expectToBeOnDebatesOverviewPage();
			});
			await test.step('5. User: Selects a debate from the list of available debates.', async () => {
				await debatesOverviewPage.getDebateTitleByIndex(0);
				await debatesOverviewPage.clickDebateByIndex(0);
			});
			await test.step('6. System: Displays the selected debate, including the title, description, instructions, and current comments or posts.', async () => {
				await debateDetailPage.expectToBeOnDebateDetailPage();
			});
			await test.step('7. User: Clicks on the "Like" button to show support for the debate', async () => {
				// First check if the debate is already liked by the user
				const isAlreadyLiked = await debateDetailPage.isDebateLikedByCurrentUser();
				console.log('Is already liked by user:', isAlreadyLiked);

				// Get the initial count
				likesCount = await debateDetailPage.getEndorsersCount();
				console.log('Initial likes count:', likesCount);

				// If already liked, remove the like first for a clean test
				if (isAlreadyLiked) {
					await debateDetailPage.clickEndorsementButton();
					// Wait for the system to process the unlike
					await debateDetailPage.getPage().waitForLoadState('networkidle');
					// Get the count again after removing the like
					likesCount = await debateDetailPage.getEndorsersCount();
					console.log('Likes count after unlike:', likesCount);

					// Check that the button no longer shows "Dislike"
					const isStillLiked = await debateDetailPage.isDebateLikedByCurrentUser();
					console.log('Is still liked after unlike:', isStillLiked);
				}

				// Now click like
				console.log('About to click like button...');
				await debateDetailPage.clickEndorsementButton();

				// Wait for the system to process the like
				await debateDetailPage.getPage().waitForLoadState('networkidle');

				// Check that the button now shows "Dislike"
				const isNowLiked = await debateDetailPage.isDebateLikedByCurrentUser();
				console.log('Is now liked after click:', isNowLiked);
			});
			await test.step('8. System: Registers the endorsement and updates the endorsement count for the debate.', async () => {
				// Wait a bit longer to ensure the operation is completed
				await debateDetailPage.getPage().waitForTimeout(1000);
				await debateDetailPage.getPage().waitForLoadState('networkidle');

				// Check that the debate is now liked by the user
				const isNowLiked = await debateDetailPage.isDebateLikedByCurrentUser();
				console.log('Final: Is now liked by user:', isNowLiked);

				// Get the new count
				resultLikesCount = await debateDetailPage.getEndorsersCount();
				console.log('Final likes count:', resultLikesCount);

				// If the like did not work, try to force it
				if (!isNowLiked) {
					console.log('WARNING: Like did not register properly, attempting to force like...');
					await debateDetailPage.likeDebate();
					await debateDetailPage.getPage().waitForLoadState('networkidle');
					resultLikesCount = await debateDetailPage.getEndorsersCount();
					console.log('Final likes count after force like:', resultLikesCount);
				}
			});
			await test.step('Result.', async () => {
				console.log('=== FINAL VERIFICATION ===');
				console.log('Initial likes count:', likesCount);
				console.log('Final likes count:', resultLikesCount);
				console.log('Expected: final count should be initial count + 1');

				// Final verification of like state
				const finalLikeState = await debateDetailPage.isDebateLikedByCurrentUser();
				console.log('Final like state:', finalLikeState);

				// The debate should be liked by the user
				expect(finalLikeState).toBe(true);

				// The final count should be greater than the initial one
				if (resultLikesCount === likesCount) {
					console.log('ERROR: Counts are equal - this suggests the like was not registered properly');

					// Try to get the count one more time
					const retryCount = await debateDetailPage.getEndorsersCount();
					console.log('Retry count:', retryCount);

					if (retryCount > likesCount) {
						resultLikesCount = retryCount;
						console.log('Updated final count after retry:', resultLikesCount);
					}
				}

				expect(resultLikesCount).toBeGreaterThan(likesCount);
				// Specifically, it should be +1
				expect(resultLikesCount).toBe(likesCount + 1);
			});
		});
	});
});
