/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Gianfranco Cedro
 */

import { Page } from '@playwright/test';

/**
 * Component for the participation metrics card in the admin dashboard.
 * Manages the display of metrics and the link for more details.
 */
export class AdminMetricsCardComponent {
	constructor(private page: Page) {}

	// Main selectors
	private get metricsCard() {
		return this.page.locator('.card').filter({ hasText: 'Participation in numbers' });
	}

	private get cardTitle() {
		return this.metricsCard.locator('.card-title');
	}

	private get metricsContainer() {
		return this.metricsCard.locator('.metric__container');
	}

	private get metricItems() {
		return this.metricsContainer.locator('.metric');
	}

	private get viewDetailsLink() {
		return this.page.locator('a[href*="/admin/metrics"]');
	}

	// Verification methods
	async isMetricsCardVisible(): Promise<boolean> {
		return await this.metricsCard.isVisible();
	}

	async isMetricsContainerVisible(): Promise<boolean> {
		return await this.metricsContainer.isVisible();
	}

	async isViewDetailsLinkVisible(): Promise<boolean> {
		return await this.viewDetailsLink.isVisible();
	}

	async getCardTitle(): Promise<string> {
		return (await this.cardTitle.textContent()) || '';
	}

	// Methods for metrics
	async getMetricsCount(): Promise<number> {
		return await this.metricItems.count();
	}

	async hasMetrics(): Promise<boolean> {
		const count = await this.getMetricsCount();
		return count > 0;
	}

	// Interaction methods
	async clickViewDetails(): Promise<void> {
		await this.viewDetailsLink.click();
	}

	async getViewDetailsLinkText(): Promise<string> {
		return (await this.viewDetailsLink.textContent()) || '';
	}

	async getViewDetailsLinkHref(): Promise<string> {
		return (await this.viewDetailsLink.getAttribute('href')) || '';
	}

	// Methods to check the card state
	async isCardFullyLoaded(): Promise<boolean> {
		const cardVisible = await this.isMetricsCardVisible();
		const containerVisible = await this.isMetricsContainerVisible();
		const linkVisible = await this.isViewDetailsLinkVisible();

		return cardVisible && containerVisible && linkVisible;
	}
}
