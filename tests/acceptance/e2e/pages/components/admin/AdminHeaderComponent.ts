import { Page } from '@playwright/test';

/**
 * Component for the admin header bar functionality.
 * Handles admin-specific header elements and navigation.
 */
export class AdminHeaderComponent {
	constructor(private page: Page) {}

	// Selettori per gli elementi dell'admin bar
	private get adminBar() {
		return this.page.locator('#admin-bar');
	}

	private get adminTitle() {
		return this.page.locator('.admin-bar__title');
	}

	private get adminDashboardButton() {
		return this.page.locator('.admin-bar__button[href="/admin/"]');
	}

	private get editOrganizationButton() {
		return this.page.locator('.admin-bar__button[href="/admin/organization/edit"]');
	}

	// Metodi per verificare la visibilità degli elementi
	async isAdminBarVisible(): Promise<boolean> {
		return await this.adminBar.isVisible();
	}

	async isAdminTitleVisible(): Promise<boolean> {
		return await this.adminTitle.isVisible();
	}

	async getAdminTitleText(): Promise<string> {
		return (await this.adminTitle.textContent()) || '';
	}

	// Metodi per navigazione
	async navigateToAdminDashboard() {
		await this.adminDashboardButton.click();
	}

	async navigateToEditOrganization() {
		await this.editOrganizationButton.click();
	}

	// Metodi per verificare i pulsanti
	async isAdminDashboardButtonVisible(): Promise<boolean> {
		return await this.adminDashboardButton.isVisible();
	}

	async isEditOrganizationButtonVisible(): Promise<boolean> {
		return await this.editOrganizationButton.isVisible();
	}

	async getAdminDashboardButtonText(): Promise<string> {
		const span = this.adminDashboardButton.locator('span');
		return (await span.textContent()) || '';
	}

	async getEditOrganizationButtonText(): Promise<string> {
		const span = this.editOrganizationButton.locator('span');
		return (await span.textContent()) || '';
	}

	// Metodi per verificare la presenza delle icone SVG
	async hasAdminDashboardIcon(): Promise<boolean> {
		const svg = this.adminDashboardButton.locator('svg');
		return await svg.isVisible();
	}

	async hasEditOrganizationIcon(): Promise<boolean> {
		const svg = this.editOrganizationButton.locator('svg');
		return await svg.isVisible();
	}

	// Metodo per attendere che l'admin bar sia caricata
	async waitForAdminBarToLoad() {
		await this.adminBar.waitFor({ state: 'visible' });
	}
}
