import { Page } from '@playwright/test';

/**
 * Component per la card delle metriche di partecipazione nella dashboard admin.
 * Gestisce la visualizzazione delle metriche e il link per ulteriori dettagli.
 */
export class AdminMetricsCardComponent {
	constructor(private page: Page) {}

	// Selettori principali
	private get metricsCard() {
		return this.page.locator('.card').filter({ hasText: 'Partecipazione in cifre' });
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

	// Metodi di verifica
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

	// Metodi per le metriche
	async getMetricsCount(): Promise<number> {
		return await this.metricItems.count();
	}

	async hasMetrics(): Promise<boolean> {
		const count = await this.getMetricsCount();
		return count > 0;
	}

	// Metodi per interazione
	async clickViewDetails(): Promise<void> {
		await this.viewDetailsLink.click();
	}

	async getViewDetailsLinkText(): Promise<string> {
		return (await this.viewDetailsLink.textContent()) || '';
	}

	async getViewDetailsLinkHref(): Promise<string> {
		return (await this.viewDetailsLink.getAttribute('href')) || '';
	}

	// Metodi per verificare lo stato della card
	async isCardFullyLoaded(): Promise<boolean> {
		const cardVisible = await this.isMetricsCardVisible();
		const containerVisible = await this.isMetricsContainerVisible();
		const linkVisible = await this.isViewDetailsLinkVisible();

		return cardVisible && containerVisible && linkVisible;
	}
}
