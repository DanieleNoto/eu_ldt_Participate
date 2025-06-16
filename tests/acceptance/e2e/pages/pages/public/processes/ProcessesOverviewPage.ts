import { expect, Locator, Page } from '@playwright/test';
import { AuthenticatedPage } from '../../../base/AuthenticatedPage';

/**
 * Page Object Model per la pagina di panoramica dei processi partecipativi.
 * Gestisce la visualizzazione, filtri e navigazione dei processi disponibili.
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
	private readonly filterDropdownMenu: Locator;

	// Date filter
	private readonly dateFilterContainer: Locator;
	private readonly dateFilterTrigger: Locator;
	private readonly dateFilterPanel: Locator;

	// Scope filter
	private readonly scopeFilterContainer: Locator;
	private readonly scopeFilterTrigger: Locator;
	private readonly scopeFilterPanel: Locator;

	// Area filter
	private readonly areaFilterContainer: Locator;
	private readonly areaFilterTrigger: Locator;
	private readonly areaFilterPanel: Locator;

	// Process cards grid
	private readonly cardGrid: Locator;
	private readonly processCards: Locator;

	// Help elements
	private readonly helpButton: Locator;

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
		this.filterDropdownMenu = page.locator('#dropdown-menu-filters');

		// Date filter
		this.dateFilterContainer = page
			.locator('.filter-container')
			.filter({ has: page.locator('#trigger-menu-date') });
		this.dateFilterTrigger = page.locator('#trigger-menu-date');
		this.dateFilterPanel = page.locator('#panel-dropdown-menu-date');

		// Scope filter
		this.scopeFilterContainer = page
			.locator('.filter-container')
			.filter({ has: page.locator('#trigger-menu-scope') });
		this.scopeFilterTrigger = page.locator('#trigger-menu-scope');
		this.scopeFilterPanel = page.locator('#panel-dropdown-menu-scope');

		// Area filter
		this.areaFilterContainer = page
			.locator('.filter-container')
			.filter({ has: page.locator('#trigger-menu-area') });
		this.areaFilterTrigger = page.locator('#trigger-menu-area');
		this.areaFilterPanel = page.locator('#panel-dropdown-menu-area');

		// Process cards grid
		this.cardGrid = page.locator('.card__grid-grid');
		this.processCards = page.locator('.card__grid');

		// Help elements
		this.helpButton = page.locator('#floating-helper-tip button');
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
	async navigateToProcess(processSlug: string): Promise<void> {
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

	// Debug methods

	/**
	 * Debug method to log all visible process information
	 */
	async debugProcessesList(): Promise<void> {
		console.log('=== Processes Overview Debug ===');
		console.log('URL:', this.getPage().url());
		console.log('Processes count:', await this.getProcessesCount());
		console.log('Count text:', await this.getProcessesCountText());

		const titles = await this.getAllProcessTitles();
		console.log('Process titles:', titles);
		console.log('================================');
	}
}
