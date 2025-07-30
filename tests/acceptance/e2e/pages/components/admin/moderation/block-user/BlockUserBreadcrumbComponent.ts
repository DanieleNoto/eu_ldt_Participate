import { Locator, Page } from '@playwright/test';

/**
 * Component representing the breadcrumb navigation on the Block User page
 */
export class BlockUserBreadcrumbComponent {
	readonly page: Page;
	readonly breadcrumbContainer: Locator;
	readonly homeLink: Locator;

	constructor(page: Page) {
		this.page = page;
		this.breadcrumbContainer = page.locator('.process-title');
		this.homeLink = this.breadcrumbContainer.locator('a.process-title-content-icon-home');
	}

	/**
	 * Click the home link
	 */
	async clickHome(): Promise<void> {
		await this.homeLink.click();
	}

	/**
	 * Verify the breadcrumb is visible
	 */
	async isVisible(): Promise<boolean> {
		return await this.breadcrumbContainer.isVisible();
	}

	/**
	 * Check if home link is visible
	 */
	async isHomeLinkVisible(): Promise<boolean> {
		return await this.homeLink.isVisible();
	}

	/**
	 * Get the home link URL
	 */
	async getHomeLinkUrl(): Promise<string> {
		return (await this.homeLink.getAttribute('href')) || '';
	}

	/**
	 * Verify home link points to admin dashboard
	 */
	async isHomeLinkToAdmin(): Promise<boolean> {
		const href = await this.getHomeLinkUrl();
		return href === '/admin/';
	}
}
