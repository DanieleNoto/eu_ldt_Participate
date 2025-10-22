import { expect, Locator, Page } from '@playwright/test';
import { AuthenticatedPage } from '../../../base/AuthenticatedPage';

/**
 * Page Object Model for the participatory process detail page.
 * Manages the display of process details and navigation to its components.
 */
export class ProcessDetailPage extends AuthenticatedPage {
	// Main content elements
	private readonly contentContainer: Locator;
	private readonly mainElement: Locator;
	private readonly participatorySpaceContainer: Locator;

	// Hero section elements
	private readonly heroSection: Locator;
	private readonly processTitle: Locator;
	private readonly processSlogan: Locator;

	// Navigation dropdown
	private readonly navContainer: Locator;
	private readonly navDropdownTrigger: Locator;
	private readonly navDropdownMenu: Locator;
	private readonly navItems: Locator;

	// Help elements
	private readonly debatesLink: Locator;
	private readonly meetingsLink: Locator;
	private meetingCards;

	constructor(page: Page) {
		super(page);

		// Main content elements
		this.contentContainer = page.locator('#content[data-content]');
		this.mainElement = page.locator('main');
		this.participatorySpaceContainer = page.locator('.participatory-space__container');

		// Hero section elements
		this.heroSection = page.locator('section[data-process-hero]');
		this.processTitle = page.locator('.participatory-space__hero-text h1');
		this.processSlogan = page.locator('.participatory-space__hero-slogan');

		// Navigation dropdown
		this.navContainer = page.locator('.participatory-space__nav-container');
		this.navDropdownTrigger = page.locator('#dropdown-trigger-participatory-space');
		this.navDropdownMenu = page.locator('#dropdown-menu-participatory-space');
		this.navItems = page.locator('.participatory-space__nav-item');

		// Help elements
		//this.helpButton = page.locator('#floating-helper-tip button');
		this.debatesLink = page.locator('a[href$="/debates"]:visible').first();
		this.meetingsLink = page.locator('a[href$="/meetings"]:visible').first();
		this.meetingCards = this.page.locator('.card__list-list .card__list');
	}

	// Navigation methods

	/**
	 * Navigates to a specific process detail page using its slug
	 * @param processSlug - The slug of the process to navigate to
	 */
	async navigateToProcess(processSlug: string): Promise<void> {
		await this.navigateTo(`/processes/${processSlug}`);
		await this.waitForPageLoad();
	}

	/**
	 * Waits for the page to load completely
	 */
	async waitForPageLoad(): Promise<void> {
		await this.waitForElement('.participatory-space__container');
		await this.waitForElement('section[data-process-hero]');
		await this.waitForLoadState('networkidle');
	}

	/**
	 * Navigates to the convocation page from the navigation dropdown
	 */
	async navigateToConvocationPage(): Promise<void> {
		// Ensure the dropdown is open
		await this.openNavigationDropdown();

		// Find and click the convocation page link
		const convocationLink = this.navItems.filter({ hasText: 'Page' });
		await convocationLink.click();
		await this.waitForLoadState('networkidle');
	}

	/**
	 * Navigates to the debates page from the link
	 */
	async navigateToDebatesPage(): Promise<void> {
		// Find and click the debates page link
		await this.debatesLink.click();
		await this.waitForLoadState('networkidle');
	}

	/**
	 * Navigates to the meetings page from the link
	 */
	async navigateToMeetingsPage(): Promise<void> {
		// Find and click the meetings page link
		await this.meetingsLink.click();
		await this.waitForLoadState('networkidle');
	}

	/**
	 * Navigates to a specific component by its name from the navigation dropdown
	 * @param componentName - The name of the component to navigate to
	 */
	async navigateToComponent(componentName: string): Promise<void> {
		// Ensure the dropdown is open
		await this.openNavigationDropdown();

		// Find and click the component link
		const componentLink = this.navItems.filter({ hasText: componentName });
		await componentLink.click();
		await this.waitForLoadState('networkidle');
	}

	// Navigation dropdown interaction methods

	/**
	 * Opens the navigation dropdown if not already open
	 */
	async openNavigationDropdown(): Promise<void> {
		const isExpanded = await this.navDropdownTrigger.getAttribute('aria-expanded');
		if (isExpanded !== 'true') {
			await this.navDropdownTrigger.click();
			await this.navDropdownMenu.waitFor({ state: 'visible' });
		}
	}

