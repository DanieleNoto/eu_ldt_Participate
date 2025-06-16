import { Page } from '@playwright/test';

export class FooterComponent {
	constructor(private page: Page) {}

	// Selettori per le sezioni del footer
	private get mainFooter() {
		return this.page.locator('.main-footer');
	}

	private get footerTop() {
		return this.page.locator('.main-footer__top');
	}

	private get footerDown() {
		return this.page.locator('.main-footer__down');
	}

	private get miniFooter() {
		return this.page.locator('.mini-footer');
	}

	// Selettori per i link di navigazione
	private get decidimNav() {
		return this.page.locator('nav[aria-label="Decidim"]');
	}

	private get accountNav() {
		return this.page.locator('nav[aria-label="Il mio account"]');
	}

	private get resourcesNav() {
		return this.page.locator('nav[aria-label="Resources"]');
	}

	private get helpNav() {
		return this.page.locator('nav[aria-label="Help"]');
	}

	private get legalNav() {
		return this.page.locator('nav[aria-label="Legal"]');
	}

	private get socialNav() {
		return this.page.locator('nav[aria-label="Social media"]');
	}

	// Selettori per il language chooser
	private get languageChooserButton() {
		return this.page.locator('#trigger-dropdown-language-chooser');
	}

	private get languageChooserDropdown() {
		return this.page.locator('#dropdown-menu-language-chooser');
	}

	// Selettori per i link specifici
	private get createAccountLink() {
		return this.page.locator('a[href*="sign_up"]').first();
	}

	private get loginLink() {
		return this.page.locator('a[href*="sign_in"]').first();
	}

	private get activitiesLink() {
		return this.page.locator('a[href*="last_activities"]');
	}

	private get meetingsLink() {
		return this.page.locator('a[href*="meetings"]');
	}

	private get openDataLink() {
		return this.page.locator('a[href*="open-data"]');
	}

	private get termsLink() {
		return this.page.locator('a[href*="terms-of-service"]');
	}

	private get cookieSettingsButton() {
		return this.page.locator('a[data-dialog-open="dc-modal"]');
	}

	private get decidimLogo() {
		return this.page.locator('.mini-footer img[alt="Logo Decidim"]');
	}

	private get creativeCommonsLink() {
		return this.page.locator('a[href*="creativecommons"]');
	}

	// Metodi per verificare la visibilità
	async isFooterVisible(): Promise<boolean> {
		return await this.mainFooter.isVisible();
	}

	async isMiniFooterVisible(): Promise<boolean> {
		return await this.miniFooter.isVisible();
	}

	// Metodi per i link di navigazione
	async clickCreateAccount() {
		await this.createAccountLink.click();
	}

	async clickLogin() {
		await this.loginLink.click();
	}

	async clickActivities() {
		await this.activitiesLink.click();
	}

	async clickMeetings() {
		await this.meetingsLink.click();
	}

	async clickOpenData() {
		await this.openDataLink.click();
	}

	async clickTermsOfService() {
		await this.termsLink.click();
	}

	async clickCookieSettings() {
		await this.cookieSettingsButton.click();
	}

	// Metodi per il language chooser
	async openLanguageChooser() {
		await this.languageChooserButton.click();
	}

	async selectLanguage(languageCode: string) {
		await this.openLanguageChooser();
		await this.page.locator(`#dropdown-menu-language-chooser a[href="/locale?locale=${languageCode}"]`).click();
	}

	async getCurrentLanguage(): Promise<string> {
		const spans = this.languageChooserButton.locator('span');
		return (await spans.nth(0).textContent()) || '';
	}

	async isLanguageChooserVisible(): Promise<boolean> {
		return await this.languageChooserButton.isVisible();
	}

	// Metodi per ottenere testi
	async getFooterDescription(): Promise<string> {
		return (await this.footerTop.locator('.prose p').first().textContent()) || '';
	}

	async getNavigationLinks(section: 'decidim' | 'account' | 'resources' | 'help'): Promise<string[]> {
		let nav;
		switch (section) {
			case 'decidim':
				nav = this.decidimNav;
				break;
			case 'account':
				nav = this.accountNav;
				break;
			case 'resources':
				nav = this.resourcesNav;
				break;
			case 'help':
				nav = this.helpNav;
				break;
		}
		return await nav.locator('ul li a').allTextContents();
	}

	// Metodi per il mini footer
	async clickDecidimLogo() {
		await this.decidimLogo.click();
	}

	async clickCreativeCommonsLink() {
		await this.creativeCommonsLink.click();
	}

	// Metodi di utilità
	async waitForFooterToLoad() {
		await this.mainFooter.waitFor({ state: 'visible' });
	}

	async scrollToFooter() {
		await this.mainFooter.scrollIntoViewIfNeeded();
	}

	async isFooterCompletelyVisible(): Promise<boolean> {
		const mainVisible = await this.isFooterVisible();
		const miniVisible = await this.isMiniFooterVisible();
		return mainVisible && miniVisible;
	}
}
