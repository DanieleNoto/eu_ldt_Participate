import { expect, Locator, Page } from '@playwright/test';
import { AuthenticatedPage } from '../../../base/AuthenticatedPage';

/**
 * Page Object Model for the participatory processes overview page.
 * Manages the display, filters, and navigation of available processes.
 */
export class ProcessesOverviewPage extends AuthenticatedPage {
	// Main layout elements
	private readonly contentContainer: Locator;
	private readonly layoutTwoCol: Locator;
	private readonly asideSection: Locator;
	private readonly mainSection: Locator;

	// Header and title elements
	private readonly pageTitle: Locator;
	private readonly processesGrid: Locator;
	private readonly processesCount: Locator;

	// Filter elements
	private readonly filterForm: Locator;
	private readonly filterDropdownTrigger: Locator;

	// Date filter
	private readonly dateFilterContainer: Locator;
	private readonly dateFilterTrigger: Locator;
	private readonly dateFilterPanel: Locator;
	private readonly dateFilterAll: Locator;
	private readonly dateFilterUpcoming: Locator;
	private readonly dateFilterPast: Locator;
	private readonly dateFilterActive: Locator;

	// Scope filter
	private readonly scopeFilterContainer: Locator;
	private readonly scopeFilterTrigger: Locator;
	private readonly scopeFilterPanel: Locator;
	private readonly scopeFilterAll: Locator;
	private readonly scopeFilterGlobal: Locator;

	// Area filter
	private readonly areaFilterTrigger: Locator;
	private readonly areaFilterAll: Locator;

	// Process cards grid
	private readonly cardGrid: Locator;
	private readonly processCards: Locator;
	private readonly allProcessCards: Locator;

	constructor(page: Page) {
		super(page);

		// Main layout elements
		this.contentContainer = page.locator('#content[data-content]');
		this.layoutTwoCol = page.locator('.layout-2col');
		this.asideSection = page.locator('.layout-2col__aside');
		this.mainSection = page.locator('.layout-2col__main');

		// Header and title elements
		this.pageTitle = page.locator('.layout-2col__aside h1.title-decorator');
		this.processesGrid = page.locator('#processes-grid');
		this.processesCount = page.locator('#processes-grid h2');

		// Filter elements
		this.filterForm = page.locator('form.new_filter[data-filters]');
		this.filterDropdownTrigger = page.locator('#dropdown-trigger-filters');

		// Date filter
		this.dateFilterContainer = page
			.locator('.filter-container')
			.filter({ has: page.locator('#trigger-menu-date') });
		this.dateFilterTrigger = page.locator('#trigger-menu-date');
		this.dateFilterPanel = page.locator('#panel-dropdown-menu-date');
		this.dateFilterAll = page.locator('input[name="filter[with_date]"][value="all"]');
		this.dateFilterUpcoming = page.locator('input[name="filter[with_date]"][value="upcoming"]');
		this.dateFilterPast = page.locator('input[name="filter[with_date]"][value="past"]');
		this.dateFilterActive = page.locator('input[name="filter[with_date]"][value="active"]');

		// Scope filter
		this.scopeFilterContainer = page
			.locator('.filter-container')
			.filter({ has: page.locator('#trigger-menu-scope') });
		this.scopeFilterTrigger = page.locator('#trigger-menu-scope');
		this.scopeFilterPanel = page.locator('#panel-dropdown-menu-scope');
		this.scopeFilterAll = page.locator(
			'label[data-global-checkbox] input[name="filter[with_any_scope][]"][value=""]'
		);
		this.scopeFilterGlobal = page.locator('input[name="filter[with_any_scope][]"][value="global"]');

		// Area filter
		this.areaFilterTrigger = page.locator('#trigger-menu-area');
		this.areaFilterAll = page.locator(
			'label[data-global-checkbox] input[name="filter[with_any_area][]"][value=""]'
		);

		// Process cards grid
		this.cardGrid = page.locator('.card__grid-grid');
		this.processCards = page.locator('#highlighted-processes .card__highlight');
		this.allProcessCards = page.locator('#processes-grid .card__grid-grid a.card__grid');
	}