	/**
	 * Closes the navigation dropdown if open
	 */
	async closeNavigationDropdown(): Promise<void> {
		const isExpanded = await this.navDropdownTrigger.getAttribute('aria-expanded');
		if (isExpanded === 'true') {
			await this.navDropdownTrigger.click();
			await this.navDropdownMenu.waitFor({ state: 'hidden' });
		}
	}

	/**
	 * Checks if the navigation dropdown is open
	 */
	async isNavigationDropdownOpen(): Promise<boolean> {
		const isExpanded = await this.navDropdownTrigger.getAttribute('aria-expanded');
		return isExpanded === 'true';
	}

	// Information methods

	/**
	 * Gets the process title from the hero section
	 */
	async getProcessTitle(): Promise<string> {
		return (await this.processTitle.textContent()) || '';
	}

	/**
	 * Gets the process slogan from the hero section
	 */
	async getProcessSlogan(): Promise<string> {
		return (await this.processSlogan.textContent()) || '';
	}

	/**
	 * Gets all available navigation component names
	 */
	async getAvailableComponents(): Promise<string[]> {
		await this.openNavigationDropdown();

		const components: string[] = [];
		const count = await this.navItems.count();

		for (let i = 0; i < count; i++) {
			const text = await this.navItems.nth(i).textContent();
			if (text) {
				// Remove the arrow icon text and trim
				const componentName = text.replace(/\s*→\s*$/, '').trim();
				components.push(componentName);
			}
		}

		return components;
	}

	/**
	 * Checks if a specific component is available in the navigation
	 * @param componentName - The name of the component to check
	 */
	async hasComponent(componentName: string): Promise<boolean> {
		const components = await this.getAvailableComponents();
		return components.includes(componentName);
	}

	/**
	 * Checks if the convocation page is available
	 */
	async hasConvocationPage(): Promise<boolean> {
		return await this.hasComponent('Convocation Page');
	}

	/**
	 * Gets the URL of the convocation page
	 */
	async getConvocationPageUrl(): Promise<string> {
		await this.openNavigationDropdown();
		const convocationLink = this.navItems.filter({ hasText: 'Convocation Page' });
		const href = await convocationLink.getAttribute('href');
		return href || '';
	}

	/**
	 * Gets the URL of a specific component
	 * @param componentName - The name of the component
	 */
	async getComponentUrl(componentName: string): Promise<string> {
		await this.openNavigationDropdown();
		const componentLink = this.navItems.filter({ hasText: componentName });
		const href = await componentLink.getAttribute('href');
		return href || '';
	}

	// Verification methods

	/**
	 * Verifies that the process detail page is properly loaded
	 */
	async expectToBeOnProcessDetailPage(): Promise<void> {
		await expect(this.getPage()).toHaveURL(/\/processes\/[^\/]+$/);
		await expect(this.heroSection).toBeVisible();
		await expect(this.processTitle).toBeVisible();
		await expect(this.navContainer).toBeVisible();
	}

	/**
	 * Expects the process to have a specific title
	 * @param expectedTitle - The expected process title
	 */
	async expectProcessTitle(expectedTitle: string): Promise<void> {
		await expect(this.processTitle).toHaveText(expectedTitle);
	}

	/**
	 * Expects the convocation page to be available
	 */
	async expectConvocationPageToBeAvailable(): Promise<void> {
		const hasConvocation = await this.hasConvocationPage();
		expect(hasConvocation).toBe(true);
	}

	/**
	 * Expects a specific component to be available
	 * @param componentName - The name of the component
	 */
	async expectComponentToBeAvailable(componentName: string): Promise<void> {
		const hasComponent = await this.hasComponent(componentName);
		expect(hasComponent).toBe(true);
	}
	/**
	 * Expects the participatory container to be visible
	 */
	async expectParticipatoryContainerToBeVisible(): Promise<void> {
		this.expectToBeOnProcessDetailPage();
		expect(this.participatorySpaceContainer).toBeVisible();
	}

	/**
	 * Expects the current process to be a private process
	 */
	async expectToBePrivateProcess(): Promise<void> {
		const privateProcessText = this.getPage().getByText('This is a private process');
		await expect(privateProcessText).toBeVisible();
	}

