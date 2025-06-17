import { expect, Locator, Page } from '@playwright/test';

export class DebatesOverviewPage {
	private readonly page: Page;

	// Main page elements
	private readonly pageTitle: Locator;
	private readonly newDebateButton: Locator;
	private readonly debatesSection: Locator;
	private readonly debatesCountHeading: Locator;

	// Filter and search elements
	private readonly filterForm: Locator;
	private readonly searchInput: Locator;
	private readonly searchButton: Locator;
	private readonly filterDropdownButton: Locator;

	// Date filter
	private readonly dateFilterButton: Locator;
	private readonly dateFilterAll: Locator;
	private readonly dateFilterOpen: Locator;
	private readonly dateFilterClosed: Locator;

	// Origin filter
	private readonly originFilterButton: Locator;
	private readonly originFilterAll: Locator;
	private readonly originFilterOfficial: Locator;
	private readonly originFilterParticipants: Locator;
	private readonly originFilterUserGroup: Locator;

	// Order by dropdown
	private readonly orderByButton: Locator;
	private readonly orderByDropdown: Locator;
	private readonly orderByRandom: Locator;
	private readonly orderByRecent: Locator;
	private readonly orderByCommented: Locator;
	private readonly orderByUpdated: Locator;

	// Debates list
	private readonly debatesList: Locator;
	private readonly debateCards: Locator;

	constructor(page: Page) {
		this.page = page;

		// Main page elements
		this.pageTitle = this.page.locator('.title-decorator');
		this.newDebateButton = this.page.locator('a.button.button__xl.button__secondary', { hasText: 'New debate' });
		this.debatesSection = this.page.locator('#debates');
		this.debatesCountHeading = this.page.locator('#debates h2');

		// Filter and search elements
		this.filterForm = this.page.locator('form.new_filter');
		this.searchInput = this.page.locator('input[name="filter[search_text_cont]"]');
		this.searchButton = this.page.locator('button[type="submit"][aria-label="Search"]');
		this.filterDropdownButton = this.page.locator('#dropdown-trigger-filters');

		// Date filter
		this.dateFilterButton = this.page.locator('#trigger-menu-date');
		this.dateFilterAll = this.page.locator('input[value="all"][name="filter[with_any_state]"]');
		this.dateFilterOpen = this.page.locator('input[value="open"][name="filter[with_any_state]"]');
		this.dateFilterClosed = this.page.locator('input[value="closed"][name="filter[with_any_state]"]');

		// Origin filter
		this.originFilterButton = this.page.locator('#trigger-menu-origin');
		this.originFilterAll = this.page.locator('input[name="filter[with_any_origin][]"][value=""]');
		this.originFilterOfficial = this.page.locator('input[value="official"][name="filter[with_any_origin][]"]');
		this.originFilterParticipants = this.page.locator(
			'input[value="participants"][name="filter[with_any_origin][]"]'
		);
		this.originFilterUserGroup = this.page.locator('input[value="user_group"][name="filter[with_any_origin][]"]');

		// Order by dropdown
		this.orderByButton = this.page.locator('#dropdown-trigger-order');
		this.orderByDropdown = this.page.locator('#dropdown-menu-order');
		this.orderByRandom = this.page.locator('a[data-order="random"]');
		this.orderByRecent = this.page.locator('a[data-order="recent"]');
		this.orderByCommented = this.page.locator('a[data-order="commented"]');
		this.orderByUpdated = this.page.locator('a[data-order="updated"]');

		// Debates list
		this.debatesList = this.page.locator('.card__list-list');
		this.debateCards = this.page.locator('a.card__list');
	}

	/**
	 * Get the page object
	 */
	getPage(): Page {
		return this.page;
	}

	/**
	 * Wait for the page to be ready
	 */
	async waitForPageReady(): Promise<void> {
		await this.debatesSection.waitFor({ state: 'visible' });
		await this.debateCards.first().waitFor({ state: 'visible', timeout: 10000 });
	}

	/**
	 * Click on a debate title by index (0-based)
	 * @param index - The index of the debate to click (0 = first debate, 1 = second debate, etc.)
	 */
	async clickDebateByIndex(index: number): Promise<void> {
		const debateCard = this.debateCards.nth(index);
		await debateCard.waitFor({ state: 'visible' });
		await debateCard.click();
	}

	/**
	 * Click on a debate by its title text
	 * @param title - The exact title of the debate to click
	 */
	async clickDebateByTitle(title: string): Promise<void> {
		const debateCard = this.debateCards.filter({
			has: this.page.locator('.card__list-title', { hasText: title })
		});
		await debateCard.click();
	}