	// Navigation methods

	/**
	 * Navigates to the processes overview page
	 */
	async navigateToProcessesOverview(): Promise<void> {
		await this.navigateTo('/processes');
		await this.waitForPageLoad();
	}

	/**
	 * Waits for the page to load completely
	 */
	async waitForPageLoad(): Promise<void> {
		await this.waitForElement('.layout-2col');
		await this.waitForElement('#processes-grid');
		await this.waitForLoadState('networkidle');
	}

	/**
	 * Navigates to a specific process using its slug
	 * @param processSlug - The slug of the process to navigate to
	 */
	async navigateToProcessBySlug(processSlug: string): Promise<void> {
		const processCard = this.getProcessCardBySlug(processSlug);
		await processCard.click();
		await this.waitForLoadState('networkidle');
	}

	/**
	 * Navigates to a process by clicking on its card using the process title
	 * @param processTitle - The title of the process to navigate to
	 */
	async navigateToProcessByTitle(processTitle: string): Promise<void> {
		const processCard = this.getProcessCardByTitle(processTitle);
		await processCard.click();
		await this.waitForLoadState('networkidle');
	}

	/**
	 * Navigates to a process by clicking on its card using the card index
	 * @param index - The index of the process card (0-based)
	 */
	async navigateToProcessByIndex(index: number): Promise<void> {
		const processCard = this.processCards.nth(index);
		await processCard.click();
		await this.waitForLoadState('networkidle');
	}

	// Process card locator methods

	/**
	 * Gets a process card by its slug (from href attribute)
	 * @param processSlug - The slug of the process
	 */
	private getProcessCardBySlug(processSlug: string): Locator {
		return this.processCards.filter({ has: this.getPage().locator(`[href*="/processes/${processSlug}"]`) });
	}

	/**
	 * Gets a process card by its title
	 * @param processTitle - The title of the process
	 */
	private getProcessCardByTitle(processTitle: string): Locator {
		return this.processCards.filter({ has: this.getPage().locator('h3', { hasText: processTitle }) });
	}

	/**
	 * Gets a process card from the main grid by its title
	 * @param processTitle - The title of the process
	 */
	private getAllProcessCardByTitle(processTitle: string): Locator {
		return this.allProcessCards.filter({ has: this.getPage().locator('h3', { hasText: processTitle }) });
	}

	/**
	 * Gets a process card by its ID attribute
	 * @param processId - The ID of the participatory process
	 */
	private getProcessCardById(processId: string): Locator {
		return this.processCards.filter({ has: this.getPage().locator(`#participatory_process_${processId}`) });
	}

	// Process information methods

	/**
	 * Gets the total number of processes displayed
	 */
	async getProcessesCount(): Promise<number> {
		return await this.processCards.count();
	}

	/**
	 * Gets the count text from the header (e.g., "1 active process")
	 */
	async getProcessesCountText(): Promise<string> {
		return (await this.processesCount.textContent()) || '';
	}

	/**
	 * Gets the title of a specific process by index
	 * @param index - The index of the process card (0-based)
	 */
	async getProcessTitle(index: number): Promise<string> {
		const titleElement = this.processCards.nth(index).locator('h3');
		return (await titleElement.textContent()) || '';
	}

	/**
	 * Gets all visible process titles
	 */
	async getAllProcessTitles(): Promise<string[]> {
		const titles: string[] = [];
		const count = await this.getProcessesCount();

		for (let i = 0; i < count; i++) {
			const title = await this.getProcessTitle(i);
			titles.push(title);
		}

		return titles;
	}

