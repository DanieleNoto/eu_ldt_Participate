/** SPDX-License-Identifier: EUPL-1.2
 * Copyright (c) 2025, European Commission. Licensed under the EUPL-1.2
 * Authors:
 * Denise Scarcelli
 * Gianfranco Cedro
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
		return await this.notificationItems.count();
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
	 * Verify that all notification fields are visible
	 * @returns true if all fields are visible, false otherwise
	 */
	async verifyNotificationVisible(): Promise<boolean> {
		try {
			// Check wrapper visibility
			const wrapperVisible = await this.page.locator('.notification__wrapper').isVisible();

			// Check time field visibility
			const timeVisible = await this.page.locator('.notification__time').isVisible();

			// Check snippet visibility
			const snippetVisible = await this.page.locator('.notification__snippet').isVisible();

			// Check snippet title visibility
			const titleVisible = await this.page.locator('.notification__snippet-title').isVisible();

			// Return true only if all fields are visible
			return wrapperVisible && timeVisible && snippetVisible && titleVisible;
		} catch (error) {
			console.warn('Notification visibility check failed:', error);
			return false;
		}
	}
}