	/**
	 * Expects to be on a process detail page with valid URL pattern
	 */
	async expectToBeOnValidProcessDetailPage(): Promise<void> {
		await expect(this.getPage()).toHaveURL(/\/processes\/[^\/]+$/);
	}

	// Page state verification

	/**
	 * Checks if the page layout is properly loaded
	 */
	async isPageLayoutLoaded(): Promise<boolean> {
		const contentLoaded = await this.contentContainer.isVisible();
		const mainLoaded = await this.mainElement.isVisible();
		const containerLoaded = await this.participatorySpaceContainer.isVisible();
		const heroLoaded = await this.heroSection.isVisible();

		return contentLoaded && mainLoaded && containerLoaded && heroLoaded;
	}

	/**
	 * Checks if the navigation dropdown is available and functional
	 */
	async isNavigationAvailable(): Promise<boolean> {
		const navLoaded = await this.navContainer.isVisible();
		const triggerLoaded = await this.navDropdownTrigger.isVisible();

		return navLoaded && triggerLoaded;
	}
	// /**
	// * Finds the index of a meeting card given its title
	// * @param title - The exact title of the card
	// * @returns the index (0-based) or -1 if not found
	// */
	async findMeetingCardIndexByTitle(title: string): Promise<number> {
		const count = await this.meetingCards.count();
		for (let i = 0; i < count; i++) {
			const cardTitle = await this.meetingCards.nth(i).locator('.card__list-title').innerText();
			if (cardTitle.trim() === title) {
				return i;
			}
		}
		return -1;
	}

	/**
	 * Make sure the meeting list is visible
	 * and that each card contains the title, date/time, and location.
	 */
	async enhancedVerifyMeetingsCardListVisible(): Promise<void> {
		const count = await this.meetingCards.count();
		expect(count).toBeGreaterThan(0);

		for (let i = 0; i < count; i++) {
			const card = this.meetingCards.nth(i);
			await expect(card.locator('.card__list-title')).toBeVisible();
			await expect(card.locator('time.card__calendar')).toBeVisible();
			const locationText = await card.locator('.card__list-metadata div:nth-child(2)').textContent();
			expect(locationText?.trim()).toMatch(/Online|In-person|Hybrid/);
			const commentsLocator = card.locator('.card__list-metadata div[data-comments-count]');
			await expect(commentsLocator).toBeVisible();
		}
	}

	/**
	 * Retrieves the first online meeting card details
	 * @returns An object with meeting details or null if no online meeting is found
	 */

	async getFirstOnlineMeeting(): Promise<{
		index: number;
		title: string;
		date: string;
		type: string;
		link: string;
		comments: number;
	} | null> {
		const count = await this.meetingCards.count();

		for (let i = 0; i < count; i++) {
			const card = this.meetingCards.nth(i);

			const title = await card.locator('.card__list-title').textContent();
			const dateAttr = await card.locator('time.card__calendar').getAttribute('datetime');
			const link = await card.getAttribute('href');

			// Extract type (Online, Hybrid, In-person)
			const metadataItems = card.locator('.card__list-metadata div');
			const metadataCount = await metadataItems.count();

			let type = '';
			for (let j = 0; j < metadataCount; j++) {
				const text = await metadataItems.nth(j).textContent();
				if (text?.match(/Online|Hybrid|In-person/)) {
					type = text.trim();
					break;
				}
			}

			if (type === 'Online') {
				const commentsText = await card.locator('.card__list-metadata div[data-comments-count]').textContent();
				const comments = parseInt(commentsText?.trim() ?? '0', 10);

				return {
					index: i,
					title: title?.trim() ?? '',
					date: dateAttr ?? '',
					type,
					link: link ?? '',
					comments: isNaN(comments) ? 0 : comments
				};
			}
		}

		return null;
	}

	async clickMeetingCardByIndex(index: number): Promise<void> {
		const meetingCard = this.meetingCards.nth(index);
		await meetingCard.click();
	}

	async expectUrlContainsMeetings(): Promise<void> {
		await this.page.waitForURL(/.*\/meetings.*/);
		expect(this.page.url()).toContain('/meetings');
	}
}