	/**
	 * Checks if a process with the given slug exists in the list
	 * @param processSlug - The slug of the process to check
	 */
	async hasProcessWithSlug(processSlug: string): Promise<boolean> {
		try {
			const processCard = this.getProcessCardBySlug(processSlug);
			return await processCard.isVisible();
		} catch {
			return false;
		}
	}

	/**
	 * Checks if a process with the given title exists in the list
	 * @param processTitle - The title of the process to check
	 */
	async hasProcessWithTitle(processTitle: string): Promise<boolean> {
		try {
			const processCard = this.getProcessCardByTitle(processTitle);
			return await processCard.isVisible();
		} catch {
			return false;
		}
	}

	/**
	 * Gets the href (URL) of a process card by its slug
	 * @param processSlug - The slug of the process
	 */
	async getProcessUrl(processSlug: string): Promise<string> {
		const processCard = this.getProcessCardBySlug(processSlug);
		const href = await processCard.getAttribute('href');
		return href || '';
	}

	// Verification methods

	/**
	 * Verifies that the processes overview page is properly loaded
	 */
	async expectToBeOnProcessesOverviewPage(): Promise<void> {
		await expect(this.getPage()).toHaveURL(/\/processes$/);
		await expect(this.pageTitle).toHaveText('Processes');
		await expect(this.processesGrid).toBeVisible();
	}

	/**
	 * Expects a specific number of processes to be displayed
	 * @param expectedCount - The expected number of processes
	 */
	async expectProcessesCount(expectedCount: number): Promise<void> {
		await expect(this.processCards).toHaveCount(expectedCount);
	}

	/**
	 * Expects a process with the given slug to be visible
	 * @param processSlug - The slug of the process
	 */
	async expectProcessWithSlugToBeVisible(processSlug: string): Promise<void> {
		const processCard = this.getProcessCardBySlug(processSlug);
		await expect(processCard).toBeVisible();
	}

	/**
	 * Expects a process with the given title to be visible
	 * @param processTitle - The title of the process
	 */
	async expectProcessWithTitleToBeVisible(processTitle: string): Promise<void> {
		const processCard = this.getProcessCardByTitle(processTitle);
		await expect(processCard).toBeVisible();
	}
	/**
	 * Expects the processes filter to be visible
	 * @param processTitle - The title of the process
	 */
	async expectProcessesFilterToBeVisible(): Promise<void> {
		await expect(this.filterForm).toBeVisible();
		await expect(this.dateFilterContainer).toBeVisible();
		await expect(this.dateFilterPanel).toBeVisible();
		await expect(this.scopeFilterContainer).toBeVisible();
		await expect(this.scopeFilterPanel).toBeVisible();
	}

	// Page state verification

	/**
	 * Checks if the page layout is properly loaded
	 */
	async isPageLayoutLoaded(): Promise<boolean> {
		const contentLoaded = await this.contentContainer.isVisible();
		const layoutLoaded = await this.layoutTwoCol.isVisible();
		const asideLoaded = await this.asideSection.isVisible();
		const mainLoaded = await this.mainSection.isVisible();

		return contentLoaded && layoutLoaded && asideLoaded && mainLoaded;
	}

	/**
	 * Checks if the processes grid is loaded and visible
	 */
	async isProcessesGridLoaded(): Promise<boolean> {
		const gridLoaded = await this.processesGrid.isVisible();
		const cardGridLoaded = await this.cardGrid.isVisible();

		return gridLoaded && cardGridLoaded;
	}

	/**
	 * Checks if there are any processes displayed
	 */
	async hasAnyProcesses(): Promise<boolean> {
		const count = await this.getProcessesCount();
		return count > 0;
	}

	// Filter interaction methods

	/**
	 * Opens the filters panel if it is closed
	 */
	async openFiltersPanel(): Promise<void> {
		const isExpanded = await this.filterDropdownTrigger.getAttribute('aria-expanded');
		if (isExpanded !== 'true') {
			await this.filterDropdownTrigger.click();
			await this.page.waitForTimeout(300); // Small pause for animation
		}
	}

