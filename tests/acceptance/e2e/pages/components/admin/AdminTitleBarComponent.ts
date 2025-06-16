import { Page } from '@playwright/test';

/**
 * Component per la barra del titolo dell'area admin.
 * Gestisce il nome dell'organizzazione, il pulsante "See site",
 * il dropdown delle lingue e il menu utente.
 */
export class AdminTitleBarComponent {
	constructor(private page: Page) {}

	// Selettori principali
	private get titleBar() {
		return this.page.locator('.title-bar').first();
	}

	private get layoutContainer() {
		return this.page.locator('.layout-content__container');
	}

	private get organizationName() {
		return this.page.locator('.font-semibold.text-sm');
	}

	private get toolBar() {
		return this.page.locator('.tool-bar');
	}

	// Selettori per il pulsante "See site"
	private get seeSiteButton() {
		return this.page.locator('.button__site');
	}

	// Selettori per il dropdown delle lingue
	private get languageDropdown() {
		return this.page.locator('admin-dropdown-menu-language .dropdown');
	}

	private get languageTrigger() {
		return this.page.locator('#admin-menu-trigger');
	}

	private get languageDropdownMenu() {
		return this.page.locator('#admin-dropdown-menu-language, #admin-dropdown-menu-language-responsive');
	}

	// Selettori per il menu utente
	private get userLogin() {
		return this.page.locator('.user-login');
	}

	private get userDropdownTrigger() {
		return this.page.locator('#admin-dropdown-menu-login-trigger, #admin-dropdown-menu-login-trigger-responsive');
	}

	private get userDropdownMenu() {
		return this.page.locator('#admin-dropdown-menu-login, #admin-dropdown-menu-login-responsive');
	}

	private get logoutLink() {
		return this.page.locator('a[href*="/users/sign_out"]').first();
	}

	// Selettori per il menu mobile
	private get menuTrigger() {
		return this.page.locator('.menu-trigger');
	}

	// Metodi di verifica
	async isTitleBarVisible(): Promise<boolean> {
		return await this.titleBar.isVisible();
	}

	async isOrganizationNameVisible(): Promise<boolean> {
		return await this.organizationName.isVisible();
	}

	async isToolBarVisible(): Promise<boolean> {
		return await this.toolBar.isVisible();
	}

	async isSeeSiteButtonVisible(): Promise<boolean> {
		return await this.seeSiteButton.isVisible();
	}

	async isLanguageDropdownVisible(): Promise<boolean> {
		return await this.languageDropdown.isVisible();
	}

	async isUserLoginVisible(): Promise<boolean> {
		return await this.userLogin.isVisible();
	}

	async isMenuTriggerVisible(): Promise<boolean> {
		return await this.menuTrigger.isVisible();
	}

	// Metodi per ottenere testo
	async getOrganizationName(): Promise<string> {
		return (await this.organizationName.textContent()) || '';
	}

	async getCurrentLanguage(): Promise<string> {
		return (await this.languageTrigger.textContent()) || '';
	}

	async getCurrentUserEmail(): Promise<string> {
		const userText = (await this.userDropdownTrigger.textContent()) || '';
		// Rimuove l'icona arrow e spazi extra
		return userText.replace(/\s*$/g, '').replace(/^\s*/, '');
	}

	// Metodi di interazione
	async clickSeeSite(): Promise<void> {
		await this.seeSiteButton.click();
	}

	async openLanguageDropdown(): Promise<void> {
		await this.languageTrigger.click();
	}

	async closeLanguageDropdown(): Promise<void> {
		// Click outside to close
		await this.organizationName.click();
	}

	async selectLanguage(languageCode: string): Promise<void> {
		await this.openLanguageDropdown();
		await this.page.locator(`a[href*="locale=${languageCode}"]`).click();
	}

	async openUserDropdown(): Promise<void> {
		await this.userDropdownTrigger.click();
	}

	async closeUserDropdown(): Promise<void> {
		// Click outside to close
		await this.organizationName.click();
	}

	async logout(): Promise<void> {
		await this.openUserDropdown();
		await this.logoutLink.click();
	}

	async clickMenuTrigger(): Promise<void> {
		await this.menuTrigger.click();
	}

	// Verifica dropdown states
	async isLanguageDropdownOpen(): Promise<boolean> {
		return await this.languageDropdownMenu.isVisible();
	}

	async isUserDropdownOpen(): Promise<boolean> {
		return await this.userDropdownMenu.isVisible();
	}

	// Metodi per ottenere le opzioni disponibili
	async getAvailableLanguages(): Promise<string[]> {
		await this.openLanguageDropdown();
		const options = await this.languageDropdownMenu.locator('.dropdown__item a').all();
		const languages: string[] = [];

		for (const option of options) {
			const text = await option.textContent();
			if (text) {
				languages.push(text.trim());
			}
		}

		await this.closeLanguageDropdown();
		return languages;
	}

	// Verifica se una lingua specifica è disponibile
	async isLanguageAvailable(languageName: string): Promise<boolean> {
		const languages = await this.getAvailableLanguages();
		return languages.includes(languageName);
	}
}
