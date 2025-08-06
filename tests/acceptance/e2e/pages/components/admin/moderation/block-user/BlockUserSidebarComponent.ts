import { Locator, Page } from '@playwright/test';

/**
 * Component representing the sidebar navigation on the Block User page
 */
export class BlockUserSidebarComponent {
	readonly page: Page;
	readonly sidebarContainer: Locator;
	readonly reportedContentLink: Locator;
	readonly reportedParticipantsLink: Locator;
	readonly reportedContentCounter: Locator;
	readonly reportedParticipantsCounter: Locator;
	readonly mobileMenuButton: Locator;
	readonly mobileDropdown: Locator;

	constructor(page: Page) {
		this.page = page;
		this.sidebarContainer = page.locator('.sidebar-menu__container');
		this.reportedContentLink = this.sidebarContainer.locator('a').filter({ hasText: 'Reported content' });
		this.reportedParticipantsLink = this.sidebarContainer.locator('a').filter({ hasText: 'Reported participants' });
		this.reportedContentCounter = this.reportedContentLink.locator('.component-counter');
		this.reportedParticipantsCounter = this.reportedParticipantsLink.locator('.component-counter');
		this.mobileMenuButton = this.sidebarContainer.locator('button[data-component="dropdown"]');
		this.mobileDropdown = page.locator('#dropdown-menu-sidebar');
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
		return await this.sidebarContainer.isVisible();
	}

	/**
	 * Check if Reported content link is active
	 */
	async isReportedContentActive(): Promise<boolean> {
		const parentLi = this.reportedContentLink.locator('..');
		const classes = (await parentLi.getAttribute('class')) || '';
		return classes.includes('is-active');
	}

	/**
	 * Check if Reported participants link is active
	 */
	async isReportedParticipantsActive(): Promise<boolean> {
		const parentLi = this.reportedParticipantsLink.locator('..');
		const classes = (await parentLi.getAttribute('class')) || '';
		return classes.includes('is-active');
	}

	/**
	 * Get the reported content count
	 */
	async getReportedContentCount(): Promise<string> {
		return (await this.reportedContentCounter.textContent()) || '';
	}

	/**
	 * Get the reported participants count
	 */
	async getReportedParticipantsCount(): Promise<string> {
		return (await this.reportedParticipantsCounter.textContent()) || '';
	}

	/**
	 * Click the mobile menu button
	 */
	async clickMobileMenu(): Promise<void> {
		await this.mobileMenuButton.click();
	}

	/**
	 * Check if mobile dropdown is visible
	 */
	async isMobileDropdownVisible(): Promise<boolean> {
		return await this.mobileDropdown.isVisible();
	}

	/**
	 * Verify sidebar counters are present
	 */
	async hasCounters(): Promise<boolean> {
		const contentCounterVisible = await this.reportedContentCounter.isVisible();
		const participantsCounterVisible = await this.reportedParticipantsCounter.isVisible();
		return contentCounterVisible && participantsCounterVisible;
	}

	/**
	 * Get all sidebar navigation data
	 */
	async getSidebarData(): Promise<{
		reportedContentCount: string;
		reportedParticipantsCount: string;
		reportedContentActive: boolean;
		reportedParticipantsActive: boolean;
	}> {
		return {
			reportedContentCount: await this.getReportedContentCount(),
			reportedParticipantsCount: await this.getReportedParticipantsCount(),
			reportedContentActive: await this.isReportedContentActive(),
			reportedParticipantsActive: await this.isReportedParticipantsActive()
		};
	}
}