	/**
	 * Get the title of a debate by index
	 * @param index - The index of the debate (0-based)
	 * @returns The title text of the debate
	 */
	async getDebateTitleByIndex(index: number): Promise<string> {
		const debateCard = this.debateCards.nth(index);
		const titleElement = debateCard.locator('.card__list-title');
		return (await titleElement.textContent()) || '';
	}

	/**
	 * Get the description of a debate by index
	 * @param index - The index of the debate (0-based)
	 * @returns The description text of the debate
	 */
	async getDebateDescriptionByIndex(index: number): Promise<string> {
		const debateCard = this.debateCards.nth(index);
		const descriptionElement = debateCard.locator('.card__list-text');
		return (await descriptionElement.textContent()) || '';
	}

	/**
	 * Get the total number of debates shown
	 * @returns The number of debate cards visible
	 */
	async getDebatesCount(): Promise<number> {
		return await this.debateCards.count();
	}

	/**
	 * Get the debates count from the heading (e.g., "4 debates")
	 * @returns The text from the debates count heading
	 */
	async getDebatesCountHeading(): Promise<string> {
		return (await this.debatesCountHeading.textContent()) || '';
	}

	/**
	 * Get all debate titles visible on the page
	 * @returns Array of debate titles
	 */
	async getAllDebateTitles(): Promise<string[]> {
		const count = await this.getDebatesCount();
		const titles: string[] = [];

		for (let i = 0; i < count; i++) {
			const title = await this.getDebateTitleByIndex(i);
			titles.push(title);
		}

		return titles;
	}

	/**
	 * Check if a debate with the given title exists
	 * @param title - The title to search for
	 * @returns True if the debate exists, false otherwise
	 */
	async hasDebateWithTitle(title: string): Promise<boolean> {
		const debateCard = this.debateCards.filter({
			has: this.page.locator('.card__list-title', { hasText: title })
		});
		return (await debateCard.count()) > 0;
	}

	/**
	 * Get the comments count for a debate by index
	 * @param index - The index of the debate (0-based)
	 * @returns The number of comments
	 */
	async getCommentsCountByIndex(index: number): Promise<number> {
		const debateCard = this.debateCards.nth(index);
		const commentsElement = debateCard.locator('[data-comments-count]');
		const commentsText = (await commentsElement.textContent()) || '0';
		return parseInt(commentsText.trim());
	}

	/**
	 * Get the endorsements count for a debate by index
	 * @param index - The index of the debate (0-based)
	 * @returns The number of endorsements
	 */
	async getEndorsementsCountByIndex(index: number): Promise<number> {
		const debateCard = this.debateCards.nth(index);
		const endorsementsElement = debateCard.locator('[data-endorsements-count]');
		const endorsementsText = (await endorsementsElement.textContent()) || '0';
		return parseInt(endorsementsText.trim());
	}

	/**
	 * Check if a debate is open by index
	 * @param index - The index of the debate (0-based)
	 * @returns True if the debate shows "Open debate", false otherwise
	 */
	async isDebateOpenByIndex(index: number): Promise<boolean> {
		const debateCard = this.debateCards.nth(index);
		const statusElement = debateCard.locator('.card__list-metadata div', { hasText: 'Open debate' });
		return (await statusElement.count()) > 0;
	}

	/**
	 * Click the "New debate" button
	 */
	async clickNewDebateButton(): Promise<void> {
		await this.newDebateButton.click();
	}

	/**
	 * Search for debates with the given text
	 * @param searchText - The text to search for
	 */
	async searchDebates(searchText: string): Promise<void> {
		await this.searchInput.fill(searchText);
		await this.searchButton.click();
	}

	/**
	 * Clear the search field
	 */
	async clearSearch(): Promise<void> {
		await this.searchInput.clear();
		await this.searchButton.click();
	}

	/**
	 * Check if the page is loaded correctly
	 * @returns True if the debates section is visible
	 */
	async isPageLoaded(): Promise<boolean> {
		return await this.debatesSection.isVisible();
	}

	/**
	 * Verifies that the debates overview page is properly loaded
	 */
	async expectToBeOnDebatesOverviewPage(): Promise<void> {
		await expect(this.getPage()).toHaveURL(/\/processes\/.*\/debates$/);
		await expect(this.debatesSection).toBeVisible();
		await expect(this.newDebateButton).toBeVisible();
	}
}
