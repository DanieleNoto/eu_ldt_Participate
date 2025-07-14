import { Page } from '@playwright/test';

/**
 * Component for tab navigation in the admin processes section.
 * Manages the "Processes" and "Process Group" tabs.
 */
export class AdminProcessTabNavigationComponent {
	constructor(private page: Page) {}

	// Main selectors
	private get tabNavigation() {
		return this.page.locator('nav.main-nav').filter({ has: this.page.locator('.tab-x-container') });
	}

	private get tabContainer() {
		return this.tabNavigation.locator('.tab-x-container');
	}

	private get tabItems() {
		return this.tabContainer.locator('li[role="menuitem"]');
	}

	// Selectors for specific tabs
	private get processesTab() {
		return this.tabContainer.locator('a[href*="/admin/participatory_processes"]').first();
	}

	private get processGroupsTab() {
		return this.tabContainer.locator('a[href*="/admin/participatory_process_groups"]');
	}

	// Verification methods
	async isTabNavigationVisible(): Promise<boolean> {
		return await this.tabNavigation.isVisible();
	}

	async isTabContainerVisible(): Promise<boolean> {
		return await this.tabContainer.isVisible();
	}

	async isProcessesTabVisible(): Promise<boolean> {
		return await this.processesTab.isVisible();
	}

	async isProcessGroupsTabVisible(): Promise<boolean> {
		return await this.processGroupsTab.isVisible();
	}

	// Methods to get text
	async getProcessesTabText(): Promise<string> {
		return (await this.processesTab.textContent()) || '';
	}

	async getProcessGroupsTabText(): Promise<string> {
		return (await this.processGroupsTab.textContent()) || '';
	}

	// Methods to check active state
	async isProcessesTabActive(): Promise<boolean> {
		const parentLi = this.processesTab.locator('..'); // Parent li element
		const hasActiveClass = await parentLi.getAttribute('class');
		return hasActiveClass?.includes('is-active') || false;
	}

	async isProcessGroupsTabActive(): Promise<boolean> {
		const parentLi = this.processGroupsTab.locator('..'); // Parent li element
		const hasActiveClass = await parentLi.getAttribute('class');
		return hasActiveClass?.includes('is-active') || false;
	}

	async getActiveTabText(): Promise<string> {
		const activeTab = this.tabContainer.locator('.is-active a');
		return (await activeTab.textContent()) || '';
	}

	// Navigation methods
	async clickProcessesTab(): Promise<void> {
		await this.processesTab.click();
	}

	async clickProcessGroupsTab(): Promise<void> {
		await this.processGroupsTab.click();
	}

	// Methods to get tab information
	async getTabCount(): Promise<number> {
		return await this.tabItems.count();
	}

	async getAllTabTexts(): Promise<string[]> {
		const tabs = await this.tabItems.locator('a').all();
		const tabTexts: string[] = [];

		for (const tab of tabs) {
			const text = await tab.textContent();
			if (text) {
				tabTexts.push(text.trim());
			}
		}

		return tabTexts;
	}

	// Methods to check aria attributes
	async getProcessesTabAriaCurrent(): Promise<string | null> {
		return await this.processesTab.getAttribute('aria-current');
	}

	async getProcessGroupsTabAriaCurrent(): Promise<string | null> {
		return await this.processGroupsTab.getAttribute('aria-current');
	}

	// Check if the component is fully loaded
	async isComponentFullyLoaded(): Promise<boolean> {
		const navigationVisible = await this.isTabNavigationVisible();
		const containerVisible = await this.isTabContainerVisible();
		const processesTabVisible = await this.isProcessesTabVisible();
		const processGroupsTabVisible = await this.isProcessGroupsTabVisible();

		return navigationVisible && containerVisible && processesTabVisible && processGroupsTabVisible;
	}

	// Check if at least one tab is active
	async hasActiveTab(): Promise<boolean> {
		const processesActive = await this.isProcessesTabActive();
		const processGroupsActive = await this.isProcessGroupsTabActive();

		return processesActive || processGroupsActive;
	}
}
