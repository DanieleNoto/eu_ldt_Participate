import { Page } from '@playwright/test';

export class CookieBarComponent {
	constructor(private page: Page) {}

	// Selettori per gli elementi della cookie bar
	private get cookieBar() {
		return this.page.locator('.cookies');
	}

	private get cookieBarLeft() {
		return this.page.locator('.cookies__left');
	}

	private get cookieBarRight() {
		return this.page.locator('.cookies__right');
	}

	private get cookieTitle() {
		return this.page.locator('.cookies__left .h5');
	}

	private get cookieDescription() {
		return this.page.locator('.cookies__left p');
	}

	private get acceptAllButton() {
		return this.page.locator('#dc-dialog-accept');
	}

	private get acceptEssentialButton() {
		return this.page.locator('#dc-dialog-reject');
	}

	private get settingsButton() {
		return this.page.locator('#dc-dialog-settings');
	}

	// Metodi per verificare la visibilità degli elementi
	async isCookieBarVisible(): Promise<boolean> {
		return await this.cookieBar.isVisible();
	}

	async isCookieTitleVisible(): Promise<boolean> {
		return await this.cookieTitle.isVisible();
	}

	async isCookieDescriptionVisible(): Promise<boolean> {
		return await this.cookieDescription.isVisible();
	}

	async areAllButtonsVisible(): Promise<boolean> {
		const acceptAll = await this.acceptAllButton.isVisible();
		const acceptEssential = await this.acceptEssentialButton.isVisible();
		const settings = await this.settingsButton.isVisible();
		return acceptAll && acceptEssential && settings;
	}

	// Metodi per ottenere il testo degli elementi
	async getCookieTitleText(): Promise<string> {
		return (await this.cookieTitle.textContent()) || '';
	}

	async getCookieDescriptionText(): Promise<string> {
		return (await this.cookieDescription.textContent()) || '';
	}

	async getAcceptAllButtonText(): Promise<string> {
		return (await this.acceptAllButton.textContent()) || '';
	}

	async getAcceptEssentialButtonText(): Promise<string> {
		return (await this.acceptEssentialButton.textContent()) || '';
	}

	async getSettingsButtonText(): Promise<string> {
		return (await this.settingsButton.textContent()) || '';
	}

	// Metodi per le azioni sui pulsanti
	async clickAcceptAll() {
		await this.acceptAllButton.click();
	}

	async clickAcceptEssential() {
		await this.acceptEssentialButton.click();
	}

	async clickSettings() {
		await this.settingsButton.click();
	}

	// Metodi per verificare lo stato dei pulsanti
	async isAcceptAllButtonEnabled(): Promise<boolean> {
		return await this.acceptAllButton.isEnabled();
	}

	async isAcceptEssentialButtonEnabled(): Promise<boolean> {
		return await this.acceptEssentialButton.isEnabled();
	}

	async isSettingsButtonEnabled(): Promise<boolean> {
		return await this.settingsButton.isEnabled();
	}

	// Metodi per verificare gli attributi specifici
	async hasSettingsButtonDialogAttribute(): Promise<boolean> {
		const ariaHasPopup = await this.settingsButton.getAttribute('aria-haspopup');
		const dataDialogOpen = await this.settingsButton.getAttribute('data-dialog-open');
		return ariaHasPopup === 'dialog' && dataDialogOpen === 'dc-modal';
	}

	// Metodi di utilità
	async waitForCookieBarToLoad() {
		await this.cookieBar.waitFor({ state: 'visible' });
	}

	async waitForCookieBarToDisappear() {
		await this.cookieBar.waitFor({ state: 'hidden' });
	}

	// Metodo per verificare che la cookie bar sia completamente caricata
	async isCookieBarFullyLoaded(): Promise<boolean> {
		const barVisible = await this.isCookieBarVisible();
		const titleVisible = await this.isCookieTitleVisible();
		const descriptionVisible = await this.isCookieDescriptionVisible();
		const buttonsVisible = await this.areAllButtonsVisible();

		return barVisible && titleVisible && descriptionVisible && buttonsVisible;
	}

	// Metodo per accettare i cookie e attendere che la bar scompaia
	async acceptAllAndWait() {
		await this.clickAcceptAll();
		await this.waitForCookieBarToDisappear();
	}

	// Metodo per accettare solo i cookie essenziali e attendere che la bar scompaia
	async acceptEssentialAndWait() {
		await this.clickAcceptEssential();
		await this.waitForCookieBarToDisappear();
	}
}
