/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Gianfranco Cedro
 * Antonio Abramo Carotenuto
 */

import { Page } from '@playwright/test';

/**
 * Component to manage the vertical tabs of the account page
 */
export class VerticalTabsComponent {
	constructor(private page: Page) {}

	// Main selectors
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

	// Selectors for individual tabs
	private get accountTab() {
		return this.page.getByRole('menuitem', { name: 'Account', exact: true });
	}

	private get notificationSettingsTab() {
		return this.page.getByRole('menuitem', { name: 'Notification settings', exact: true });
	}

	private get myInterestsTab() {
		return this.page.locator('a[href*="/user_interests"]');
	}

	private get myDataTab() {
		return this.page.getByRole('menuitem', { name: 'My data', exact: true });
	}

	private get deleteAccountTab() {
		return this.page.getByRole('menuitem', { name: 'Delete my account', exact: true });
	}

	// Verification methods
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

	// Navigation methods
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

	// Verification methods for tab visibility
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

	// Utility methods
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
