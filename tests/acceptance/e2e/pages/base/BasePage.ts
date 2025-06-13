import { Page } from '@playwright/test';

/**
 * Base class for all Page Object Models.
 * Provides common functionality shared across all pages.
 */
export abstract class BasePage {
	constructor(protected page: Page) {}

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

	// Cookie management
	async acceptCookies() {
		const cookiesButton = this.page.getByRole('button', { name: /Accept all/i });
		if (await cookiesButton.isVisible()) {
			await cookiesButton.click();
		}
	}
}
