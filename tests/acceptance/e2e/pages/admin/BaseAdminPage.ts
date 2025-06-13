import { Page, expect } from '@playwright/test';
import { LoginPage } from '../auth/LoginPage';
import { AuthenticatedPage } from '../base/AuthenticatedPage';

export class BaseAdminPage extends AuthenticatedPage {
	protected loginPage: LoginPage;

	constructor(page: Page) {
		super(page);
		this.loginPage = new LoginPage(page);
	}

	// Navigation methods
	async navigateToAdminDashboard() {
		await this.page.goto('/');
		await this.page.getByRole('link', { name: 'Admin dashboard' }).click();
	}

	async navigateToSettings() {
		await this.page.goto('/admin/');
		await this.page.getByRole('link', { name: 'Settings' }).click();
	}

	// Login workflow for admin
	async performAdminLogin() {
		await this.loginPage.goToThisPage();
		const isSignedIn = await this.loginPage.checkAdminAlreadySignIn();
		if (!isSignedIn) {
			await this.loginPage.loginAsAdmin();
		}
		await this.navigateToAdminDashboard();
	}

	// Utility methods for admin pages
	async getCurrentUrl(): Promise<string> {
		return this.page.url();
	}

	async waitForUrl(pattern: RegExp, timeout: number = 30000): Promise<void> {
		await this.page.waitForURL(pattern, { timeout });
	}

	async expectUrl(pattern: RegExp): Promise<void> {
		await expect(this.page).toHaveURL(pattern);
	}

	async getTextBySelector(text: string): Promise<any> {
		return this.page.getByText(text);
	}

	async waitForTimeout(ms: number): Promise<void> {
		await this.page.waitForTimeout(ms);
	}

	async getLocator(selector: string, options?: any): Promise<any> {
		return this.page.locator(selector, options);
	}

	// Session management
	async isSessionExpired(): Promise<boolean> {
		return (
			(await this.page.locator('text=Session expired').isVisible()) ||
			(await this.page.url().includes('/users/sign_in'))
		);
	}

	// Error handling
	async waitForErrorMessage() {
		return await this.page.waitForSelector('[role="alert"], .alert-danger, .error-message');
	}

	async getErrorMessage() {
		const errorElement = await this.page.locator('[role="alert"], .alert-danger, .error-message').first();
		return await errorElement.textContent();
	}

	async getValidationErrors(): Promise<string[]> {
		const validationSelectors = '.form-error';
		await this.page.waitForTimeout(1000); // Wait for validation to appear
		const errors = await this.page.locator(validationSelectors).all();
		const errorTexts: string[] = [];

		for (const error of errors) {
			const text = await error.textContent();
			if (text) {
				errorTexts.push(text.trim());
			}
		}

		return errorTexts;
	}

	// Form helpers
	async getTextbox(name: string) {
		return this.page.getByRole('textbox', { name });
	}

	async getSpinbutton(name: string) {
		return this.page.getByRole('spinbutton', { name });
	}

	async getButton(name: string) {
		return this.page.getByRole('button', { name });
	}

	async getLink(name: string) {
		return this.page.getByRole('link', { name });
	}

	async getCheckbox(name: string) {
		return this.page.getByRole('checkbox', { name });
	}

	async getRadio(name: string) {
		return this.page.getByRole('radio', { name });
	}
}
