/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Simone Bianchelli
 * Denise Scarcelli
 * Gianfranco Cedro
 */

import { HomePage } from '@pages/pages/public/HomePage';
import NotificationPage from '@pages/pages/user/NotificationPage';
import { DebateDetailPage } from '@pages/pages/user/processes/DebateDetailPage';
import { test } from '@fixtures/parallel-test-reserved';

/**
 * Test suite for Allows citizens to mark individual or multiple notifications as read, ensuring they can effectively manage their notifications and track what they have already reviewed.
 *
 * User Story: 	As a Citizen, I want to mark my notifications as read so that I can keep track of which updates I have already reviewed and better manage my notifications.
 *
 * Requirements: PAR R13, PAR R14, PAR R8
 *
 * Prerequisites:
 *
 * - The citizen has an active account on the platform and is logged in.
 * - Notifications are enabled, and activities have generated notifications for the citizen
 *
 */

test.describe('@reserved [PAR-NOT004] – Mark notifications as reads', () => {
	test.describe.configure({ mode: 'serial' });

	let notificationCount = -1;
	let notificationPage: NotificationPage;
	let homePage: HomePage;
	let createdCommentId: string | null = null;

	const processSlug = 'test';
	const componentId = '3';
	const debateId = '24';

	test.beforeEach(async ({ userPage, adminPage }) => {
		// Step 1: Admin navigates to debate page and leaves a comment
		const debateDetailPage = new DebateDetailPage(adminPage);
		const debateUrl = `/processes/${processSlug}/f/${componentId}/debates/${debateId}`;

		console.log(`Admin navigating to debate: ${debateUrl}`);
		await adminPage.goto(debateUrl);
		await adminPage.waitForLoadState('networkidle');

		// Wait for comments to load (wait for "Loading comments..." to disappear)
		await debateDetailPage.waitForCommentsToLoad();
		console.log('Comments loaded, form should be enabled');

		// Add comment with mention (without setting opinion, as this debate may not have opinions enabled)
		const commentText = 'test comment @info';
		await debateDetailPage.fillComment(commentText);
		await debateDetailPage.submitComment();
		console.log(`Admin added comment: "${commentText}"`);

		// Get the ID of the comment just created
		createdCommentId = await debateDetailPage.getCommentIdByText(commentText);
		console.log(`Created comment ID: ${createdCommentId}`);

		// Step 2: User navigates to home page
		notificationPage = new NotificationPage(userPage);
		homePage = new HomePage(userPage);
		await homePage.navigateToHomePage();
	});

	test.afterEach(async ({ adminPage }) => {
		// Cleanup: Delete the comment created in beforeEach
		if (createdCommentId) {
			try {
				console.log(`Cleaning up comment ID: ${createdCommentId}`);
				const debateDetailPage = new DebateDetailPage(adminPage);
				const debateUrl = `/processes/${processSlug}/f/${componentId}/debates/${debateId}`;

				await adminPage.goto(debateUrl);
				await adminPage.waitForLoadState('networkidle');

				// Wait for comments to load before deleting
				await debateDetailPage.waitForCommentsToLoad();

				// Delete the comment
				await debateDetailPage.deleteCommentById(createdCommentId);
				console.log(`Successfully deleted comment ID: ${createdCommentId}`);

				createdCommentId = null;
			} catch (error) {
				if (error instanceof Error) {
					console.error(`Error during cleanup of comment ${createdCommentId}:`, error.message);
				} else {
					console.error('Unknown error during comment cleanup');
				}
			}
		}
	});
	test.describe('Main Flow', () => {
		test('should allow user to mark notifications as reads', async () => {
			await test.step('1. User: Navigates to the "Profile -> Notifications" section.', async () => {
				// Navigate to notifications section
				await homePage.header.goToNotifications();
			});
			await test.step('2. System: Displays a list of notifications.', async () => {
				await notificationPage.expectToBeOnNotificationsPage();
				notificationCount = await notificationPage.getNotificationCount();
			});
			await test.step('3. User: Scrolls through the list to view individual notifications.', async () => {
				await notificationPage.scrollToLastComment();
			});
			await test.step('4. User: Clicks the "Mark as Read" button to confirm their selection.', async () => {
				await notificationPage.clickFirstMarkAsReadButton();
			});
			await test.step('5. System: hide notification after it is marked as read.', async () => {
				await notificationPage.expectToBeOnNotificationsPage();
			});
			await test.step('Result.', async () => {
				await notificationPage.expectNotificationCountToBeLessThan(notificationCount);
			});
		});
	});
});
