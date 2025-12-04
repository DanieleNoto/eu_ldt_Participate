/* SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Denise Scarcelli
 * Gianfranco Cedro
 */

import { HomePage } from '@pages/pages/public/HomePage';
import NotificationPage from '@pages/pages/user/NotificationPage';
import { test } from '@fixtures/parallel-test';

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

test.describe('[PAR-NOT004] – Mark notifications as reads', () => {
	let notificationCount = -1;
	let notificationPage: NotificationPage;
	let homePage: HomePage;

	test.beforeEach(async ({ userPage }) => {
		notificationPage = new NotificationPage(userPage);
		homePage = new HomePage(userPage);
		await homePage.navigateToHomePage();
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
