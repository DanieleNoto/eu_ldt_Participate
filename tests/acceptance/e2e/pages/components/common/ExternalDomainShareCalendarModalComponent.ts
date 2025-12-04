/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Denise Scarcelli
 * Gianfranco Cedro
 */

import { Locator, Page, expect } from '@playwright/test';

export class ExternalDomainWarningModal {
	readonly container: Locator;
	readonly closeButton: Locator;
	readonly title: Locator;
	readonly description: Locator;
	readonly externalLink: Locator;
	readonly cancelButton: Locator;
	readonly proceedButton: Locator;
	page: Page;

	constructor(page: Page) {
		this.page = page;
		this.container = page.locator('#external-domain-warning-content');
		this.closeButton = page.locator('[data-dialog-close="external-domain-warning"]');
		this.title = page.locator('#dialog-title-external-domain-warning');
		this.description = page.locator('#dialog-desc-external-domain-warning');
		this.externalLink = page.locator('code .text-alert');
		this.cancelButton = page.locator('[data-dialog-close="external-domain-warning"]:text("Cancel")');
		this.proceedButton = page.locator('a[href^="https://calendar.google.com"]:text("Proceed")');
	}

	async expectContainerVisible() {
		await expect(this.container).toBeVisible();
	}

	async expectTitleVisible() {
		await expect(this.title).toBeVisible();
	}

	async expectDescriptionVisible() {
		await expect(this.description).toBeVisible();
	}

	async expectExternalLinkVisible() {
		await expect(this.externalLink).toBeVisible();
	}

	async expectCancelButtonVisible() {
		await expect(this.cancelButton).toBeVisible();
	}

	async expectProceedButtonVisible() {
		await expect(this.proceedButton).toBeVisible();
	}

	async clickCloseButton() {
		await this.closeButton.click();
	}

	async clickCancelButton() {
		await this.cancelButton.click();
	}

	async clickProceedButton() {
		await this.proceedButton.click();
	}

	/**
	 * Verify that after clicking proceed, a new tab opens
	 * and its URL contains "google" and "calendar".
	 * @returns true if conditions are met, false otherwise
	 */
	async verifyCalendarRedirect(): Promise<boolean> {
		try {
			// Wait for the new page (tab) to open
			const newPage = await this.page.context().waitForEvent('page');

			// Wait until the new page is fully loaded
			await newPage.waitForLoadState('domcontentloaded');

			const url = newPage.url();
			console.log('Redirected to URL:', url);

			const containsGoogle = url.includes('google');
			const containsCalendar = url.includes('calendar');

			if (!containsGoogle || !containsCalendar) {
				console.warn('Redirect URL does not contain expected keywords.');
			}

			return containsGoogle && containsCalendar;
		} catch (error) {
			console.warn('Calendar redirect verification failed:', error);
			return false;
		}
	}
}
