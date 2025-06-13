import { Page } from '@playwright/test';

/**
 * Component per la navigazione laterale dell'area admin.
 * Gestisce logo, menu principale e menu secondario.
 */
export class AdminNavigationComponent {
	constructor(private page: Page) {}

	// Selettori principali
	private get navigationContainer() {
		return this.page.locator('.layout-nav');
	}

	private get logo() {
		return this.page.locator('.logo');
	}

	private get mainNav() {
		return this.page.locator('.main-nav').first();
	}

	private get secondaryNav() {
		return this.page.locator('.main-nav').nth(1);
	}

	// Selettori per i moduli principali
	private get processesLink() {
		return this.page.locator('a[href*="/admin/participatory_processes"]');
	}

	private get assembliesLink() {
		return this.page.locator('a[href*="/admin/assemblies"]');
	}

	// Selettori per il menu secondario
	private get moderationLink() {
		return this.page.locator('a[href*="/admin/moderations"]');
	}

	private get pagesLink() {
		return this.page.locator('a[href*="/admin/static_pages"]');
	}

	private get usersLink() {
		return this.page.locator('a[href*="/admin/users"]');
	}

	private get newslettersLink() {
		return this.page.locator('a[href*="/admin/newsletters"]');
	}

	private get settingsLink() {
		return this.page.locator('a[href*="/admin/organization/edit"]');
	}

	private get logsLink() {
		return this.page.locator('a[href*="/admin/logs"]');
	}

	// Metodi di verifica
	async isNavigationVisible(): Promise<boolean> {
		return await this.navigationContainer.isVisible();
	}

	async isLogoVisible(): Promise<boolean> {
		return await this.logo.isVisible();
	}

	async isMainNavVisible(): Promise<boolean> {
		return await this.mainNav.isVisible();
	}

	async isSecondaryNavVisible(): Promise<boolean> {
		return await this.secondaryNav.isVisible();
	}

	// Metodi di navigazione - Moduli principali
	async navigateToProcesses(): Promise<void> {
		await this.processesLink.click();
	}

	async navigateToAssemblies(): Promise<void> {
		await this.assembliesLink.click();
	}

	// Metodi di navigazione - Menu secondario
	async navigateToModeration(): Promise<void> {
		await this.moderationLink.click();
	}

	async navigateToPages(): Promise<void> {
		await this.pagesLink.click();
	}

	async navigateToUsers(): Promise<void> {
		await this.usersLink.click();
	}

	async navigateToNewsletters(): Promise<void> {
		await this.newslettersLink.click();
	}

	async navigateToSettings(): Promise<void> {
		await this.settingsLink.click();
	}

	async navigateToLogs(): Promise<void> {
		await this.logsLink.click();
	}

	// Metodi di navigazione tramite logo
	async clickLogo(): Promise<void> {
		await this.logo.click();
	}

	// Verifica dei link attivi
	async isProcessesLinkVisible(): Promise<boolean> {
		return await this.processesLink.isVisible();
	}

	async isAssembliesLinkVisible(): Promise<boolean> {
		return await this.assembliesLink.isVisible();
	}

	async isModerationLinkVisible(): Promise<boolean> {
		return await this.moderationLink.isVisible();
	}

	async isPagesLinkVisible(): Promise<boolean> {
		return await this.pagesLink.isVisible();
	}

	async isUsersLinkVisible(): Promise<boolean> {
		return await this.usersLink.isVisible();
	}

	async isNewslettersLinkVisible(): Promise<boolean> {
		return await this.newslettersLink.isVisible();
	}

	async isSettingsLinkVisible(): Promise<boolean> {
		return await this.settingsLink.isVisible();
	}

	async isLogsLinkVisible(): Promise<boolean> {
		return await this.logsLink.isVisible();
	}

	// Ottieni testo dei link
	async getProcessesLinkText(): Promise<string> {
		return (await this.processesLink.textContent()) || '';
	}

	async getAssembliesLinkText(): Promise<string> {
		return (await this.assembliesLink.textContent()) || '';
	}

	async getModerationLinkText(): Promise<string> {
		return (await this.moderationLink.textContent()) || '';
	}

	async getPagesLinkText(): Promise<string> {
		return (await this.pagesLink.textContent()) || '';
	}

	async getUsersLinkText(): Promise<string> {
		return (await this.usersLink.textContent()) || '';
	}

	async getNewslettersLinkText(): Promise<string> {
		return (await this.newslettersLink.textContent()) || '';
	}

	async getSettingsLinkText(): Promise<string> {
		return (await this.settingsLink.textContent()) || '';
	}

	async getLogsLinkText(): Promise<string> {
		return (await this.logsLink.textContent()) || '';
	}
}
