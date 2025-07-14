import { AuthenticatedPage } from '@pages/base/AuthenticatedPage';
import { expect, Page } from '@playwright/test';

export default class NotificationPage extends AuthenticatedPage {
	private readonly notificationsSection = this.page.locator('#notifications');
	private readonly lastComment = this.page.locator('.notification').last();

	constructor(page: Page) {
		super(page);
	}

	async expectToBeOnNotificationsPage(): Promise<void> {
		await expect(this.notificationsSection).toBeVisible();
	}

	async scrollToLastComment(): Promise<void> {
		await this.lastComment.scrollIntoViewIfNeeded();
	}
}
