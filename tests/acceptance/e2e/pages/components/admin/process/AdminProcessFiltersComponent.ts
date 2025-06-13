import { Page } from '@playwright/test';

/**
 * Component per i filtri e la ricerca nella sezione processi admin.
 * Gestisce i filtri dropdown e il campo di ricerca.
 */
export class AdminProcessFiltersComponent {
	constructor(private page: Page) {}

	// Selettori principali
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

	// Selettori per il campo di ricerca
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

	// Selettori per i filtri specifici
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

	// Selettori per i tag dei filtri applicati
	private get appliedFiltersSection() {
		return this.page.locator('[data-applied-filters-tags]');
	}

	// Metodi di verifica
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

	// Metodi per il campo di ricerca
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

	// Metodi per i filtri dropdown
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

	// Metodi per applicare filtri specifici
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

	// Metodi per ottenere informazioni sui filtri
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

	// Metodi per i filtri applicati
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

	// Metodi per verificare il form di ricerca
	async getSearchFormAction(): Promise<string> {
		return (await this.searchForm.getAttribute('action')) || '';
	}

	async getSearchFormMethod(): Promise<string> {
		return (await this.searchForm.getAttribute('method')) || '';
	}

	// Verifica se il componente è completamente caricato
	async isComponentFullyLoaded(): Promise<boolean> {
		const filtersVisible = await this.isFiltersSectionVisible();
		const dropdownVisible = await this.isFilterDropdownVisible();
		const searchVisible = await this.isSearchSectionVisible();
		const inputVisible = await this.isSearchInputVisible();
		const buttonVisible = await this.isSearchButtonVisible();

		return filtersVisible && dropdownVisible && searchVisible && inputVisible && buttonVisible;
	}
}
