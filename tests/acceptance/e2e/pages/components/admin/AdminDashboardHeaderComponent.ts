/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Gianfranco Cedro
 */

import { Page } from '@playwright/test';

/**
 * Component for the breadcrumb and title of the admin dashboard.
 * Manages breadcrumb navigation and the page title.
 */
export class AdminDashboardHeaderComponent {
	constructor(private page: Page) {}

	// Main selectors
	private get processTitle() {
		return this.page.locator('.process-title');
	}

	private get breadcrumbContainer() {
		return this.processTitle.locator('.process-title-content');
	}

	private get homeLink() {
		return this.breadcrumbContainer.locator('.process-title-content-icon-home');
	}

	private get dashboardHeader() {
		return this.page.locator('.item_show__header');
	}

	private get dashboardTitle() {
		return this.dashboardHeader.locator('.item_show__header-title');
	}

	private get calloutWrapper() {
		return this.page.locator('[data-callout-wrapper]');
	}

	// Verification methods
	async isBreadcrumbVisible(): Promise<boolean> {
		return await this.processTitle.isVisible();
	}

	async isHomeIconVisible(): Promise<boolean> {
		return await this.homeLink.isVisible();
	}

	async isDashboardHeaderVisible(): Promise<boolean> {
		return await this.dashboardHeader.isVisible();
	}

	async isDashboardTitleVisible(): Promise<boolean> {
		return await this.dashboardTitle.isVisible();
	}

	// Methods to get text
	async getDashboardTitle(): Promise<string> {
		return (await this.dashboardTitle.textContent()) || '';
	}

	async getHomeIconAriaLabel(): Promise<string> {
		return (await this.homeLink.getAttribute('aria-label')) || '';
	}

	async getHomeIconHref(): Promise<string> {
		return (await this.homeLink.getAttribute('href')) || '';
	}

	// Interaction methods
	async clickHomeIcon(): Promise<void> {
		await this.homeLink.click();
	}

	// Methods to check breadcrumb state
	async isBreadcrumbFullyLoaded(): Promise<boolean> {
		const breadcrumbVisible = await this.isBreadcrumbVisible();
		const homeIconVisible = await this.isHomeIconVisible();

		return breadcrumbVisible && homeIconVisible;
	}

	// Methods to check header state
	async isHeaderFullyLoaded(): Promise<boolean> {
		const headerVisible = await this.isDashboardHeaderVisible();
		const titleVisible = await this.isDashboardTitleVisible();

		return headerVisible && titleVisible;
	}

	// Methods to check for callout/notifications presence
	async hasCalloutNotifications(): Promise<boolean> {
		return await this.calloutWrapper.isVisible();
	}

	async getCalloutContent(): Promise<string> {
		if (await this.hasCalloutNotifications()) {
			return (await this.calloutWrapper.textContent()) || '';
		}
		return '';
	}

	// Check if the entire header section is loaded
	async isComponentFullyLoaded(): Promise<boolean> {
		const breadcrumbLoaded = await this.isBreadcrumbFullyLoaded();
		const headerLoaded = await this.isHeaderFullyLoaded();

		return breadcrumbLoaded && headerLoaded;
	}
}
