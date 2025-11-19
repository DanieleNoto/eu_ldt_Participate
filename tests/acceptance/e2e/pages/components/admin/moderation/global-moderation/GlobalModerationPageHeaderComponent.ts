/* SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Denis Vasilev Dimchev
 * Simone Bianchelli
 */

import { Locator, Page } from '@playwright/test';

/**
 * Component for handling the page header on the Global Moderation admin page
 * Based on the HTML structure: .item_show__header with title and filter options
 */
export class GlobalModerationPageHeaderComponent {
	private readonly page: Page;

	// Selectors based on the provided HTML structure
	private readonly headerContainer = '.item_show__header';
	private readonly headerTitle = '.item_show__header-title';
	private readonly cardFilter = '.card__filter';
	private readonly notHiddenFilter = '.card__filter a[href="/admin/moderations"]:has-text("Not hidden")';
	private readonly hiddenFilter = '.card__filter a[href="/admin/moderations?hidden=true"]:has-text("Hidden")';
	private readonly filterSeparator = '.card__filter .text-gray-500';

	constructor(page: Page) {
		this.page = page;
	}

	/**
	 * Get the header container element
	 */
	getHeaderContainer(): Locator {
		return this.page.locator(this.headerContainer);
	}

	/**
	 * Get the page title element
	 */
	getHeaderTitle(): Locator {
		return this.page.locator(this.headerTitle);
	}

	/**
	 * Get the card filter container
	 */
	getCardFilter(): Locator {
		return this.page.locator(this.cardFilter);
	}

	/**
	 * Get the "Not hidden" filter link
	 */
	getNotHiddenFilter(): Locator {
		return this.page.locator(this.notHiddenFilter);
	}

	/**
	 * Get the "Hidden" filter link
	 */
	getHiddenFilter(): Locator {
		return this.page.locator(this.hiddenFilter);
	}

	/**
	 * Get the filter separator element
	 */
	getFilterSeparator(): Locator {
		return this.page.locator(this.filterSeparator);
	}

	/**
	 * Check if header is visible
	 */
	async isVisible(): Promise<boolean> {
		return await this.getHeaderContainer().isVisible();
	}

	/**
	 * Check if title is visible
	 */
	async isTitleVisible(): Promise<boolean> {
		return await this.getHeaderTitle().isVisible();
	}

	/**
	 * Check if filter section is visible
	 */
	async isFilterSectionVisible(): Promise<boolean> {
		return await this.getCardFilter().isVisible();
	}

	/**
	 * Get the page title text
	 */
	async getPageTitle(): Promise<string> {
		const title = await this.getHeaderTitle().textContent();
		return title ? title.trim() : '';
	}

	/**
	 * Get the "Not hidden" filter text
	 */
	async getNotHiddenFilterText(): Promise<string> {
		const text = await this.getNotHiddenFilter().textContent();
		return text ? text.trim() : '';
	}

	/**
	 * Get the "Hidden" filter text
	 */
	async getHiddenFilterText(): Promise<string> {
		const text = await this.getHiddenFilter().textContent();
		return text ? text.trim() : '';
	}

	/**
	 * Click on "Not hidden" filter
	 */
	async clickNotHiddenFilter(): Promise<void> {
		await this.getNotHiddenFilter().click();
	}

	/**
	 * Click on "Hidden" filter
	 */
	async clickHiddenFilter(): Promise<void> {
		await this.getHiddenFilter().click();
	}

	/**
	 * Check if "Not hidden" filter is active
	 */
	async isNotHiddenFilterActive(): Promise<boolean> {
		const classes = await this.getNotHiddenFilter().getAttribute('class');
		return classes ? classes.includes('active') || classes.includes('is-active') : false;
	}

	/**
	 * Check if "Hidden" filter is active
	 */
	async isHiddenFilterActive(): Promise<boolean> {
		const classes = await this.getHiddenFilter().getAttribute('class');
		return classes ? classes.includes('active') || classes.includes('is-active') : false;
	}

	/**
	 * Get the currently active filter
	 */
	async getActiveFilter(): Promise<string> {
		if (await this.isNotHiddenFilterActive()) {
			return 'Not hidden';
		} else if (await this.isHiddenFilterActive()) {
			return 'Hidden';
		}
		return '';
	}

	/**
	 * Verify the header structure matches expected pattern
	 */
	async verifyHeaderStructure(): Promise<boolean> {
		try {
			await this.getHeaderContainer().waitFor({ state: 'visible' });

			// Check that all expected elements are present
			const headerVisible = await this.getHeaderContainer().isVisible();
			const titleVisible = await this.getHeaderTitle().isVisible();
			const filterVisible = await this.getCardFilter().isVisible();
			const notHiddenVisible = await this.getNotHiddenFilter().isVisible();
			const hiddenVisible = await this.getHiddenFilter().isVisible();

			return headerVisible && titleVisible && filterVisible && notHiddenVisible && hiddenVisible;
		} catch {
			return false;
		}
	}

	/**
	 * Check if both filter options are clickable
	 */
	async verifyFiltersClickable(): Promise<boolean> {
		try {
			const notHiddenClickable = await this.getNotHiddenFilter().isEnabled();
			const hiddenClickable = await this.getHiddenFilter().isEnabled();

			return notHiddenClickable && hiddenClickable;
		} catch {
			return false;
		}
	}

	/**
	 * Get all filter options and their properties
	 */
	async getFilterOptions(): Promise<Array<{ text: string; href: string; active: boolean }>> {
		const filters = [
			{
				text: await this.getNotHiddenFilterText(),
				href: (await this.getNotHiddenFilter().getAttribute('href')) || '',
				active: await this.isNotHiddenFilterActive()
			},
			{
				text: await this.getHiddenFilterText(),
				href: (await this.getHiddenFilter().getAttribute('href')) || '',
				active: await this.isHiddenFilterActive()
			}
		];

		return filters;
	}

	/**
	 * Get accessibility attributes for screen readers
	 */
	async getAccessibilityInfo(): Promise<Record<string, string | null>> {
		const container = this.getHeaderContainer();

		return {
			ariaLabel: await container.getAttribute('aria-label'),
			role: await container.getAttribute('role'),
			ariaDescribedBy: await container.getAttribute('aria-describedby')
		};
	}

	/**
	 * Wait for header to load
	 */
	async waitForHeaderToLoad(): Promise<void> {
		await this.getHeaderContainer().waitFor({ state: 'visible' });
		await this.getHeaderTitle().waitFor({ state: 'visible' });
	}

	/**
	 * Check accessibility compliance
	 */
	async checkAccessibility(): Promise<void> {
		// Check if header has proper heading role
		const titleRole = await this.getHeaderTitle().getAttribute('role');
		if (!titleRole || !titleRole.includes('heading')) {
			console.warn('Header title should have heading role');
		}

		// Check if filter links have proper aria-current for active state
		if (await this.isNotHiddenFilterActive()) {
			const ariaCurrent = await this.getNotHiddenFilter().getAttribute('aria-current');
			if (!ariaCurrent) {
				console.warn('Active filter should have aria-current attribute');
			}
		}

		if (await this.isHiddenFilterActive()) {
			const ariaCurrent = await this.getHiddenFilter().getAttribute('aria-current');
			if (!ariaCurrent) {
				console.warn('Active filter should have aria-current attribute');
			}
		}
	}
}
