import { Page, expect } from '@playwright/test';
import { AuthenticatedPage } from '../../base/AuthenticatedPage';
import { AdminNavigationComponent } from '../../components/admin/AdminNavigationComponent';
import { AdminTitleBarComponent } from '../../components/admin/AdminTitleBarComponent';
import { LoginPage } from '../auth/LoginPage';

export class BaseAdminPage extends AuthenticatedPage {
	protected loginPage: LoginPage;
	protected adminNavigation: AdminNavigationComponent;
	public adminTitleBar: AdminTitleBarComponent;

	constructor(page: Page) {
		super(page);
		this.loginPage = new LoginPage(page);
		this.adminNavigation = new AdminNavigationComponent(page);
		this.adminTitleBar = new AdminTitleBarComponent(page);
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

	// Admin layout verification methods
	async isAdminLayoutLoaded(): Promise<boolean> {
		const navigationLoaded = await this.adminNavigation.isNavigationVisible();
		const titleBarLoaded = await this.adminTitleBar.isTitleBarVisible();
		const adminBarLoaded = await this.isAdminBarVisible();

		return navigationLoaded && titleBarLoaded && adminBarLoaded;
	}

	// Navigation methods using components
	async navigateViaAdminNav(
		section: 'processes' | 'assemblies' | 'moderation' | 'pages' | 'users' | 'newsletters' | 'settings' | 'logs'
	): Promise<void> {
		switch (section) {
			case 'processes':
				await this.adminNavigation.navigateToProcesses();
				break;
			case 'assemblies':
				await this.adminNavigation.navigateToAssemblies();
				break;
			case 'moderation':
				await this.adminNavigation.navigateToModeration();
				break;
			case 'pages':
				await this.adminNavigation.navigateToPages();
				break;
			case 'users':
				await this.adminNavigation.navigateToUsers();
				break;
			case 'newsletters':
				await this.adminNavigation.navigateToNewsletters();
				break;
			case 'settings':
				await this.adminNavigation.navigateToSettings();
				break;
			case 'logs':
				await this.adminNavigation.navigateToLogs();
				break;
		}
	}

	// Title bar interaction methods
	async getOrganizationName(): Promise<string> {
		return await this.adminTitleBar.getOrganizationName();
	}

	async getCurrentAdminUser(): Promise<string> {
		return await this.adminTitleBar.getCurrentUserEmail();
	}

	async changeLanguage(languageCode: string): Promise<void> {
		await this.adminTitleBar.selectLanguage(languageCode);
	}

	async performAdminLogout(): Promise<void> {
		await this.adminTitleBar.logout();
	}

	async navigateToPublicSite(): Promise<void> {
		await this.adminTitleBar.clickSeeSite();
	}

	// Session timeout management
	async isTimeoutModalVisible(): Promise<boolean> {
		return await this.page.locator('#timeoutModal').isVisible();
	}

	async handleSessionTimeout(): Promise<void> {
		if (await this.isTimeoutModalVisible()) {
			const continueButton = this.page.locator('#continueSession');
			if (await continueButton.isVisible()) {
				await continueButton.click();
			}
		}
	}

	async dismissTimeoutModal(): Promise<void> {
		if (await this.isTimeoutModalVisible()) {
			const logoutButton = this.page.locator('#timeoutModal a[href*="/users/sign_out"]');
			await logoutButton.click();
		}
	}

	// Improved admin verification
	async waitForAdminPageLoad(timeout: number = 30000): Promise<void> {
		await this.page.waitForLoadState('networkidle');
		await this.waitForElement('.layout-wrapper', timeout);

		await this.adminNavigation.isNavigationVisible();
		await this.adminTitleBar.isTitleBarVisible();
	}

	// Enhanced navigation method
	async navigateToAdminSection(url: string, expectedElement?: string): Promise<void> {
		await this.navigateTo(url);
		await this.waitForAdminPageLoad();

		if (expectedElement) {
			await this.waitForElement(expectedElement);
		}
	}

	// Flash notification management

	/**
	 * Selector for the flash notification wrapper
	 */
	private get flashNotificationWrapper() {
		return this.page.locator('[data-callout-wrapper]');
	}

	/**
	 * Selector for success flash notifications
	 */
	private get successFlashNotification() {
		return this.page.locator('.flash.success[data-alert-box], .flash.primary[data-alert-box]');
	}

	/**
	 * Selector for primary flash notifications (often used for success)
	 */
	private get primaryFlashNotification() {
		return this.page.locator('.flash.primary[data-alert-box]');
	}

	/**
	 * Selector for error flash notifications
	 */
	private get errorFlashNotification() {
		return this.page.locator('.flash.alert[data-alert-box], .flash.error[data-alert-box]');
	}

	/**
	 * Selector for the message inside the flash notification
	 */
	private get flashMessage() {
		return this.page.locator('.flash__message');
	}

	/**
	 * Selector for the close button of the notification
	 */
	private get flashCloseButton() {
		return this.page.locator('.flash .close-button[data-close]');
	}

	/**
	 * Checks if a success flash notification is present
	 */
	async hasSuccessFlashNotification(): Promise<boolean> {
		return await this.successFlashNotification.isVisible();
	}

	/**
	 * Checks if a primary flash notification is present
	 */
	async hasPrimaryFlashNotification(): Promise<boolean> {
		return await this.primaryFlashNotification.isVisible();
	}

	/**
	 * Checks if an error flash notification is present
	 */
	async hasErrorFlashNotification(): Promise<boolean> {
		return await this.errorFlashNotification.isVisible();
	}

	/**
	 * Checks if any flash notification is present
	 */
	async hasFlashNotification(): Promise<boolean> {
		return await this.flashNotificationWrapper.isVisible();
	}

	/**
	 * Gets the message of the flash notification
	 */
	async getFlashMessage(): Promise<string> {
		const message = await this.flashMessage.textContent();
		return message?.trim() || '';
	}

	/**
	 * Checks if the flash notification contains a specific message
	 * @param expectedMessage - The expected message in the notification
	 */
	async expectFlashMessage(expectedMessage: string): Promise<void> {
		await expect(this.flashMessage).toHaveText(expectedMessage);
	}

	/**
	 * Checks if a success notification with a specific message is present
	 * @param expectedMessage - The expected message in the success notification
	 */
	async expectSuccessFlashMessage(expectedMessage: string): Promise<void> {
		await expect(this.successFlashNotification).toBeVisible();
		await expect(this.successFlashNotification.locator('.flash__message')).toHaveText(expectedMessage);
	}

	/**
	 * Checks if an error notification with a specific message is present
	 * @param expectedMessage - The expected message in the error notification
	 */
	async expectErrorFlashMessage(expectedMessage: string): Promise<void> {
		await expect(this.errorFlashNotification).toBeVisible();
		await expect(this.errorFlashNotification.locator('.flash__message')).toHaveText(expectedMessage);
	}

	/**
	 * Checks if a primary notification with a specific message is present
	 * @param expectedMessage - The expected message in the primary notification
	 */
	async expectPrimaryFlashMessage(expectedMessage: string): Promise<void> {
		await expect(this.primaryFlashNotification).toBeVisible();
		await expect(this.primaryFlashNotification.locator('.flash__message')).toHaveText(expectedMessage);
	}

	/**
	 * Closes the flash notification by clicking the close button
	 */
	async closeFlashNotification(): Promise<void> {
		if (await this.flashCloseButton.isVisible()) {
			await this.flashCloseButton.click();
		}
	}

	/**
	 * Waits for a success flash notification with a specific message to appear
	 * @param expectedMessage - The expected message
	 * @param timeout - Timeout in milliseconds (default: 10000)
	 */
	async waitForSuccessFlashNotification(expectedMessage: string, timeout: number = 10000): Promise<void> {
		await this.successFlashNotification.waitFor({ state: 'visible', timeout });
		await expect(this.successFlashNotification.locator('.flash__message')).toHaveText(expectedMessage, { timeout });
	}

	/**
	 * Waits for an error flash notification with a specific message to appear
	 * @param expectedMessage - The expected message
	 * @param timeout - Timeout in milliseconds (default: 10000)
	 */
	async waitForErrorFlashNotification(expectedMessage: string, timeout: number = 10000): Promise<void> {
		await this.errorFlashNotification.waitFor({ state: 'visible', timeout });
		await expect(this.errorFlashNotification.locator('.flash__message')).toHaveText(expectedMessage, { timeout });
	}

	/**
	 * Waits for any flash notification to appear
	 * @param timeout - Timeout in milliseconds (default: 10000)
	 */
	async waitForFlashNotification(timeout: number = 10000): Promise<void> {
		await this.flashNotificationWrapper.waitFor({ state: 'visible', timeout });
	}

	/**
	 * Waits for the flash notification to disappear
	 * @param timeout - Timeout in milliseconds (default: 10000)
	 */
	async waitForFlashNotificationToDisappear(timeout: number = 10000): Promise<void> {
		await this.flashNotificationWrapper.waitFor({ state: 'hidden', timeout });
	}

	/**
	 * Checks if the flash notification is of type success
	 */
	async isFlashNotificationSuccess(): Promise<boolean> {
		return await this.successFlashNotification.isVisible();
	}

	/**
	 * Checks if the flash notification is of type error
	 */
	async isFlashNotificationError(): Promise<boolean> {
		return await this.errorFlashNotification.isVisible();
	}

	/**
	 * Gets the type of flash notification present
	 * @returns 'success', 'primary', 'error', or 'none' if not present
	 */
	async getFlashNotificationType(): Promise<'success' | 'primary' | 'error' | 'none'> {
		if (await this.hasSuccessFlashNotification()) {
			// Check if it's specifically primary or success
			if (await this.hasPrimaryFlashNotification()) {
				return 'primary';
			}
			return 'success';
		} else if (await this.hasErrorFlashNotification()) {
			return 'error';
		}
		return 'none';
	}
}
