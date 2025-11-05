/* SPDX-License-Identifier: EUPL-1.2
 * Copyright (c) 2025, European Commission. Licensed under the EUPL-1.2
 * Authors:
 * Denis Vasilev Dimchev
 * Simone Bianchelli
 */

import { Locator, Page } from '@playwright/test';

/**
 * Component for handling the filters section on the Global Moderation admin page
 * Based on the HTML structure: .filters__section with dropdown filters and search input
 */
export class GlobalModerationFiltersComponent {
	private readonly page: Page;

	// Selectors based on the provided HTML structure
	private readonly filtersSection = '.filters__section';
	private readonly filterDropdown = '.dropdown.menu[data-dropdown-menu]';
	private readonly filterButton = '.dropdown.button.button__sm.button__secondary:has-text("Filter")';
	private readonly filterSubmenu = '.is-dropdown-submenu';
	private readonly typeSubmenuItem = 'a[role="menuitem"][aria-label="Type"]';
	private readonly searchForm = '.search form';
	private readonly searchInput = '.search input[type="search"]';
	private readonly searchButton = '.search .button--sc';
	private readonly appliedFilters = '[data-applied-filters-tags]';
	private readonly appliedFilterTag = '.filter-container';

	constructor(page: Page) {
		this.page = page;
	}

	/**
	 * Get the filters section container
	 */
	getFiltersSection(): Locator {
		return this.page.locator(this.filtersSection);
	}

	/**
	 * Get the filter dropdown element
	 */
	getFilterDropdown(): Locator {
		return this.page.locator(this.filterDropdown);
	}

	/**
	 * Get the filter button
	 */
	getFilterButton(): Locator {
		return this.page.locator(this.filterButton);
	}

	/**
	 * Get the filter submenu
	 */
	getFilterSubmenu(): Locator {
		return this.page.locator(this.filterSubmenu);
	}

	/**
	 * Get the type submenu item
	 */
	getTypeSubmenuItem(): Locator {
		return this.page.locator(this.typeSubmenuItem);
	}

	/**
	 * Get the search form
	 */
	getSearchForm(): Locator {
		return this.page.locator(this.searchForm);
	}

	/**
	 * Get the search input field
	 */
	getSearchInput(): Locator {
		return this.page.locator(this.searchInput);
	}

	/**
	 * Get the search button
	 */
	getSearchButton(): Locator {
		return this.page.locator(this.searchButton);
	}

	/**
	 * Get the applied filters container
	 */
	getAppliedFilters(): Locator {
		return this.page.locator(this.appliedFilters);
	}

	/**
	 * Get all applied filter tags
	 */
	getAppliedFilterTags(): Locator {
		return this.page.locator(this.appliedFilterTag);
	}

	/**
	 * Check if filters section is visible
	 */
	async isVisible(): Promise<boolean> {
		return await this.getFiltersSection().isVisible();
	}

	/**
	 * Check if filter dropdown is visible
	 */
	async isFilterDropdownVisible(): Promise<boolean> {
		return await this.getFilterDropdown().isVisible();
	}

	/**
	 * Check if search form is visible
	 */
	async isSearchFormVisible(): Promise<boolean> {
		return await this.getSearchForm().isVisible();
	}

	/**
	 * Open the filter dropdown
	 */
	async openFilterDropdown(): Promise<void> {
		await this.getFilterButton().click();
	}

	/**
	 * Close the filter dropdown
	 */
	async closeFilterDropdown(): Promise<void> {
		// Click outside or press escape
		await this.page.keyboard.press('Escape');
	}

	/**
	 * Click on Type submenu item
	 */
	async clickTypeSubmenu(): Promise<void> {
		await this.openFilterDropdown();
		await this.getTypeSubmenuItem().click();
	}

	/**
	 * Enter search text
	 */
	async enterSearchText(text: string): Promise<void> {
		await this.getSearchInput().fill(text);
	}

	/**
	 * Clear search text
	 */
	async clearSearchText(): Promise<void> {
		await this.getSearchInput().clear();
	}

	/**
	 * Submit search
	 */
	async submitSearch(): Promise<void> {
		await this.getSearchButton().click();
	}

	/**
	 * Perform a search with text
	 */
	async performSearch(text: string): Promise<void> {
		await this.enterSearchText(text);
		await this.submitSearch();
	}

	/**
	 * Get current search text
	 */
	async getCurrentSearchText(): Promise<string> {
		const value = await this.getSearchInput().inputValue();
		return value || '';
	}

	/**
	 * Get search placeholder text
	 */
	async getSearchPlaceholder(): Promise<string> {
		const placeholder = await this.getSearchInput().getAttribute('placeholder');
		return placeholder || '';
	}

