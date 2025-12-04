/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Denis Vasilev Dimchev
 */

import { Locator, Page } from '@playwright/test';

/**
 * Component representing the sticky action buttons on the Moderation Reports page
 */
export class ModerationReportsActionsComponent {
	readonly page: Page;
	readonly actionsContainer: Locator;
	readonly unreportButton: Locator;
	readonly hideButton: Locator;

	constructor(page: Page) {
		this.page = page;
		this.actionsContainer = page.locator('.sticky');
		this.unreportButton = this.actionsContainer.locator('input[value="Unreport"]');
		this.hideButton = this.actionsContainer.locator('input[value="Hide"]');
	}

	/**
	 * Click the Unreport button
	 */
	async clickUnreport(): Promise<void> {
		await this.unreportButton.click();
	}

	/**
	 * Click the Hide button
	 */
	async clickHide(): Promise<void> {
		await this.hideButton.click();
	}

	/**
	 * Verify the actions container is visible
	 */
	async isVisible(): Promise<boolean> {
		return await this.actionsContainer.isVisible();
	}

	/**
	 * Check if Unreport button is enabled
	 */
	async isUnreportEnabled(): Promise<boolean> {
		return await this.unreportButton.isEnabled();
	}

	/**
	 * Check if Hide button is enabled
	 */
	async isHideEnabled(): Promise<boolean> {
		return await this.hideButton.isEnabled();
	}

	/**
	 * Check if Unreport button is visible
	 */
	async isUnreportVisible(): Promise<boolean> {
		return await this.unreportButton.isVisible();
	}

	/**
	 * Check if Hide button is visible
	 */
	async isHideVisible(): Promise<boolean> {
		return await this.hideButton.isVisible();
	}

	/**
	 * Get the Unreport button value/text
	 */
	async getUnreportButtonText(): Promise<string> {
		return (await this.unreportButton.getAttribute('value')) || '';
	}

	/**
	 * Get the Hide button value/text
	 */
	async getHideButtonText(): Promise<string> {
		return (await this.hideButton.getAttribute('value')) || '';
	}

	/**
	 * Check if actions container has sticky positioning
	 */
	async hasStickyStyling(): Promise<boolean> {
		const classes = (await this.actionsContainer.getAttribute('class')) || '';
		return classes.includes('sticky');
	}

	/**
	 * Wait for actions to be ready
	 */
	async waitForActionsReady(): Promise<void> {
		await this.actionsContainer.waitFor({ state: 'visible' });
		await this.unreportButton.waitFor({ state: 'visible' });
		await this.hideButton.waitFor({ state: 'visible' });
	}
}
