import { Locator, Page } from '@playwright/test';

/**
 * Component for handling the sidebar navigation on the Global Moderation admin page
 * Based on the HTML structure: .sidebar-menu__container with navigation links
 */
export class GlobalModerationSidebarComponent {
	private readonly page: Page;

	// Selectors based on the provided HTML structure
	private readonly sidebarContainer = '.sidebar-menu__container';
	private readonly sidebarMenu = '.sidebar-menu__container .sidebar-menu';
	private readonly reportedContentLink = '.sidebar-menu__container a[href="/admin/moderations"]';
	private readonly reportedParticipantsLink = '.sidebar-menu__container a[href="/admin/moderation_users"]';
	private readonly menuItems = '.sidebar-menu__container .sidebar-menu__item';
	private readonly activeMenuItem =
		'.sidebar-menu__container .sidebar-menu__item--active, .sidebar-menu__container .sidebar-menu__item.active';

	constructor(page: Page) {
		this.page = page;
	}

	/**
	 * Get the sidebar container element
	 */
	getSidebarContainer(): Locator {
		return this.page.locator(this.sidebarContainer);
	}

	/**
	 * Get the sidebar menu element
	 */
	getSidebarMenu(): Locator {
		return this.page.locator(this.sidebarMenu);
	}

	/**
	 * Get the "Reported content" link
	 */
	getReportedContentLink(): Locator {
		return this.page.locator(this.reportedContentLink);
	}

	/**
	 * Get the "Reported participants" link
	 */
	getReportedParticipantsLink(): Locator {
		return this.page.locator(this.reportedParticipantsLink);
	}

	/**
	 * Get all menu items in sidebar
	 */
	getMenuItems(): Locator {
		return this.page.locator(this.menuItems);
	}

	/**
	 * Get the active menu item
	 */
	getActiveMenuItem(): Locator {
		return this.page.locator(this.activeMenuItem);
	}

	/**
	 * Check if sidebar is visible
	 */
	async isVisible(): Promise<boolean> {
		return await this.getSidebarContainer().isVisible();
	}

	/**
	 * Check if sidebar menu is visible
	 */
	async isMenuVisible(): Promise<boolean> {
		return await this.getSidebarMenu().isVisible();
	}

	/**
	 * Navigate to reported content page
	 */
	async navigateToReportedContent(): Promise<void> {
		await this.getReportedContentLink().click();
	}

	/**
	 * Navigate to reported participants page
	 */
	async navigateToReportedParticipants(): Promise<void> {
		await this.getReportedParticipantsLink().click();
	}

	/**
	 * Get all menu item texts
	 */
	async getMenuItemTexts(): Promise<string[]> {
		const menuItems = this.getMenuItems();
		const count = await menuItems.count();
		const texts: string[] = [];

		for (let i = 0; i < count; i++) {
			const text = await menuItems.nth(i).textContent();
			if (text && text.trim()) {
				texts.push(text.trim());
			}
		}

		return texts;
	}

	/**
	 * Get the active menu item text
	 */
	async getActiveMenuItemText(): Promise<string> {
		const activeItem = this.getActiveMenuItem();
		const text = await activeItem.textContent();
		return text ? text.trim() : '';
	}

	/**
	 * Check if reported content is the active menu item
	 */
	async isReportedContentActive(): Promise<boolean> {
		const activeText = await this.getActiveMenuItemText();
		return activeText.toLowerCase().includes('reported content') || activeText.toLowerCase().includes('content');
	}

	/**
	 * Check if reported participants is the active menu item
	 */
	async isReportedParticipantsActive(): Promise<boolean> {
		const activeText = await this.getActiveMenuItemText();
		return (
			activeText.toLowerCase().includes('reported participants') ||
			activeText.toLowerCase().includes('participants')
		);
	}

