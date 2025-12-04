/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Denise Scarcelli
 * Gianfranco Cedro
 */

import { HomePage } from '@pages/pages/public/HomePage';
import NotificationPage from '@pages/pages/user/NotificationPage';
import { test, expect } from '@fixtures/parallel-test';

/**
 * Test suite for Allows citizens to view notifications related to platform activities.
 *
 * User Story: 	As a Citizen, I want to view my notifications in the "Notifications" section so that I can stay informed about important platform updates and track activities.
 *
 * Requirements: PAR R13, PAR R14, PAR R8
 *
 * Prerequisites:
 *
 * - The citizen has an active account on the platform and is logged in.
 * - Notifications are enabled, and activities have generated notifications for the citizen
 *
 */

test.describe('[PAR-NOT001] – View notifications', () => {
	let notificationPage: NotificationPage;
	let homePage: HomePage;

	test.beforeEach(async ({ userPage }) => {
		notificationPage = new NotificationPage(userPage);
		homePage = new HomePage(userPage);
		await homePage.navigateToHomePage();
	});
	test.describe('Main Flow', () => {
		test('should allow user to view notifications', async () => {
			let isVisible: boolean;
			await test.step('1. User: Navigates to the "Profile -> Notifications" section.', async () => {
				// Navigate to notifications section
				await homePage.header.goToNotifications();
			});
			await test.step('2. System: Displays a list of notifications.', async () => {
				await notificationPage.expectToBeOnNotificationsPage();
			});
			await test.step('3. User: Scrolls through the list to view individual notifications.', async () => {
				await notificationPage.scrollToLastComment();
				isVisible = await notificationPage.verifyNotificationVisible();
			});
			await test.step('Result.', async () => {
				expect(isVisible).toBeTruthy();
			});
		});
	});
});
