/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Simone Bianchelli
 * Denis Vasilev Dimchev
 */

import { Locator, Page } from '@playwright/test';

/**
 * Component for the moderation page header with title and filter controls.
 * Contains the page title, filter buttons, and search functionality.
 */
export class ModerationPageHeaderComponent {
	private readonly page: Page;

	// Main header container
	private readonly itemShowHeader: Locator;
	private readonly headerTitle: Locator;

	// Filter section
	private readonly cardFilter: Locator;
	private readonly notHiddenLink: Locator;
	private readonly hiddenLink: Locator;

	// Filters section
	private readonly filtersSection: Locator;
	private readonly filterDropdown: Locator;
	private readonly filterDropdownButton: Locator;
	private readonly filterDropdownMenu: Locator;

	// Type filter submenu
	private readonly typeFilterSubmenu: Locator;
	private readonly commentTypeFilter: Locator;
	private readonly proposalTypeFilter: Locator;

	// Search section
	private readonly searchSection: Locator;
	private readonly searchInput: Locator;
	private readonly searchButton: Locator;

	constructor(page: Page) {
		this.page = page;

		// Main containers
		this.itemShowHeader = page.locator('.item_show__header');
		this.headerTitle = page.locator('.item_show__header-title');

		// Filter toggles
		this.cardFilter = page.locator('.card__filter');
		this.notHiddenLink = page.locator('.card__filter a[href*="/moderations"]:not([href*="hidden"])');
		this.hiddenLink = page.locator('.card__filter a[href*="hidden=true"]');

		// Filters section
		this.filtersSection = page.locator('.filters__section');
		this.filterDropdown = page.locator('.dropdown.menu[data-dropdown-menu]');
		this.filterDropdownButton = page.locator('.dropdown.button.button__sm.button__secondary');
		this.filterDropdownMenu = page.locator('.vertical.menu.submenu');

		// Type filter submenu
		this.typeFilterSubmenu = page.locator('.is-dropdown-submenu-parent:has-text("Type")');
		this.commentTypeFilter = page.locator(
			'a[href*="reportable_type_string_eq"][href*="Comment"]:has-text("Comment")'
		);
		this.proposalTypeFilter = page.locator(
			'a[href*="reportable_type_string_eq"][href*="Proposal"]:has-text("Proposal")'
		);

		// Search
		this.searchSection = page.locator('.fcell.search');
		this.searchInput = page.locator('input[name="q[reported_id_string_or_reported_content_cont]"]');
		this.searchButton = page.locator('button[type="submit"][aria-label="Search"]');
	}

	// Visibility checks
	async isHeaderVisible(): Promise<boolean> {
		return await this.itemShowHeader.isVisible();
	}

	async isFilterSectionVisible(): Promise<boolean> {
		return await this.filtersSection.isVisible();
	}

	async isSearchSectionVisible(): Promise<boolean> {
		return await this.searchSection.isVisible();
	}

	async isFilterDropdownVisible(): Promise<boolean> {
		return await this.filterDropdown.isVisible();
	}

	// Content getters
	async getPageTitle(): Promise<string> {
		const titleElement = this.headerTitle.locator('h1').first();
		return (await titleElement.textContent()) || '';
	}

	async getCurrentFilterState(): Promise<'not_hidden' | 'hidden'> {
		const currentUrl = this.page.url();
		return currentUrl.includes('hidden=true') ? 'hidden' : 'not_hidden';
	}

	// Filter actions
	async clickNotHiddenFilter(): Promise<void> {
		await this.notHiddenLink.click();
		await this.page.waitForLoadState('networkidle');
	}

	async clickHiddenFilter(): Promise<void> {
		await this.hiddenLink.click();
		await this.page.waitForLoadState('networkidle');
	}

	async openFilterDropdown(): Promise<void> {
		await this.filterDropdownButton.click();
		// Wait for dropdown to be visible
		await this.filterDropdownMenu.waitFor({ state: 'visible' });
	}

	async filterByType(type: 'comment' | 'proposal'): Promise<void> {
		await this.openFilterDropdown();

		// Hover over Type submenu to expand it
		await this.typeFilterSubmenu.hover();

		if (type === 'comment') {
			await this.commentTypeFilter.click();
		} else {
			await this.proposalTypeFilter.click();
		}

		await this.page.waitForLoadState('networkidle');
	}

	async filterByComment(): Promise<void> {
		await this.filterByType('comment');
	}

	async filterByProposal(): Promise<void> {
		await this.filterByType('proposal');
	}

	// Search actions
	async searchModerations(searchTerm: string): Promise<void> {
		await this.searchInput.fill(searchTerm);
		await this.searchButton.click();
		await this.page.waitForLoadState('networkidle');
	}

	async clearSearch(): Promise<void> {
		await this.searchInput.clear();
		await this.searchButton.click();
		await this.page.waitForLoadState('networkidle');
	}

	async getSearchValue(): Promise<string> {
		return await this.searchInput.inputValue();
	}

	// Filter state checks
	async isNotHiddenFilterActive(): Promise<boolean> {
		const currentState = await this.getCurrentFilterState();
		return currentState === 'not_hidden';
	}

	async isHiddenFilterActive(): Promise<boolean> {
		const currentState = await this.getCurrentFilterState();
		return currentState === 'hidden';
	}

	async hasActiveFilters(): Promise<boolean> {
		const currentUrl = this.page.url();
		return currentUrl.includes('q[') || currentUrl.includes('hidden=true');
	}

	async getActiveFilters(): Promise<string[]> {
		const currentUrl = this.page.url();
		const filters: string[] = [];

		if (currentUrl.includes('hidden=true')) {
			filters.push('hidden');
		}

		if (currentUrl.includes('reportable_type_string_eq')) {
			if (currentUrl.includes('Comment')) {
				filters.push('type:comment');
			}
			if (currentUrl.includes('Proposal')) {
				filters.push('type:proposal');
			}
		}

		if (currentUrl.includes('reported_id_string_or_reported_content_cont')) {
			filters.push('search');
		}

		return filters;
	}

	// Utility methods
	async getFilterText(): Promise<string> {
		return (await this.cardFilter.textContent()) || '';
	}

	async getAllFilterOptions(): Promise<string[]> {
		await this.openFilterDropdown();
		const options = await this.filterDropdownMenu.locator('a').allTextContents();
		return options.filter(text => text.trim().length > 0);
	}

	async getSearchPlaceholder(): Promise<string> {
		return (await this.searchInput.getAttribute('placeholder')) || '';
	}
}
