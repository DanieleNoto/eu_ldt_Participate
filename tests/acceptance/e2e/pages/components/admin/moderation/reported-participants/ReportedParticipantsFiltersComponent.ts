/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Denis Vasilev Dimchev
 */

import { Locator, Page } from '@playwright/test';

/**
 * Component representing the filters section on the Reported Participants page
 */
export class ReportedParticipantsFiltersComponent {
	readonly page: Page;
	readonly filtersContainer: Locator;
	readonly filterDropdown: Locator;
	readonly filterDropdownButton: Locator;
	readonly reportReasonSubmenu: Locator;
	readonly spamFilter: Locator;
	readonly offensiveFilter: Locator;
	readonly doesNotBelongFilter: Locator;
	readonly searchContainer: Locator;
	readonly searchInput: Locator;
	readonly searchButton: Locator;
	readonly appliedFiltersContainer: Locator;

	constructor(page: Page) {
		this.page = page;
		this.filtersContainer = page.locator('.filters__section');
		this.filterDropdown = this.filtersContainer.locator('.dropdown.menu');
		this.filterDropdownButton = this.filterDropdown.locator('a.dropdown.button').filter({ hasText: 'Filter' });
		this.reportReasonSubmenu = page.locator('.submenu.is-dropdown-submenu');
		this.spamFilter = page.locator('a[href*="reports_reason_eq"][href*="spam"]');
		this.offensiveFilter = page.locator('a[href*="reports_reason_eq"][href*="offensive"]');
		this.doesNotBelongFilter = page.locator('a[href*="reports_reason_eq"][href*="does_not_belong"]');
		this.searchContainer = this.filtersContainer.locator('.fcell.search');
		this.searchInput = this.searchContainer.locator('input[placeholder*="Search User moderation"]');
		this.searchButton = this.searchContainer.locator('button[type="submit"]');
		this.appliedFiltersContainer = page.locator('[data-applied-filters-tags]');
	}

	/**
	 * Click the filter dropdown button
	 */
	async clickFilterDropdown(): Promise<void> {
		await this.filterDropdownButton.click();
	}

	/**
	 * Click the spam filter option
	 */
	async clickSpamFilter(): Promise<void> {
		await this.spamFilter.click();
	}

	/**
	 * Click the offensive filter option
	 */
	async clickOffensiveFilter(): Promise<void> {
		await this.offensiveFilter.click();
	}

	/**
	 * Click the "does not belong" filter option
	 */
	async clickDoesNotBelongFilter(): Promise<void> {
		await this.doesNotBelongFilter.click();
	}

	/**
	 * Enter search term and submit search
	 */
	async searchParticipant(searchTerm: string): Promise<void> {
		await this.searchInput.fill(searchTerm);
		await this.searchButton.click();
	}

	/**
	 * Clear the search input
	 */
	async clearSearch(): Promise<void> {
		await this.searchInput.clear();
	}

	/**
	 * Get the current search input value
	 */
	async getSearchInputValue(): Promise<string> {
		return (await this.searchInput.inputValue()) || '';
	}

	/**
	 * Verify the filters section is visible
	 */
	async isVisible(): Promise<boolean> {
		return await this.filtersContainer.isVisible();
	}

	/**
	 * Check if filter dropdown is visible
	 */
	async isFilterDropdownVisible(): Promise<boolean> {
		return await this.filterDropdownButton.isVisible();
	}

	/**
	 * Check if search input is visible
	 */
	async isSearchInputVisible(): Promise<boolean> {
		return await this.searchInput.isVisible();
	}

	/**
	 * Check if search button is visible
	 */
	async isSearchButtonVisible(): Promise<boolean> {
		return await this.searchButton.isVisible();
	}

	/**
	 * Get the search input placeholder text
	 */
	async getSearchPlaceholder(): Promise<string> {
		return (await this.searchInput.getAttribute('placeholder')) || '';
	}

	/**
	 * Check if the filter dropdown is expanded
	 */
	async isFilterDropdownExpanded(): Promise<boolean> {
		const ariaExpanded = await this.filterDropdownButton.getAttribute('aria-expanded');
		return ariaExpanded === 'true';
	}

	/**
	 * Check if report reason filters are visible
	 */
	async areReportReasonFiltersVisible(): Promise<boolean> {
		const spamVisible = await this.spamFilter.isVisible();
		const offensiveVisible = await this.offensiveFilter.isVisible();
		const doesNotBelongVisible = await this.doesNotBelongFilter.isVisible();
		return spamVisible && offensiveVisible && doesNotBelongVisible;
	}

	/**
	 * Get all available report reason filter options
	 */
	async getReportReasonFilterOptions(): Promise<string[]> {
		const options: string[] = [];

		if (await this.spamFilter.isVisible()) {
			options.push((await this.spamFilter.textContent()) || '');
		}
		if (await this.offensiveFilter.isVisible()) {
			options.push((await this.offensiveFilter.textContent()) || '');
		}
		if (await this.doesNotBelongFilter.isVisible()) {
			options.push((await this.doesNotBelongFilter.textContent()) || '');
		}

		return options.filter(option => option.trim().length > 0);
	}

	/**
	 * Check if any filters are currently applied
	 */
	async hasAppliedFilters(): Promise<boolean> {
		const appliedFiltersText = (await this.appliedFiltersContainer.textContent()) || '';
		return appliedFiltersText.trim().length > 0;
	}

	/**
	 * Open the filter dropdown and access report reason submenu
	 */
	async openReportReasonFilters(): Promise<void> {
		if (!(await this.isFilterDropdownExpanded())) {
			await this.clickFilterDropdown();
		}

		// Wait for submenu to be visible
		await this.reportReasonSubmenu.waitFor({ state: 'visible' });
	}

	/**
	 * Verify all filter components are functional
	 */
	async hasAllFilterComponents(): Promise<boolean> {
		const dropdownVisible = await this.isFilterDropdownVisible();
		const searchInputVisible = await this.isSearchInputVisible();
		const searchButtonVisible = await this.isSearchButtonVisible();

		return dropdownVisible && searchInputVisible && searchButtonVisible;
	}

	/**
	 * Get filter URLs for report reasons
	 */
	async getReportReasonFilterUrls(): Promise<{
		spam: string;
		offensive: string;
		doesNotBelong: string;
	}> {
		return {
			spam: (await this.spamFilter.getAttribute('href')) || '',
			offensive: (await this.offensiveFilter.getAttribute('href')) || '',
			doesNotBelong: (await this.doesNotBelongFilter.getAttribute('href')) || ''
		};
	}
}
