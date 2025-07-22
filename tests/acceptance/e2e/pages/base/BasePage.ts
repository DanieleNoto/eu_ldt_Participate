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
	 * Waits for the page to be fully loaded
	 */
	async waitForLoadState(state: 'load' | 'domcontentloaded' | 'networkidle' = 'networkidle'): Promise<void> {
		await this.page.waitForLoadState(state);
	}

	/**
	 * Takes a screenshot of the current page
	 * Takes a screenshot of the current page
	 */
	async takeScreenshot(name: string): Promise<void> {
		await this.page.screenshot({
			path: `test-results/screenshots/${name}-${Date.now()}.png`,
			fullPage: true
		});
	}

	/**
	 * Waits for an element to be visible
	 * Waits for an element to be visible
	 */
	async waitForElement(selector: string): Promise<void> {
		await this.page.waitForSelector(selector);
	}

	/**
	 * Fills an input field
	 * Fills an input field
	 */
	async fillInput(selector: string, value: string): Promise<void> {
		await this.page.fill(selector, value);
	}

	/**
	 * Clicks on an element
	 * Clicks on an element
	 */
	async clickElement(selector: string): Promise<void> {
		await this.page.click(selector);
	}

	/**
	 * Gets the text content of an element
	 */
	async getElementText(selector: string): Promise<string> {
		return (await this.page.textContent(selector)) || '';
	}

	/**
	 * Checks if an element is visible
	 * Checks if an element is visible
	 */
	async isElementVisible(selector: string): Promise<boolean> {
		return await this.page.isVisible(selector);
	}

	/**
	 * Automatically handles the cookie bar if present
	 * Accepts all cookies by default
	 * Automatically handles the cookie bar if present
	 * Accepts all cookies by default
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
	 * Navigates to a URL and automatically handles the cookie bar
	 * Navigates to a URL and automatically handles the cookie bar
	 */
	async navigateToAndHandleCookies(acceptType: 'all' | 'essential' = 'all'): Promise<void> {
		await this.navigateTo('/');
		await this.waitForLoadState();
		await this.handleCookieBar(acceptType);
	}

	/**
	 * Checks if the cookie bar is present
	 * Checks if the cookie bar is present
	 */
	async isCookieBarPresent(): Promise<boolean> {
		return await this.cookieBar.isCookieBarVisible();
	}

	/**
	 * Checks if the user is logged in via header
	 */
	async isUserLoggedIn(): Promise<boolean> {
		return await this.header.isUserLoggedIn();
	}

	/**
	 * Navigates to login via header
	 */
	async navigateToLogin(): Promise<void> {
		await this.header.goToLoginPage();
	}

	/**
	 * Performs logout via header
	 */
	async performLogout(): Promise<void> {
		await this.header.performLogout();
	}

	// Common flash message selectors
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
	 * Checks for the presence of a success flash message
	 * Checks for the presence of a success flash message
	 */
	async hasSuccessFlashMessage(): Promise<boolean> {
		return await this.successFlashMessage.isVisible();
	}

	/**
	 * Checks for the presence of an error flash message
	 * Checks for the presence of an error flash message
	 */
	async hasErrorFlashMessage(): Promise<boolean> {
		return await this.errorFlashMessage.isVisible();
	}

	/**
	 * Gets the text of the success flash message
	 * Gets the text of the success flash message
	 */
	async getSuccessFlashMessageText(): Promise<string> {
		return (await this.successFlashMessage.locator('.flash__message').textContent()) || '';
	}

	/**
	 * Gets the text of the error flash message
	 * Gets the text of the error flash message
	 */
	async getErrorFlashMessageText(): Promise<string> {
		return (await this.errorFlashMessage.locator('.flash__message').textContent()) || '';
	}

	/**
	 * Closes the flash message if present
	 * Closes the flash message if present
	 */
	async dismissFlashMessage(): Promise<void> {
		const closeButton = this.page.locator('.flash .close-button, .alert .close');
		if (await closeButton.isVisible()) {
			await closeButton.click();
		}
	}

	/**
	 * Waits for a success flash message to appear
	 * Waits for a success flash message to appear
	 */
	async waitForSuccessFlashMessage(): Promise<void> {
		await this.successFlashMessage.waitFor({ state: 'visible' });
	}

	/**
	 * Waits for an error flash message to appear
	 * Waits for an error flash message to appear
	 */
	async waitForErrorFlashMessage(): Promise<void> {
		await this.errorFlashMessage.waitFor({ state: 'visible' });
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
