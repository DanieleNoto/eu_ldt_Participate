import { Page } from '@playwright/test';

/**
 * Component per gestire i tab verticali della pagina account
 */
export class VerticalTabsComponent {
	constructor(private page: Page) {}

	// Selettori principali
	private get tabsContainer() {
		return this.page.locator('.vertical-tabs');
	}

	private get tabsNavigation() {
		return this.page.locator('.vertical-tabs nav');
	}

	private get tabsList() {
		return this.page.locator('#dropdown-menu-profile');
	}

	private get dropdownTrigger() {
		return this.page.locator('#dropdown-trigger-profile');
	}

	// Selettori per i singoli tab
	private get accountTab() {
		return this.page.locator('a[href*="/account"]');
	}

	private get notificationSettingsTab() {
		return this.page.locator('a[href*="/notifications_settings"]');
	}

	private get myInterestsTab() {
		return this.page.locator('a[href*="/user_interests"]');
	}

	private get myDataTab() {
		return this.page.locator('a[href*="/download_your_data"]');
	}

	private get deleteAccountTab() {
		return this.page.locator('a[href*="/account/delete"]');
	}

	// Metodi di verifica
	async isTabsContainerVisible(): Promise<boolean> {
		return await this.tabsContainer.isVisible();
	}

	async isTabsListVisible(): Promise<boolean> {
		return await this.tabsList.isVisible();
	}

	async getActiveTabText(): Promise<string> {
		const activeTab = this.page.locator('.tabs-title.is-active a');
		return (await activeTab.textContent()) || '';
	}

	async isAccountTabActive(): Promise<boolean> {
		const activeTab = this.page.locator('.tabs-title.is-active a[href*="/account"]');
		return await activeTab.isVisible();
	}

	// Metodi di navigazione
	async openTabsDropdown() {
		await this.dropdownTrigger.click();
	}

	async closeTabsDropdown() {
		if (await this.tabsList.isVisible()) {
			await this.page.keyboard.press('Escape');
		}
	}

	async navigateToAccount() {
		if (!(await this.tabsList.isVisible())) {
			await this.openTabsDropdown();
		}
		await this.accountTab.click();
	}

	async navigateToNotificationSettings() {
		if (!(await this.tabsList.isVisible())) {
			await this.openTabsDropdown();
		}
		await this.notificationSettingsTab.click();
	}

	async navigateToMyInterests() {
		if (!(await this.tabsList.isVisible())) {
			await this.openTabsDropdown();
		}
		await this.myInterestsTab.click();
	}

	async navigateToMyData() {
		if (!(await this.tabsList.isVisible())) {
			await this.openTabsDropdown();
		}
		await this.myDataTab.click();
	}

	async navigateToDeleteAccount() {
		await this.deleteAccountTab.click();
	}

	// Metodi di verifica per la visibilità dei tab
	async isAccountTabVisible(): Promise<boolean> {
		return await this.accountTab.isVisible();
	}

	async isNotificationSettingsTabVisible(): Promise<boolean> {
		return await this.notificationSettingsTab.isVisible();
	}

	async isMyInterestsTabVisible(): Promise<boolean> {
		return await this.myInterestsTab.isVisible();
	}

	async isMyDataTabVisible(): Promise<boolean> {
		return await this.myDataTab.isVisible();
	}

	async isDeleteAccountTabVisible(): Promise<boolean> {
		return await this.deleteAccountTab.isVisible();
	}

	// Metodi utility
	async getAllTabTexts(): Promise<string[]> {
		const tabs = this.page.locator('#dropdown-menu-profile a');
		const count = await tabs.count();
		const texts: string[] = [];

		for (let i = 0; i < count; i++) {
			const text = await tabs.nth(i).textContent();
			if (text) {
				texts.push(text.trim());
			}
		}

		return texts;
	}

	async getTabHref(tabName: string): Promise<string> {
		const tab = this.page.locator(`#dropdown-menu-profile a:has-text("${tabName}")`);
		return (await tab.getAttribute('href')) || '';
	}
}
