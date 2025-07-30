import { Locator, Page } from '@playwright/test';

/**
 * Component representing the breadcrumb navigation on the Moderation Reports page
 */
export class ModerationReportsBreadcrumbComponent {
	readonly page: Page;
	readonly breadcrumbContainer: Locator;
	readonly globalModerationsLink: Locator;

	constructor(page: Page) {
		this.page = page;
		this.breadcrumbContainer = page.locator('.breadcrumb');
		this.globalModerationsLink = this.breadcrumbContainer.locator('a').filter({ hasText: 'Global moderations' });
	}

	/**
	 * Click the Global moderations breadcrumb link
	 */
	async clickGlobalModerations(): Promise<void> {
		await this.globalModerationsLink.click();
	}

	/**
	 * Verify the breadcrumb is visible
	 */
	async isVisible(): Promise<boolean> {
		return await this.breadcrumbContainer.isVisible();
	}

	/**
	 * Get the breadcrumb text
	 */
	async getBreadcrumbText(): Promise<string> {
		return (await this.breadcrumbContainer.textContent()) || '';
	}
}