	/**
	 * Check if filter dropdown is open
	 */
	async isFilterDropdownOpen(): Promise<boolean> {
		const ariaExpanded = await this.getFilterButton().getAttribute('aria-expanded');
		return ariaExpanded === 'true';
	}

	/**
	 * Get count of applied filters
	 */
	async getAppliedFiltersCount(): Promise<number> {
		return await this.getAppliedFilterTags().count();
	}

	/**
	 * Get all applied filter texts
	 */
	async getAppliedFiltersTexts(): Promise<string[]> {
		const tags = this.getAppliedFilterTags();
		const count = await tags.count();
		const texts: string[] = [];

		for (let i = 0; i < count; i++) {
			const text = await tags.nth(i).textContent();
			if (text && text.trim()) {
				texts.push(text.trim());
			}
		}

		return texts;
	}

	/**
	 * Remove applied filter by index
	 */
	async removeAppliedFilter(index: number): Promise<void> {
		const tags = this.getAppliedFilterTags();
		const removeButton = tags.nth(index).locator('.delete');
		await removeButton.click();
	}

	/**
	 * Remove all applied filters
	 */
	async removeAllAppliedFilters(): Promise<void> {
		const count = await this.getAppliedFiltersCount();
		for (let i = count - 1; i >= 0; i--) {
			await this.removeAppliedFilter(i);
		}
	}

	/**
	 * Check if search input is enabled
	 */
	async isSearchInputEnabled(): Promise<boolean> {
		return await this.getSearchInput().isEnabled();
	}

	/**
	 * Check if search button is enabled
	 */
	async isSearchButtonEnabled(): Promise<boolean> {
		return await this.getSearchButton().isEnabled();
	}

	/**
	 * Verify filters structure matches expected pattern
	 */
	async verifyFiltersStructure(): Promise<boolean> {
		try {
			await this.getFiltersSection().waitFor({ state: 'visible' });

			// Check that all expected elements are present
			const sectionVisible = await this.getFiltersSection().isVisible();
			const dropdownVisible = await this.getFilterDropdown().isVisible();
			const searchVisible = await this.getSearchForm().isVisible();

			return sectionVisible && dropdownVisible && searchVisible;
		} catch {
			return false;
		}
	}

	/**
	 * Get filter menu items when dropdown is open
	 */
	async getFilterMenuItems(): Promise<string[]> {
		if (!(await this.isFilterDropdownOpen())) {
			await this.openFilterDropdown();
		}

		const menuItems = this.page.locator('.dropdown.menu[data-dropdown-menu] a[role="menuitem"]');
		const count = await menuItems.count();
		const items: string[] = [];

		for (let i = 0; i < count; i++) {
			const text = await menuItems.nth(i).textContent();
			if (text && text.trim()) {
				items.push(text.trim());
			}
		}

		return items;
	}

	/**
	 * Get accessibility attributes for screen readers
	 */
	async getAccessibilityInfo(): Promise<Record<string, string | null>> {
		const container = this.getFiltersSection();

		return {
			ariaLabel: await container.getAttribute('aria-label'),
			role: await container.getAttribute('role'),
			searchInputAriaLabel: await this.getSearchInput().getAttribute('aria-label'),
			filterButtonAriaExpanded: await this.getFilterButton().getAttribute('aria-expanded')
		};
	}

	/**
	 * Wait for filters to load
	 */
	async waitForFiltersToLoad(): Promise<void> {
		await this.getFiltersSection().waitFor({ state: 'visible' });
		await this.getFilterButton().waitFor({ state: 'visible' });
		await this.getSearchInput().waitFor({ state: 'visible' });
	}

	/**
	 * Check accessibility compliance
	 */
	async checkAccessibility(): Promise<void> {
		// Check if search input has proper aria-label
		const searchAriaLabel = await this.getSearchInput().getAttribute('aria-label');
		if (!searchAriaLabel) {
			console.warn('Search input should have aria-label attribute');
		}

		// Check if filter button has proper aria-expanded
		const filterAriaExpanded = await this.getFilterButton().getAttribute('aria-expanded');
		if (filterAriaExpanded === null) {
			console.warn('Filter button should have aria-expanded attribute');
		}

		// Check if applied filters have proper removal instructions
		const appliedCount = await this.getAppliedFiltersCount();
		if (appliedCount > 0) {
			const firstTag = this.getAppliedFilterTags().first();
			const removeButton = firstTag.locator('.delete');
			const removeAriaLabel = await removeButton.getAttribute('aria-label');
			if (!removeAriaLabel) {
				console.warn('Applied filter remove buttons should have aria-label');
			}
		}
	}
}
