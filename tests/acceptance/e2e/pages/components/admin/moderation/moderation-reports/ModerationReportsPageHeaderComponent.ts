import { Locator, Page } from '@playwright/test';

/**
 * Component representing the page header on the Moderation Reports page
 */
export class ModerationReportsPageHeaderComponent {
	readonly page: Page;
	readonly header: Locator;
	readonly title: Locator;
	readonly backLink: Locator;

	constructor(page: Page) {
		this.page = page;
		this.header = page.locator('.process-header');
		this.title = this.header.locator('h2.heading2');
		this.backLink = this.header.locator('a').filter({ hasText: 'Back' });
	}

	/**
	 * Get the page title text
	 */
	async getTitleText(): Promise<string> {
		return (await this.title.textContent()) || '';
	}

	/**
	 * Click the back link
	 */
	async clickBack(): Promise<void> {
		await this.backLink.click();
	}

	/**
	 * Verify the header is visible
	 */
	async isVisible(): Promise<boolean> {
		return await this.header.isVisible();
	}

	/**
	 * Verify the title is correct
	 */
	async hasTitleText(expectedTitle: string): Promise<boolean> {
		const titleText = await this.getTitleText();
		return titleText.includes(expectedTitle);
	}

	/**
	 * Verify the back link is visible
	 */
	async isBackLinkVisible(): Promise<boolean> {
		return await this.backLink.isVisible();
	}
}
