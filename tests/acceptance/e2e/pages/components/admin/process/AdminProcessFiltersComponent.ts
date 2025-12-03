/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Gianfranco Cedro
 */

import { Page } from '@playwright/test';

/**
 * Component for filters and search in the admin processes section.
 * Manages dropdown filters and the search field.
 */
export class AdminProcessFiltersComponent {
	constructor(private page: Page) {}

	// Main selectors
	private get filtersSection() {
		return this.page.locator('.filters__section');
	}

	private get filterDropdown() {
		return this.filtersSection.locator('.dropdown.menu');
	}

	private get filterButton() {
		return this.filterDropdown.locator('a.dropdown.button');
	}

	private get filterSubmenu() {
		return this.filterDropdown.locator('.submenu.is-dropdown-submenu');
	}

	// Selectors for the search field
	private get searchSection() {
		return this.filtersSection.locator('.fcell.search');
	}

	private get searchForm() {
		return this.searchSection.locator('form');
	}

	private get searchInput() {
		return this.searchForm.locator('input[name="q[title_cont]"]');
	}

	private get searchButton() {
		return this.searchForm.locator('button[type="submit"]');
	}

	// Selectors for specific filters
	private get privateSpaceFilter() {
		return this.filterSubmenu.locator('a').filter({ hasText: 'Privato' }).first();
	}

	private get publicSpaceFilter() {
		return this.filterSubmenu.locator('a').filter({ hasText: 'Pubblico' });
	}

	private get publishedFilter() {
		return this.filterSubmenu.locator('a').filter({ hasText: 'Pubblicato' });
	}

	private get unpublishedFilter() {
		return this.filterSubmenu.locator('a').filter({ hasText: 'Non pubblicato' });
	}

	// Selectors for applied filter tags
	private get appliedFiltersSection() {
		return this.page.locator('[data-applied-filters-tags]');
	}

	// Verification methods
	async isFiltersSectionVisible(): Promise<boolean> {
		return await this.filtersSection.isVisible();
	}

	async isFilterDropdownVisible(): Promise<boolean> {
		return await this.filterDropdown.isVisible();
	}

	async isSearchSectionVisible(): Promise<boolean> {
		return await this.searchSection.isVisible();
	}

	async isSearchInputVisible(): Promise<boolean> {
		return await this.searchInput.isVisible();
	}

	async isSearchButtonVisible(): Promise<boolean> {
		return await this.searchButton.isVisible();
	}

	// Methods for the search field
	async getSearchPlaceholder(): Promise<string> {
		return (await this.searchInput.getAttribute('placeholder')) || '';
	}

	async getSearchValue(): Promise<string> {
		return await this.searchInput.inputValue();
	}

	async fillSearchField(searchTerm: string): Promise<void> {
		await this.searchInput.fill(searchTerm);
	}

	async clearSearchField(): Promise<void> {
		await this.searchInput.clear();
	}

	async submitSearch(): Promise<void> {
		await this.searchButton.click();
	}

	async searchFor(searchTerm: string): Promise<void> {
		await this.fillSearchField(searchTerm);
		await this.submitSearch();
	}

	// Methods for dropdown filters
	async getFilterButtonText(): Promise<string> {
		return (await this.filterButton.textContent()) || '';
	}

	async openFilterDropdown(): Promise<void> {
		await this.filterButton.click();
	}

	async closeFilterDropdown(): Promise<void> {
		// Click outside to close
		await this.searchInput.click();
	}

	async isFilterDropdownOpen(): Promise<boolean> {
		return await this.filterSubmenu.isVisible();
	}

	// Methods to apply specific filters
	async filterByPrivateSpace(): Promise<void> {
		await this.openFilterDropdown();
		await this.privateSpaceFilter.click();
	}

	async filterByPublicSpace(): Promise<void> {
		await this.openFilterDropdown();
		await this.publicSpaceFilter.click();
	}

	async filterByPublished(): Promise<void> {
		await this.openFilterDropdown();
		await this.publishedFilter.click();
	}

	async filterByUnpublished(): Promise<void> {
		await this.openFilterDropdown();
		await this.unpublishedFilter.click();
	}

	// Methods to get filter information
	async getAvailableFilters(): Promise<string[]> {
		await this.openFilterDropdown();
		const filterItems = await this.filterSubmenu.locator('a').all();
		const filterTexts: string[] = [];

		for (const item of filterItems) {
			const text = await item.textContent();
			if (text) {
				filterTexts.push(text.trim());
			}
		}

		await this.closeFilterDropdown();
		return filterTexts;
	}

	// Methods for applied filters
	async hasAppliedFilters(): Promise<boolean> {
		const tags = await this.appliedFiltersSection.locator('[data-filter-tag]').count();
		return tags > 0;
	}

	async getAppliedFilters(): Promise<string[]> {
		const tags = await this.appliedFiltersSection.locator('[data-filter-tag]').all();
		const filterTexts: string[] = [];

		for (const tag of tags) {
			const text = await tag.textContent();
			if (text) {
				filterTexts.push(text.trim());
			}
		}

		return filterTexts;
	}

	async clearAllFilters(): Promise<void> {
		const clearButtons = await this.appliedFiltersSection.locator('[data-clear-filter]').all();
		for (const button of clearButtons) {
			await button.click();
		}
	}

	// Methods to check the search form
	async getSearchFormAction(): Promise<string> {
		return (await this.searchForm.getAttribute('action')) || '';
	}

	async getSearchFormMethod(): Promise<string> {
		return (await this.searchForm.getAttribute('method')) || '';
	}

	// Check if the component is fully loaded
	async isComponentFullyLoaded(): Promise<boolean> {
		const filtersVisible = await this.isFiltersSectionVisible();
		const dropdownVisible = await this.isFilterDropdownVisible();
		const searchVisible = await this.isSearchSectionVisible();
		const inputVisible = await this.isSearchInputVisible();
		const buttonVisible = await this.isSearchButtonVisible();

		return filtersVisible && dropdownVisible && searchVisible && inputVisible && buttonVisible;
	}
}
