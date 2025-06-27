import { FooterComponent } from '@pages/components/common/FooterComponent';
import { AdminHeaderComponent } from '../components/admin/AdminHeaderComponent';
import { BasePage } from './BasePage';

/**
 * Base class for pages that require authentication.
 * Extends BasePage with specific functionality for authenticated users.
 */
export abstract class AuthenticatedPage extends BasePage {
	protected adminHeader: AdminHeaderComponent;
	public footer: FooterComponent;

	constructor(page: any) {
		super(page);
		this.adminHeader = new AdminHeaderComponent(page);
		this.footer = new FooterComponent(page);
	}

	/**
	 * Checks if user is currently logged in
	 */
	async isLoggedIn(): Promise<boolean> {
		return await this.header.isUserLoggedIn();
	}

	/**
	 * Performs logout from the application
	 */
	async logout(): Promise<void> {
		await this.header.performLogout();
	}

	/**
	 * Navigates to user profile
	 */
	async navigateToProfile(): Promise<void> {
		await this.header.navigateToMyProfile();
	}

	/**
	 * Navigates to account settings
	 */
	async navigateToAccountSettings(): Promise<void> {
		await this.header.navigateToMyAccount();
	}

	/**
	 * Navigates to notifications
	 */
	async navigateToNotifications(): Promise<void> {
		await this.header.navigateToNotifications();
	}

	/**
	 * Navigates to conversations
	 */
	async navigateToConversations(): Promise<void> {
		await this.header.navigateToConversations();
	}

	/**
	 * Gets user initials from header
	 */
	async getUserInitials(): Promise<string> {
		return await this.header.getUserInitials();
	}

	/**
	 * Checks if user has unread notifications
	 */
	async hasUnreadNotifications(): Promise<boolean> {
		return await this.header.hasUnreadNotifications();
	}

	/**
	 * Checks if user has admin permissions
	 */
	async hasAdminPermissions(): Promise<boolean> {
		// Verifica presenza admin bar
		const hasAdminBar = await this.adminHeader.isAdminBarVisible();

		if (hasAdminBar) {
			return true;
		}

		// Se non c'è admin bar, verifica nel menu utente
		if (await this.isLoggedIn()) {
			await this.header.openAccountDropdown();
			const adminLink = await this.page.locator('a[href*="/admin/"]').isVisible();
			await this.header.closeAccountDropdown();
			return adminLink;
		}

		return false;
	}

	/**
	 * Navigates to admin dashboard
	 */
	async navigateToAdminDashboard(): Promise<void> {
		if (await this.adminHeader.isAdminBarVisible()) {
			await this.adminHeader.navigateToAdminDashboard();
		} else {
			await this.header.openAccountDropdown();
			await this.page.locator('a[href*="/admin/"]').click();
		}
	}

	/**
	 * Navigates to organization edit (admin only)
	 */
	async navigateToEditOrganization(): Promise<void> {
		if (await this.adminHeader.isAdminBarVisible()) {
			await this.adminHeader.navigateToEditOrganization();
		}
	}

	/**
	 * Checks if admin bar is visible
	 */
	async isAdminBarVisible(): Promise<boolean> {
		return await this.adminHeader.isAdminBarVisible();
	}

	/**
	 * Checks for success notifications
	 */
	async hasSuccessNotification(): Promise<boolean> {
		return await this.hasSuccessFlashMessage();
	}

	/**
	 * Checks for error notifications
	 */
	async hasErrorNotification(): Promise<boolean> {
		return await this.hasErrorFlashMessage();
	}

	/**
	 * Gets notification message (success or error)
	 */
	async getNotificationMessage(): Promise<string> {
		const successVisible = await this.hasSuccessNotification();
		const errorVisible = await this.hasErrorNotification();

		if (successVisible) {
			return await this.getSuccessFlashMessageText();
		} else if (errorVisible) {
			return await this.getErrorFlashMessageText();
		}

		return '';
	}

	/**
	 * Waits for success notification to appear
	 */
	async waitForSuccessNotification(timeout: number = 10000): Promise<void> {
		await this.waitForSuccessFlashMessage(timeout);
	}

	/**
	 * Waits for error notification to appear
	 */
	async waitForErrorNotification(timeout: number = 10000): Promise<void> {
		await this.waitForErrorFlashMessage(timeout);
	}

	/**
	 * Waits for user to be fully authenticated (header loaded)
	 */
	async waitForAuthenticationComplete(): Promise<void> {
		await this.header.waitForUserLogin();
	}

	/**
	 * Verifies that the page is properly loaded for authenticated user
	 */
	async isPageLoadedForAuthenticatedUser(): Promise<boolean> {
		const isLoggedIn = await this.isLoggedIn();
		const headerLoaded = await this.header.isHeaderLoadedForLoggedInUser();

		return isLoggedIn && headerLoaded;
	}

	/**
	 * Verifies that the page is properly loaded for admin user
	 */
	async isPageLoadedForAdminUser(): Promise<boolean> {
		const isLoggedIn = await this.isLoggedIn();
		const hasAdmin = await this.hasAdminPermissions();
		const headerLoaded = await this.header.isHeaderLoadedForLoggedInUser();

		return isLoggedIn && hasAdmin && headerLoaded;
	}
}
