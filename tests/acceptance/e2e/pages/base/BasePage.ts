import { Page } from '@playwright/test';
import { CookieBarComponent } from '../components/common/CookieBarComponent';
import { HeaderComponent } from '../components/common/HeaderComponent';

/**
 * Base class for all Page Object Models.
 * Provides common functionality shared across all pages.
 */
export abstract class BasePage {
	public cookieBar: CookieBarComponent;
	public header: HeaderComponent;

	constructor(protected page: Page) {
		this.cookieBar = new CookieBarComponent(page);
		this.header = new HeaderComponent(page);
	}

	/**
	 * Navigates to specified URL
	 */
	async navigateTo(url: string): Promise<void> {
		await this.page.goto(url);
	}

	/**
	 * Attende il caricamento completo della pagina
	 */
	async waitForLoadState(state: 'load' | 'domcontentloaded' | 'networkidle' = 'networkidle'): Promise<void> {
		await this.page.waitForLoadState(state);
	}

	/**
	 * Prende uno screenshot della pagina corrente
	 */
	async takeScreenshot(name: string): Promise<void> {
		await this.page.screenshot({
			path: `test-results/screenshots/${name}-${Date.now()}.png`,
			fullPage: true
		});
	}

	/**
	 * Attende che un elemento sia visibile
	 */
	async waitForElement(selector: string, timeout: number = 30000): Promise<void> {
		await this.page.waitForSelector(selector, { timeout });
	}

	/**
	 * Riempie un campo di input
	 */
	async fillInput(selector: string, value: string): Promise<void> {
		await this.page.fill(selector, value);
	}

	/**
	 * Clicca su un elemento
	 */
	async clickElement(selector: string): Promise<void> {
		await this.page.click(selector);
	}

	/**
	 * Ottiene il testo di un elemento
	 */
	async getElementText(selector: string): Promise<string> {
		return (await this.page.textContent(selector)) || '';
	}

	/**
	 * Verifica se un elemento è visibile
	 */
	async isElementVisible(selector: string): Promise<boolean> {
		return await this.page.isVisible(selector);
	}

	/**
	 * Gestisce automaticamente la cookie bar se presente
	 * Accetta tutti i cookie per default
	 */
	async handleCookieBar(acceptType: 'all' | 'essential' = 'all'): Promise<void> {
		if (await this.cookieBar.isCookieBarVisible()) {
			if (acceptType === 'all') {
				await this.cookieBar.acceptAllAndWait();
			} else {
				await this.cookieBar.acceptEssentialAndWait();
			}
		}
	}

	/**
	 * Naviga a una URL e gestisce automaticamente la cookie bar
	 */
	async navigateToAndHandleCookies(url: string, acceptType: 'all' | 'essential' = 'all'): Promise<void> {
		await this.navigateTo(url);
		await this.waitForLoadState();
		await this.handleCookieBar(acceptType);
	}

	/**
	 * Verifica se la cookie bar è presente
	 */
	async isCookieBarPresent(): Promise<boolean> {
		return await this.cookieBar.isCookieBarVisible();
	}

	/**
	 * Verifica se l'utente è loggato tramite header
	 */
	async isUserLoggedIn(): Promise<boolean> {
		return await this.header.isUserLoggedIn();
	}

	/**
	 * Naviga al login tramite header
	 */
	async navigateToLogin(): Promise<void> {
		await this.header.goToLoginPage();
	}

	/**
	 * Esegue il logout tramite header
	 */
	async performLogout(): Promise<void> {
		await this.header.performLogout();
	}

	// Selettori per flash messages comuni
	private get flashMessagesContainer() {
		return this.page.locator('#flash-messages-container, .flash-messages');
	}

	private get successFlashMessage() {
		return this.page.locator('.flash.success, .alert.alert-success');
	}

	private get errorFlashMessage() {
		return this.page.locator('.flash.error, .alert.alert-error, .flash.alert');
	}

	/**
	 * Verifica presenza di flash message di successo
	 */
	async hasSuccessFlashMessage(): Promise<boolean> {
		return await this.successFlashMessage.isVisible();
	}

	/**
	 * Verifica presenza di flash message di errore
	 */
	async hasErrorFlashMessage(): Promise<boolean> {
		return await this.errorFlashMessage.isVisible();
	}

	/**
	 * Ottiene il testo del flash message di successo
	 */
	async getSuccessFlashMessageText(): Promise<string> {
		return (await this.successFlashMessage.locator('.flash__message').textContent()) || '';
	}

	/**
	 * Ottiene il testo del flash message di errore
	 */
	async getErrorFlashMessageText(): Promise<string> {
		return (await this.errorFlashMessage.locator('.flash__message').textContent()) || '';
	}

	/**
	 * Chiude il flash message se presente
	 */
	async dismissFlashMessage(): Promise<void> {
		const closeButton = this.page.locator('.flash .close-button, .alert .close');
		if (await closeButton.isVisible()) {
			await closeButton.click();
		}
	}

	/**
	 * Attende la comparsa di un flash message di successo
	 */
	async waitForSuccessFlashMessage(timeout: number = 10000): Promise<void> {
		await this.successFlashMessage.waitFor({ state: 'visible', timeout });
	}

	/**
	 * Attende la comparsa di un flash message di errore
	 */
	async waitForErrorFlashMessage(timeout: number = 10000): Promise<void> {
		await this.errorFlashMessage.waitFor({ state: 'visible', timeout });
	}

	// Cookie management (deprecated - use cookieBar component methods instead)
	/**
	 * @deprecated Use handleCookieBar() or cookieBar.acceptAllAndWait() instead
	 */
	async acceptCookies() {
		await this.handleCookieBar('all');
	}

	/**
	 * Gets the page instance for direct Playwright API access
	 */
	public getPage(): Page {
		return this.page;
	}
}