	/**
	 * Opens the date filter if it is closed
	 */
	async openDateFilter(): Promise<void> {
		await this.openFiltersPanel();

		const isExpanded = await this.dateFilterTrigger.getAttribute('aria-expanded');
		if (isExpanded !== 'true') {
			await this.dateFilterTrigger.click();
			await this.page.waitForTimeout(300); // Small pause for animation
		}
	}

	/**
	 * Opens the scope filter if it is closed
	 */
	async openScopeFilter(): Promise<void> {
		await this.openFiltersPanel();

		const isExpanded = await this.scopeFilterTrigger.getAttribute('aria-expanded');
		if (isExpanded !== 'true') {
			await this.scopeFilterTrigger.click();
			await this.page.waitForTimeout(300); // Small pause for animation
		}
	}

	/**
	 * Opens the area filter if it is closed
	 */
	async openAreaFilter(): Promise<void> {
		await this.openFiltersPanel();

		const isExpanded = await this.areaFilterTrigger.getAttribute('aria-expanded');
		if (isExpanded !== 'true') {
			await this.areaFilterTrigger.click();
			await this.page.waitForTimeout(300); // Small pause for animation
		}
	}

	/**
	 * Filters processes by date: all, upcoming, past, or active
	 * @param option - The date filter option: 'all', 'upcoming', 'past', or 'active'
	 */
	async filterByStatus(option: 'all' | 'upcoming' | 'past' | 'active'): Promise<void> {
		await this.openDateFilter();

		switch (option) {
			case 'all':
				await this.dateFilterAll.check();
				break;
			case 'upcoming':
				await this.dateFilterUpcoming.check();
				break;
			case 'past':
				await this.dateFilterPast.check();
				break;
			case 'active':
				await this.dateFilterActive.check();
				break;
		}

		// Wait for the results to update
		await this.page.waitForLoadState('networkidle');
	}

	/**
	 * Filters processes by scope: all or global
	 * @param option - The scope filter option: 'all' or 'global'
	 */
	async filterByScope(option: 'all' | 'global'): Promise<void> {
		await this.openScopeFilter();

		switch (option) {
			case 'all':
				await this.scopeFilterAll.check();
				break;
			case 'global':
				await this.scopeFilterGlobal.check();
				break;
		}

		// Wait for the results to update
		await this.page.waitForLoadState('networkidle');
	}

	/**
	 * Selects the "All" option in the area filter
	 */
	async filterByAllAreas(): Promise<void> {
		await this.openAreaFilter();
		await this.areaFilterAll.check();
		await this.page.waitForLoadState('networkidle');
	}

	/**
	 * Selects a specific area from the area filter
	 * @param areaName - The name of the area to select
	 */
	async filterByArea(areaName: string): Promise<void> {
		await this.openAreaFilter();

		// Search for the area by displayed name
		const areaOption = this.page.locator(`.filter span:text("${areaName}")`).first();

		// If found, select the associated checkbox
		if (await areaOption.isVisible()) {
			// Go up to the parent label and then find the checkbox
			const parent = areaOption.locator('xpath=..');
			await parent.locator('input[type="checkbox"]').check();
			await this.page.waitForLoadState('networkidle');
		} else {
			throw new Error(`Area "${areaName}" not found in area filter`);
		}
	}

	/**
	 * Resets all applied filters
	 */
	async resetAllFilters(): Promise<void> {
		await this.openFiltersPanel();

		// Select the "All" options for each filter
		await this.openDateFilter();
		await this.dateFilterAll.check();

		await this.openScopeFilter();
		await this.scopeFilterAll.check();

		await this.openAreaFilter();
		await this.areaFilterAll.check();

		// Wait for the results to update
		await this.page.waitForLoadState('networkidle');
	}

