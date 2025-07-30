import { Locator, Page } from '@playwright/test';

/**
 * Component for handling the breadcrumb navigation on the Global Moderation admin page
 * Based on the HTML structure: .process-title with home icon and breadcrumb links
 */
export class GlobalModerationBreadcrumbComponent {
	private readonly page: Page;

	// Selectors based on the provided HTML structure
	private readonly breadcrumbContainer = '.process-title';
	private readonly homeIcon = '.process-title .icon--home';
	private readonly homeLink = '.process-title a[href="/"]';
	private readonly breadcrumbSeparator = '.process-title .icon--chevron-right';
	private readonly adminLink = '.process-title a[href="/admin"]';
	private readonly moderationText = '.process-title span:has-text("Global moderation")';

	constructor(page: Page) {
		this.page = page;
	}

	/**
	 * Get the breadcrumb container element
	 */
	getBreadcrumbContainer(): Locator {
		return this.page.locator(this.breadcrumbContainer);
	}

	/**
	 * Get the home icon in breadcrumb
	 */
	getHomeIcon(): Locator {
		return this.page.locator(this.homeIcon);
	}

	/**
	 * Get the home link in breadcrumb
	 */
	getHomeLink(): Locator {
		return this.page.locator(this.homeLink);
	}

	/**
	 * Get the admin link in breadcrumb
	 */
	getAdminLink(): Locator {
		return this.page.locator(this.adminLink);
	}

	/**
	 * Get the breadcrumb separators (chevron icons)
	 */
	getBreadcrumbSeparators(): Locator {
		return this.page.locator(this.breadcrumbSeparator);
	}

	/**
	 * Get the current page text (Global moderation)
	 */
	getCurrentPageText(): Locator {
		return this.page.locator(this.moderationText);
	}

	/**
	 * Check if breadcrumb is visible
	 */
	async isVisible(): Promise<boolean> {
		return await this.getBreadcrumbContainer().isVisible();
	}

	/**
	 * Navigate to home via breadcrumb
	 */
	async navigateToHome(): Promise<void> {
		await this.getHomeLink().click();
	}

	/**
	 * Navigate to admin section via breadcrumb
	 */
	async navigateToAdmin(): Promise<void> {
		await this.getAdminLink().click();
	}

	/**
	 * Get the complete breadcrumb path as text
	 */
	async getBreadcrumbPath(): Promise<string[]> {
		const path: string[] = [];

		// Get home link text (usually just the icon, but we'll add "Home")
		if (await this.getHomeLink().isVisible()) {
			path.push('Home');
		}

		// Get admin link text
		const adminText = await this.getAdminLink().textContent();
		if (adminText && adminText.trim()) {
			path.push(adminText.trim());
		}

		// Get current page text
		const currentText = await this.getCurrentPageText().textContent();
		if (currentText && currentText.trim()) {
			path.push(currentText.trim());
		}

		return path;
	}

	/**
	 * Verify the breadcrumb structure matches expected pattern
	 */
	async verifyBreadcrumbStructure(): Promise<boolean> {
		try {
			await this.getBreadcrumbContainer().waitFor({ state: 'visible' });

			// Check that all expected elements are present
			const homeVisible = await this.getHomeIcon().isVisible();
			const adminVisible = await this.getAdminLink().isVisible();
			const moderationVisible = await this.getCurrentPageText().isVisible();
			const separatorsCount = await this.getBreadcrumbSeparators().count();

			return homeVisible && adminVisible && moderationVisible && separatorsCount >= 1;
		} catch {
			return false;
		}
	}

	/**
	 * Check if the current page is highlighted correctly in breadcrumb
	 */
	async isCurrentPageHighlighted(): Promise<boolean> {
		const currentPage = this.getCurrentPageText();
		return await currentPage.isVisible();
	}

	/**
	 * Get accessibility attributes for screen readers
	 */
	async getAccessibilityInfo(): Promise<Record<string, string | null>> {
		const container = this.getBreadcrumbContainer();

		return {
			ariaLabel: await container.getAttribute('aria-label'),
			role: await container.getAttribute('role'),
			ariaDescribedBy: await container.getAttribute('aria-describedby')
		};
	}

	/**
	 * Verify all breadcrumb links are clickable (except current page)
	 */
	async verifyLinksClickable(): Promise<boolean> {
		try {
			const homeClickable = await this.getHomeLink().isEnabled();
			const adminClickable = await this.getAdminLink().isEnabled();

			return homeClickable && adminClickable;
		} catch {
			return false;
		}
	}

	/**
	 * Wait for breadcrumb to load
	 */
	async waitForBreadcrumbToLoad(): Promise<void> {
		await this.getBreadcrumbContainer().waitFor({ state: 'visible' });
		await this.getHomeIcon().waitFor({ state: 'visible' });
	}

	/**
	 * Check accessibility compliance
	 */
	async checkAccessibility(): Promise<void> {
		// Check if home icon has proper aria-label
		const homeAriaLabel = await this.getHomeIcon().getAttribute('aria-label');
		if (!homeAriaLabel) {
			console.warn('Home icon should have aria-label attribute');
		}

		// Check if current page has proper aria-current
		const currentPageAria = await this.getCurrentPageText().getAttribute('aria-current');
		if (!currentPageAria) {
			console.warn('Current page should have aria-current="page"');
		}
	}

	/**
	 * Debug helper - get all breadcrumb elements and their properties
	 */
	async debugBreadcrumb(): Promise<any> {
		return {
			container: {
				visible: await this.getBreadcrumbContainer().isVisible(),
				class: await this.getBreadcrumbContainer().getAttribute('class')
			},
			homeIcon: {
				visible: await this.getHomeIcon().isVisible(),
				class: await this.getHomeIcon().getAttribute('class')
			},
			homeLink: {
				visible: await this.getHomeLink().isVisible(),
				href: await this.getHomeLink().getAttribute('href'),
				text: await this.getHomeLink().textContent()
			},
			adminLink: {
				visible: await this.getAdminLink().isVisible(),
				href: await this.getAdminLink().getAttribute('href'),
				text: await this.getAdminLink().textContent()
			},
			currentPage: {
				visible: await this.getCurrentPageText().isVisible(),
				text: await this.getCurrentPageText().textContent()
			},
			separatorsCount: await this.getBreadcrumbSeparators().count()
		};
	}
}
