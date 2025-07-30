import { Locator, Page } from '@playwright/test';

/**
 * Component representing the sidebar navigation on the Moderation Reports page
 */
export class ModerationReportsSidebarComponent {
	readonly page: Page;
	readonly sidebar: Locator;
	readonly reportedContentLink: Locator;
	readonly reportedParticipantsLink: Locator;

	constructor(page: Page) {
		this.page = page;
		this.sidebar = page.locator('.layout-nav');
		this.reportedContentLink = this.sidebar.locator('a').filter({ hasText: 'Reported content' });
		this.reportedParticipantsLink = this.sidebar.locator('a').filter({ hasText: 'Reported participants' });
	}

	/**
	 * Click the Reported content link
	 */
	async clickReportedContent(): Promise<void> {
		await this.reportedContentLink.click();
	}

	/**
	 * Click the Reported participants link
	 */
	async clickReportedParticipants(): Promise<void> {
		await this.reportedParticipantsLink.click();
	}

	/**
	 * Verify the sidebar is visible
	 */
	async isVisible(): Promise<boolean> {
		return await this.sidebar.isVisible();
	}

	/**
	 * Check if Reported content link is active
	 */
	async isReportedContentActive(): Promise<boolean> {
		const linkClass = (await this.reportedContentLink.getAttribute('class')) || '';
		return linkClass.includes('is-active');
	}

	/**
	 * Check if Reported participants link is active
	 */
	async isReportedParticipantsActive(): Promise<boolean> {
		const linkClass = (await this.reportedParticipantsLink.getAttribute('class')) || '';
		return linkClass.includes('is-active');
	}
}
