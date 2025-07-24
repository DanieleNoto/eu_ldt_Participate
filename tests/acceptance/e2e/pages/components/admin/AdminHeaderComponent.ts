import { Page } from '@playwright/test';

/**
 * Component for the admin header bar functionality.
 * Handles admin-specific header elements and navigation.
 */
export class AdminHeaderComponent {
	constructor(private page: Page) {}

	// Selectors for admin bar elements
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

	// Methods to check element visibility
	async isAdminBarVisible(): Promise<boolean> {
		return await this.adminBar.isVisible();
	}

	async isAdminTitleVisible(): Promise<boolean> {
		return await this.adminTitle.isVisible();
	}

	async getAdminTitleText(): Promise<string> {
		return (await this.adminTitle.textContent()) || '';
	}

	// Navigation methods
	async navigateToAdminDashboard() {
		await this.adminDashboardButton.click();
	}

	async navigateToEditOrganization() {
		await this.editOrganizationButton.click();
	}

	// Methods to check buttons
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

	// Methods to check for SVG icons presence
	async hasAdminDashboardIcon(): Promise<boolean> {
		const svg = this.adminDashboardButton.locator('svg');
		return await svg.isVisible();
	}

	async hasEditOrganizationIcon(): Promise<boolean> {
		const svg = this.editOrganizationButton.locator('svg');
		return await svg.isVisible();
	}

	// Method to wait for the admin bar to load
	async waitForAdminBarToLoad() {
		await this.adminBar.waitFor({ state: 'visible' });
	}
}
