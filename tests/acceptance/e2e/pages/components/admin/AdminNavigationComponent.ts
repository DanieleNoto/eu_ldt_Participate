import { Page } from '@playwright/test';

/**
 * Component for the admin area side navigation.
 * Manages logo, main menu, and secondary menu.
 */
export class AdminNavigationComponent {
	constructor(private page: Page) {}

	// Main selectors
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

	// Selectors for main modules
	private get processesLink() {
		return this.page.locator('.layout-nav nav a[href*="/admin/participatory_processes"]');
	}

	private get assembliesLink() {
		return this.page.locator('.layout-nav nav a[href*="/admin/assemblies"]');
	}

	// Selectors for the secondary menu
	private get moderationLink() {
		return this.page.locator('.layout-nav nav a[href*="/admin/moderations"]');
	}

	private get pagesLink() {
		return this.page.locator('.layout-nav nav a[href*="/admin/static_pages"]');
	}

	private get usersLink() {
		return this.page.locator('.layout-nav nav a[href*="/admin/users"]');
	}

	private get newslettersLink() {
		return this.page.locator('.layout-nav nav a[href*="/admin/newsletters"]');
	}

	private get settingsLink() {
		return this.page.locator('.layout-nav nav a[href*="/admin/organization/edit"]');
	}

	private get logsLink() {
		return this.page.locator('.layout-nav nav a[href*="/admin/logs"]');
	}

	private get templatesLink() {
		return this.page.locator('.layout-nav nav a[href*="/admin/templates"]');
	}

	// Verification methods
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

	// Navigation methods - Main modules
	async navigateToProcesses(): Promise<void> {
		await this.processesLink.click();
	}

	async navigateToAssemblies(): Promise<void> {
		await this.assembliesLink.click();
	}

	// Navigation methods - Secondary menu
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

	async navigateToTemplates(): Promise<void> {
		await this.templatesLink.click();
	}

	// Navigation via logo
	async clickLogo(): Promise<void> {
		await this.logo.click();
	}

	// Active link verification
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

	async isTemplatesLinkVisible(): Promise<boolean> {
		return await this.templatesLink.isVisible();
	}

	// Get link texts
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

	async getTemplatesLinkText(): Promise<string> {
		return (await this.templatesLink.textContent()) || '';
	}
}
