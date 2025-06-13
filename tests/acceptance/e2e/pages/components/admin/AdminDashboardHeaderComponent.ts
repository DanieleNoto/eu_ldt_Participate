import { Page } from '@playwright/test';

/**
 * Component per la breadcrumb e il titolo della dashboard admin.
 * Gestisce la navigazione breadcrumb e il titolo della pagina.
 */
export class AdminDashboardHeaderComponent {
	constructor(private page: Page) {}

	// Selettori principali
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

	// Metodi di verifica
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

	// Metodi per ottenere testo
	async getDashboardTitle(): Promise<string> {
		return (await this.dashboardTitle.textContent()) || '';
	}

	async getHomeIconAriaLabel(): Promise<string> {
		return (await this.homeLink.getAttribute('aria-label')) || '';
	}

	async getHomeIconHref(): Promise<string> {
		return (await this.homeLink.getAttribute('href')) || '';
	}

	// Metodi di interazione
	async clickHomeIcon(): Promise<void> {
		await this.homeLink.click();
	}

	// Metodi per verificare lo stato della breadcrumb
	async isBreadcrumbFullyLoaded(): Promise<boolean> {
		const breadcrumbVisible = await this.isBreadcrumbVisible();
		const homeIconVisible = await this.isHomeIconVisible();

		return breadcrumbVisible && homeIconVisible;
	}

	// Metodi per verificare lo stato del header
	async isHeaderFullyLoaded(): Promise<boolean> {
		const headerVisible = await this.isDashboardHeaderVisible();
		const titleVisible = await this.isDashboardTitleVisible();

		return headerVisible && titleVisible;
	}

	// Metodi per verificare la presenza di callout/notifiche
	async hasCalloutNotifications(): Promise<boolean> {
		return await this.calloutWrapper.isVisible();
	}

	async getCalloutContent(): Promise<string> {
		if (await this.hasCalloutNotifications()) {
			return (await this.calloutWrapper.textContent()) || '';
		}
		return '';
	}

	// Verifica se l'intera sezione header è caricata
	async isComponentFullyLoaded(): Promise<boolean> {
		const breadcrumbLoaded = await this.isBreadcrumbFullyLoaded();
		const headerLoaded = await this.isHeaderFullyLoaded();

		return breadcrumbLoaded && headerLoaded;
	}
}
