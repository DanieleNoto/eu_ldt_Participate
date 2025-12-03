/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Denis Vasilev Dimchev
 */

import { Locator, Page } from '@playwright/test';

/**
 * Component representing the warning flash message on the Moderation Reports page
 */
export class ModerationReportsWarningComponent {
	readonly page: Page;
	readonly warningContainer: Locator;
	readonly warningText: Locator;

	constructor(page: Page) {
		this.page = page;
		this.warningContainer = page.locator('.flash.warning');
		this.warningText = this.warningContainer.locator('span');
	}

	/**
	 * Get the warning message text
	 */
	async getWarningText(): Promise<string> {
		return (await this.warningText.textContent()) || '';
	}

	/**
	 * Verify the warning is visible
	 */
	async isVisible(): Promise<boolean> {
		return await this.warningContainer.isVisible();
	}

	/**
	 * Verify the warning contains expected text
	 */
	async hasWarningText(expectedText: string): Promise<boolean> {
		const warningText = await this.getWarningText();
		return warningText.includes(expectedText);
	}

	/**
	 * Check if warning has correct styling
	 */
	async hasWarningClass(): Promise<boolean> {
		const classes = (await this.warningContainer.getAttribute('class')) || '';
		return classes.includes('warning');
	}
}