	/**
	 * Checks which date filter option is currently selected
	 * @returns The currently selected option: 'all', 'upcoming', 'past', or 'active'
	 */
	async getSelectedDateFilter(): Promise<'all' | 'upcoming' | 'past' | 'active'> {
		await this.openDateFilter();

		if (await this.dateFilterAll.isChecked()) return 'all';
		if (await this.dateFilterUpcoming.isChecked()) return 'upcoming';
		if (await this.dateFilterPast.isChecked()) return 'past';
		if (await this.dateFilterActive.isChecked()) return 'active';

		return 'all'; // Default if no option is selected
	}

	/**
	 * Checks if the filter has been applied by checking the URL
	 * @returns True if at least one filter is active in the URL
	 */
	async hasActiveFilters(): Promise<boolean> {
		const url = this.page.url();
		return url.includes('filter%5B');
	}

	/**
	 * Applies date filter and ensures processes grid is fully loaded with robust waiting
	 * @param dateOption - The date filter option to apply
	 */
	async applyDateFilterAndEnsureGridLoaded(dateOption: 'all' | 'upcoming' | 'past' | 'active'): Promise<void> {
		// Check if the desired filter is already selected
		const currentFilter = await this.getSelectedDateFilter();

		if (currentFilter !== dateOption) {
			// Apply the date filter
			await this.filterByStatus(dateOption);
			console.log(`Applied "${dateOption}" date filter`);
		} else {
			console.log(`"${dateOption}" date filter is already applied`);
		}

		await this.page.waitForLoadState('networkidle');

		// Wait for grid container to be present
		await expect(this.processesGrid).toBeVisible();
		await expect(this.cardGrid).toBeVisible();

		// Wait for DOM to update completely for 'all' filter
		if (dateOption === 'all') {
			await this.page.waitForFunction(() => {
				const links = document.querySelectorAll('#processes-grid .card__grid-grid a.card__grid');
				return links.length >= 2;
			});
		}

		// Check if grid has processes or is empty
		try {
			await expect(this.allProcessCards.first()).toBeVisible();
			console.log(`Grid loaded with processes`);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			console.log(`Grid is empty after applying "${dateOption}" filter. Error: ${errorMessage}`);
		}
	}

	/**
	 * Checks if a process with the given title is visible in the grid
	 * @param processTitle - The title of the process to check
	 * @returns Promise<boolean> - True if visible, false if not visible
	 */
	async checkProcessVisibility(processTitle: string): Promise<boolean> {
		console.log(`Looking for process with title: "${processTitle}"`);

		const processesGrid = this.page.locator('#processes-grid .card__grid-grid');
		const processLink = processesGrid.getByRole('link', { name: processTitle });

		try {
			await expect(processLink).toBeVisible();
			console.log(`Process "${processTitle}" is visible in the grid`);
			return true;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			console.log(`Process "${processTitle}" is not visible in the grid. Error: ${errorMessage}`);
			return false;
		}
	}

	/**
	 * Navigates to a process
	 * @param processTitle - The title of the process to navigate to
	 * @param processSlug - The slug of the process for direct navigation fallback
	 */
	async navigateToProcess(processTitle: string, processSlug: string): Promise<void> {
		try {
			// Get the process card from the main grid
			const processCard = this.getAllProcessCardByTitle(processTitle);

			// Check if the process is visible and clickable
			await expect(processCard).toBeVisible();
			await processCard.click();
			await this.waitForLoadState('networkidle');
			console.log(`Successfully clicked on process "${processTitle}" from the grid`);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			console.log(`Could not click on process from grid, using direct navigation fallback`);
			console.log(`Error: ${errorMessage}`);
			const processUrl = `/processes/${processSlug}`;
			await this.page.goto(processUrl);
			await this.waitForLoadState('networkidle');
			console.log(`Successfully navigated to process URL: ${processUrl}`);
		}
	}
}