	/**
	 * Verify sidebar structure matches expected pattern
	 */
	async verifySidebarStructure(): Promise<boolean> {
		try {
			await this.getSidebarContainer().waitFor({ state: 'visible' });

			// Check that required elements are present
			const containerVisible = await this.getSidebarContainer().isVisible();
			const menuVisible = await this.getSidebarMenu().isVisible();
			const reportedContentVisible = await this.getReportedContentLink().isVisible();
			const reportedParticipantsVisible = await this.getReportedParticipantsLink().isVisible();

			return containerVisible && menuVisible && reportedContentVisible && reportedParticipantsVisible;
		} catch {
			return false;
		}
	}

	/**
	 * Get menu item by text content
	 */
	async getMenuItemByText(text: string): Promise<Locator> {
		return this.page.locator(`.sidebar-menu__container .sidebar-menu__item:has-text("${text}")`);
	}

	/**
	 * Click menu item by text
	 */
	async clickMenuItemByText(text: string): Promise<void> {
		const menuItem = await this.getMenuItemByText(text);
		await menuItem.click();
	}

	/**
	 * Get count of menu items
	 */
	async getMenuItemCount(): Promise<number> {
		return await this.getMenuItems().count();
	}

	/**
	 * Check if all menu items are clickable
	 */
	async verifyMenuItemsClickable(): Promise<boolean> {
		try {
			const reportedContentClickable = await this.getReportedContentLink().isEnabled();
			const reportedParticipantsClickable = await this.getReportedParticipantsLink().isEnabled();

			return reportedContentClickable && reportedParticipantsClickable;
		} catch {
			return false;
		}
	}

	/**
	 * Get accessibility attributes for screen readers
	 */
	async getAccessibilityInfo(): Promise<Record<string, string | null>> {
		const container = this.getSidebarContainer();

		return {
			ariaLabel: await container.getAttribute('aria-label'),
			role: await container.getAttribute('role'),
			ariaDescribedBy: await container.getAttribute('aria-describedby')
		};
	}

	/**
	 * Wait for sidebar to load
	 */
	async waitForSidebarToLoad(): Promise<void> {
		await this.getSidebarContainer().waitFor({ state: 'visible' });
		await this.getSidebarMenu().waitFor({ state: 'visible' });
	}

	/**
	 * Check accessibility compliance
	 */
	async checkAccessibility(): Promise<void> {
		// Check if sidebar has proper navigation role
		const sidebarRole = await this.getSidebarContainer().getAttribute('role');
		if (sidebarRole !== 'navigation') {
			console.warn('Sidebar should have role="navigation"');
		}

		// Check if menu items have proper aria-labels
		const menuItems = this.getMenuItems();
		const count = await menuItems.count();

		for (let i = 0; i < count; i++) {
			const item = menuItems.nth(i);
			const ariaLabel = await item.getAttribute('aria-label');
			if (!ariaLabel) {
				const text = await item.textContent();
				console.warn(`Menu item "${text}" should have aria-label attribute`);
			}
		}
	}

	/**
	 * Debug helper - get all sidebar elements and their properties
	 */
	async debugSidebar(): Promise<any> {
		return {
			container: {
				visible: await this.getSidebarContainer().isVisible(),
				class: await this.getSidebarContainer().getAttribute('class')
			},
			menu: {
				visible: await this.getSidebarMenu().isVisible(),
				class: await this.getSidebarMenu().getAttribute('class')
			},
			reportedContent: {
				visible: await this.getReportedContentLink().isVisible(),
				href: await this.getReportedContentLink().getAttribute('href'),
				text: await this.getReportedContentLink().textContent(),
				enabled: await this.getReportedContentLink().isEnabled()
			},
			reportedParticipants: {
				visible: await this.getReportedParticipantsLink().isVisible(),
				href: await this.getReportedParticipantsLink().getAttribute('href'),
				text: await this.getReportedParticipantsLink().textContent(),
				enabled: await this.getReportedParticipantsLink().isEnabled()
			},
			menuItems: await this.getMenuItemTexts(),
			activeMenuItem: await this.getActiveMenuItemText(),
			menuItemCount: await this.getMenuItemCount()
		};
	}
}
