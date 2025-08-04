import { Locator, Page } from '@playwright/test';

/**
 * Component representing the breadcrumb navigation on the Reported Participants page
 */
export class ReportedParticipantsBreadcrumbComponent {
	readonly page: Page;
	readonly breadcrumbContainer: Locator;
	readonly homeLink: Locator;
	readonly globalModerationsLink: Locator;
	readonly currentPageText: Locator;

	constructor(page: Page) {
		this.page = page;
		this.breadcrumbContainer = page.locator('.process-title');
		this.homeLink = this.breadcrumbContainer.locator('a.process-title-content-icon-home');
		this.globalModerationsLink = this.breadcrumbContainer
			.locator('a.process-title-content-breadcrumb')
			.filter({ hasText: 'Global moderations' });
		this.currentPageText = this.breadcrumbContainer
			.locator('span.process-title-content-breadcrumb')
			.filter({ hasText: 'Reported participants' });
	}

	/**
	 * Click the home link
	 */
	async clickHome(): Promise<void> {
		await this.homeLink.click();
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
	 * Get the full breadcrumb path text
	 */
	async getBreadcrumbPath(): Promise<string> {
		return (await this.breadcrumbContainer.textContent()) || '';
	}

	/**
	 * Verify the current page is highlighted correctly
	 */
	async isCurrentPageHighlighted(): Promise<boolean> {
		const currentPageElement = await this.currentPageText;
		const ariaCurrent = await currentPageElement.getAttribute('aria-current');
		return ariaCurrent === 'page';
	}

	/**
	 * Get the current page text
	 */
	async getCurrentPageText(): Promise<string> {
		return (await this.currentPageText.textContent()) || '';
	}
}
