/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Denis Vasilev Dimchev
 */

import { Locator, Page } from '@playwright/test';

/**
 * Component representing the page header on the Reported Participants page
 */
export class ReportedParticipantsPageHeaderComponent {
	readonly page: Page;
	readonly headerContainer: Locator;
	readonly title: Locator;
	readonly filterSection: Locator;
	readonly notBlockedFilter: Locator;
	readonly blockedFilter: Locator;

	constructor(page: Page) {
		this.page = page;
		this.headerContainer = page.locator('.item_show__header');
		this.title = this.headerContainer.locator('h1.item_show__header-title');
		this.filterSection = this.headerContainer.locator('.card__filter');
		this.notBlockedFilter = this.filterSection.locator('a').filter({ hasText: 'Not Blocked' });
		this.blockedFilter = this.filterSection.locator('a').filter({ hasText: 'Blocked' });
	}

	/**
	 * Get the page title text
	 */
	async getTitleText(): Promise<string> {
		const titleElement = this.title.locator('text=Reported participants').first();
		return (await titleElement.textContent()) || '';
	}

	/**
	 * Click the "Not Blocked" filter
	 */
	async clickNotBlockedFilter(): Promise<void> {
		await this.notBlockedFilter.click();
	}

	/**
	 * Click the "Blocked" filter
	 */
	async clickBlockedFilter(): Promise<void> {
		await this.blockedFilter.click();
	}

	/**
	 * Verify the header is visible
	 */
	async isVisible(): Promise<boolean> {
		return await this.headerContainer.isVisible();
	}

	/**
	 * Verify the title is correct
	 */
	async hasTitleText(expectedTitle: string): Promise<boolean> {
		const titleText = await this.getTitleText();
		return titleText.includes(expectedTitle);
	}

	/**
	 * Check if filter section is visible
	 */
	async isFilterSectionVisible(): Promise<boolean> {
		return await this.filterSection.isVisible();
	}

	/**
	 * Check if "Not Blocked" filter is visible
	 */
	async isNotBlockedFilterVisible(): Promise<boolean> {
		return await this.notBlockedFilter.isVisible();
	}

	/**
	 * Check if "Blocked" filter is visible
	 */
	async isBlockedFilterVisible(): Promise<boolean> {
		return await this.blockedFilter.isVisible();
	}

	/**
	 * Get the URL of the "Not Blocked" filter
	 */
	async getNotBlockedFilterUrl(): Promise<string> {
		return (await this.notBlockedFilter.getAttribute('href')) || '';
	}

	/**
	 * Get the URL of the "Blocked" filter
	 */
	async getBlockedFilterUrl(): Promise<string> {
		return (await this.blockedFilter.getAttribute('href')) || '';
	}

	/**
	 * Check if we're currently on the "Not Blocked" filter page
	 */
	async isNotBlockedFilterActive(): Promise<boolean> {
		const currentUrl = this.page.url();
		const notBlockedUrl = await this.getNotBlockedFilterUrl();
		return currentUrl.includes(notBlockedUrl) || !currentUrl.includes('blocked=true');
	}

	/**
	 * Check if we're currently on the "Blocked" filter page
	 */
	async isBlockedFilterActive(): Promise<boolean> {
		const currentUrl = this.page.url();
		return currentUrl.includes('blocked=true');
	}

	/**
	 * Get filter section text
	 */
	async getFilterSectionText(): Promise<string> {
		return (await this.filterSection.textContent()) || '';
	}

	/**
	 * Verify all header components are present
	 */
	async hasAllHeaderComponents(): Promise<boolean> {
		const titleVisible = await this.title.isVisible();
		const filterSectionVisible = await this.isFilterSectionVisible();
		const notBlockedVisible = await this.isNotBlockedFilterVisible();
		const blockedVisible = await this.isBlockedFilterVisible();

		return titleVisible && filterSectionVisible && notBlockedVisible && blockedVisible;
	}
}
