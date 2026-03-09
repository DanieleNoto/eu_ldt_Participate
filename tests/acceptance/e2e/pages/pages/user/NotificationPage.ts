/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Simone Bianchelli
 * Denise Scarcelli
 * Gianfranco Cedro
 * Antonio Abramo Carotenuto
 */

import { AuthenticatedPage } from '@pages/base/AuthenticatedPage';
import { expect, Page } from '@playwright/test';

export default class NotificationPage extends AuthenticatedPage {
	private readonly notificationsSection = this.page.locator('#notifications');
	private readonly lastComment = this.page.locator('.notification').last();
	private readonly notificationItems = this.page.locator('.notification');
	private readonly markAsReadButtons = this.page.locator('.notification__button[data-notification-read]');

	constructor(page: Page) {
		super(page);
	}

	async expectToBeOnNotificationsPage(): Promise<void> {
		await expect(this.notificationsSection).toBeVisible();
	}

	async scrollToLastComment(): Promise<void> {
		await this.lastComment.scrollIntoViewIfNeeded();
	}

	/**
	 * Clicks the first available 'Mark as read' button in the notifications list.
	 */
	async clickFirstMarkAsReadButton(): Promise<void> {
		const count = await this.markAsReadButtons.count();
		if (count > 0) {
			await this.markAsReadButtons.first().click();
		}
	}

	/**
	 * Returns the current number of notifications.
	 */
	async getNotificationCount(): Promise<number> {
		let last = -1;
		await expect
			.poll(
				async () => {
					const c = await this.notificationItems.count();
					const isStable = c === last;
					last = c;
					return isStable;
				},
				{ timeout: 6000, intervals: [2000] }
			)
			.toBeTruthy();
		const count = last;
		return count;
	}

	/**
	 * Expects the notification count to be equal to the provided value.
	 */
	async expectNotificationCountToBe(expected: number): Promise<void> {
		await expect(this.notificationItems).toHaveCount(expected);
	}

	/**
	 * Expects the notification count to be less than the provided value.
	 */
	async expectNotificationCountToBeLessThan(previous: number): Promise<void> {
		await this.page.waitForLoadState('load');
		const current = await this.getNotificationCount();
		expect(current).toBeLessThan(previous);
	}

	async isTextPresentInNotifications(text: string): Promise<boolean> {
		const notifications = this.notificationsSection;
		const count = await notifications.count();
		for (let i = 0; i < count; i++) {
			const content = await notifications.nth(i).textContent();
			if (content?.includes(text)) return true;
		}
		return false;
	}

	/**
	 * Verify notification contains expected message and comment text
	 * @param expectedMessage The expected notification message
	 * @param commentText The original comment text to verify
	 */
	async verifyNotificationWithCommentText(expectedMessage: string, commentText: string): Promise<void> {
		console.log(`Verifying notification with comment text: "${commentText}"`);
		console.log(`And expected message: "${expectedMessage}"`);

		// Search by comment text first (more specific), then filter by message
		// This prevents issues when multiple notifications have the same message
		const notificationSnippet = this.page
			.locator('.notification__snippet')
			.filter({ hasText: commentText })
			.filter({ hasText: expectedMessage })
			.first();

		// Assert that the specific notification is visible
		await expect(notificationSnippet).toBeVisible();

		console.log(`Notification verified successfully`);
	}

	/**
	 * Verify that all notification fields are visible
	 */
	async verifyNotificationVisible() {
		// Check wrappers visibility
		const wrappers = this.page.locator('.notification__wrapper');
		for (const wrapper of await wrappers.all()) await expect(wrapper).toBeVisible();

		// Check time fields visibility
		const times = this.page.locator('.notification__time');
		for (const time of await times.all()) await expect(time).toBeVisible();

		// Check snippets visibility
		const snippets = this.page.locator('.notification__snippet');
		for (const snippet of await snippets.all()) await expect(snippet).toBeVisible();

		// Check snippet titles visibility
		const titles = this.page.locator('.notification__snippet-title');
		for (const title of await titles.all()) await expect(title).toBeVisible();
	}
}
