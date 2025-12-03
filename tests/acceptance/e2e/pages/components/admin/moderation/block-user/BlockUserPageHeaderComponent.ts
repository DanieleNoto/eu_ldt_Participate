/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Denis Vasilev Dimchev
 */

import { Locator, Page } from '@playwright/test';

/**
 * Component representing the page header on the Block User page
 */
export class BlockUserPageHeaderComponent {
	readonly page: Page;
	readonly headerContainer: Locator;
	readonly title: Locator;

	constructor(page: Page) {
		this.page = page;
		this.headerContainer = page.locator('.item_show__header');
		this.title = this.headerContainer.locator('h1.item_show__header-title');
	}

	/**
	 * Get the page title text
	 */
	async getTitleText(): Promise<string> {
		return (await this.title.textContent()) || '';
	}

	/**
	 * Verify the header is visible
	 */
	async isVisible(): Promise<boolean> {
		return await this.headerContainer.isVisible();
	}

	/**
	 * Verify the title is visible
	 */
	async isTitleVisible(): Promise<boolean> {
		return await this.title.isVisible();
	}

	/**
	 * Check if title contains expected user name
	 */
	async hasTitleWithUserName(userName: string): Promise<boolean> {
		const titleText = await this.getTitleText();
		return titleText.includes(`Block User ${userName}`);
	}

	/**
	 * Extract user name from title
	 */
	async getUserNameFromTitle(): Promise<string> {
		const titleText = await this.getTitleText();
		const match = titleText.match(/Block User (.+)/);
		return match ? match[1].trim() : '';
	}

	/**
	 * Verify title follows expected format
	 */
	async hasTitleFormat(): Promise<boolean> {
		const titleText = await this.getTitleText();
		return titleText.startsWith('Block User ');
	}
}
