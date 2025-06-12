import { TEST_SELECTORS } from '../../utils/constants';
import { BasePage } from './BasePage';

/**
 * Base class for pages that require authentication.
 * Extends BasePage with specific functionality for authenticated users.
 */
export abstract class AuthenticatedPage extends BasePage {
	/**
	 * Checks if user is currently logged in
	 */
	async isLoggedIn(): Promise<boolean> {
		return await this.isElementVisible(TEST_SELECTORS.USER_MENU);
	}

	/**
	 * Performs logout from the application
	 */
	async logout(): Promise<void> {
		if (await this.isLoggedIn()) {
			await this.clickElement(TEST_SELECTORS.USER_MENU);
			await this.clickElement(TEST_SELECTORS.LOGIN.LOGOUT_BUTTON);
			await this.waitForLoadState();
		}
	}

	/**
	 * Navigates to user profile
	 */
	async navigateToProfile(): Promise<void> {
		await this.clickElement(TEST_SELECTORS.USER_MENU);
		await this.clickElement('[data-testid="profile-link"]');
		await this.waitForLoadState();
	}

	/**
	 * Navigates to account settings
	 */
	async navigateToAccountSettings(): Promise<void> {
		await this.clickElement(TEST_SELECTORS.USER_MENU);
		await this.clickElement('[data-testid="settings-link"]');
		await this.waitForLoadState();
	}

	/**
	 * Checks for success notifications
	 */
	async hasSuccessNotification(): Promise<boolean> {
		return await this.isElementVisible(TEST_SELECTORS.SUCCESS_MESSAGE);
	}

	/**
	 * Checks for error notifications
	 */
	async hasErrorNotification(): Promise<boolean> {
		return await this.isElementVisible(TEST_SELECTORS.ERROR_MESSAGE);
	}

	/**
	 * Gets notification message (success or error)
	 */
	async getNotificationMessage(): Promise<string> {
		const successVisible = await this.hasSuccessNotification();
		const errorVisible = await this.hasErrorNotification();

		if (successVisible) {
			return await this.getElementText(TEST_SELECTORS.SUCCESS_MESSAGE);
		} else if (errorVisible) {
			return await this.getElementText(TEST_SELECTORS.ERROR_MESSAGE);
		}

		return '';
	}

	/**
	 * Waits for success notification to appear
	 */
	async waitForSuccessNotification(timeout: number = 10000): Promise<void> {
		await this.waitForElement(TEST_SELECTORS.SUCCESS_MESSAGE, timeout);
	}

	/**
	 * Waits for error notification to appear
	 */
	async waitForErrorNotification(timeout: number = 10000): Promise<void> {
		await this.waitForElement(TEST_SELECTORS.ERROR_MESSAGE, timeout);
	}
}
