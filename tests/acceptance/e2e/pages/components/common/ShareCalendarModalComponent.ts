/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Gianfranco Cedro
 */

import { expect, Locator, Page } from '@playwright/test';
import { ExternalDomainWarningModal } from './ExternalDomainShareCalendarModalComponent';

export class ShareCalendarModalComponent {
	readonly container: Locator;
	readonly title: Locator;
	readonly outlookCalendarLink: Locator;
	readonly appleCalendarLink: Locator;
	readonly googleCalendarLink: Locator;
	public externalDomainWarningModal: ExternalDomainWarningModal;

	constructor(page: Page) {
		this.container = page.locator('div.calendar-modal');
		this.title = page.locator('#dialog-title-calendarShare');
		this.outlookCalendarLink = page.locator('a:text("Add to Outlook calendar")');
		this.appleCalendarLink = page.locator('a:text("Add to Apple calendar")');
		this.googleCalendarLink = page.locator('a[data-external-link="text-only"]:text("Add to Google calendar")');
		this.externalDomainWarningModal = new ExternalDomainWarningModal(page);
	}

	async expectContainerVisible() {
		await expect(this.container).toBeVisible();
	}

	async expectTitleVisible() {
		await expect(this.title).toBeVisible();
	}

	async expectOutlookCalendarLinkVisible() {
		await expect(this.outlookCalendarLink).toBeVisible();
	}

	async expectAppleCalendarLinkVisible() {
		await expect(this.appleCalendarLink).toBeVisible();
	}

	async expectGoogleCalendarLinkVisible() {
		await expect(this.googleCalendarLink).toBeVisible();
	}

	async clickOutlookCalendarLink() {
		await this.outlookCalendarLink.click();
	}

	async clickAppleCalendarLink() {
		await this.appleCalendarLink.click();
	}

	async clickGoogleCalendarLink() {
		await this.googleCalendarLink.click();
	}
}
