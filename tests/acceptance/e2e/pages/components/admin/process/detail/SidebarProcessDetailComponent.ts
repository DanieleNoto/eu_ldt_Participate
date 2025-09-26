import { Locator, Page, expect } from '@playwright/test';

/**
 * Component for the sidebar menu in process detail pages.
 * Represents the navigation menu with links to different process management sections.
 */
export class SidebarProcessDetailComponent {
	private readonly page: Page;

	// Main sidebar container
	private readonly sidebarMenu: Locator;

	// Desktop menu
	private readonly desktopMenu: Locator;

	// Mobile dropdown
	private readonly mobileDropdownButton: Locator;
	private readonly mobileDropdownMenu: Locator;

	// Menu items (accessible in both desktop and mobile)
	private readonly aboutProcessLink: Locator;
	private readonly landingPageLink: Locator;
	private readonly phasesLink: Locator;
	private readonly componentsLink: Locator;
	private readonly categoriesLink: Locator;
	private readonly attachmentsLink: Locator;
	private readonly meetingsLink: Locator;
	private readonly processAdminsLink: Locator;
	private readonly moderationsLink: Locator;
	private readonly privateParticipantsLink: Locator;

	constructor(page: Page) {
		this.page = page;

		// Main containers
		this.sidebarMenu = page.locator('.sidebar-menu');

		// Desktop and mobile versions
		this.desktopMenu = page.locator('.sidebar-menu .hidden.md\\:block ul').first();
		this.mobileDropdownButton = page.locator(
			'button[data-component="dropdown"][data-target="dropdown-menu-sidebar"]'
		);
		this.mobileDropdownMenu = page.locator('#dropdown-menu-sidebar');

		// Menu links (using text content and href patterns for reliability)
		this.aboutProcessLink = page.locator('a[href*="/edit"]:has-text("About this process")');
		this.landingPageLink = page.locator('a[href*="/landing_page/edit"]:has-text("Landing page")');
		this.phasesLink = page.locator('a[href*="/steps"]:has-text("Phases")');
		this.componentsLink = page.locator('a[href*="/components"]:has-text("Components")');
		this.categoriesLink = page.locator('a[href*="/categories"]:has-text("Categories")');
		this.meetingsLink = page.locator('a:has-text("Meetings")');
		this.processAdminsLink = page.locator('a[href*="/user_roles"]:has-text("Process admins")');
		this.moderationsLink = page.locator('a[href*="/moderations"]:has-text("Moderations")');
		this.privateParticipantsLink = page.locator(
			'a[href*="/participatory_space_private_users"]:has-text("Members")'
		);
	}

	// Visibility and state checks
	async isSidebarVisible(): Promise<boolean> {
		return await this.sidebarMenu.isVisible();
	}

	async isDesktopMenuVisible(): Promise<boolean> {
		return await this.desktopMenu.isVisible();
	}

	async isMobileDropdownVisible(): Promise<boolean> {
		return await this.mobileDropdownButton.isVisible();
	}

	async isMobileMenuExpanded(): Promise<boolean> {
		const ariaHidden = await this.mobileDropdownMenu.getAttribute('aria-hidden');
		return ariaHidden === 'false';
	}

	// Mobile dropdown interactions
	async openMobileDropdown(): Promise<void> {
		if (await this.mobileDropdownButton.isVisible()) {
			await this.mobileDropdownButton.click();
			await expect(this.mobileDropdownMenu).toHaveAttribute('aria-hidden', 'false');
		}
	}

	async closeMobileDropdown(): Promise<void> {
		if (await this.isMobileMenuExpanded()) {
			await this.mobileDropdownButton.click();
			await expect(this.mobileDropdownMenu).toHaveAttribute('aria-hidden', 'true');
		}
	}

	// Navigation methods
	async navigateToAboutProcess(): Promise<void> {
		await this.aboutProcessLink.first().click();
		await this.page.waitForLoadState('networkidle');
	}

	async navigateToLandingPage(): Promise<void> {
		await this.landingPageLink.first().click();
		await this.page.waitForLoadState('networkidle');
	}

	async navigateToPhases(): Promise<void> {
		await this.phasesLink.first().click();
		await this.page.waitForLoadState('networkidle');
	}

	async navigateToComponents(): Promise<void> {
		await this.componentsLink.first().click();
		await this.page.waitForLoadState('networkidle');
	}
	async navigateToMeetings(): Promise<void> {
		await this.meetingsLink.first().click();
		await this.page.waitForLoadState('networkidle');
	}

	async navigateToCategories(): Promise<void> {
		await this.categoriesLink.first().click();
		await this.page.waitForLoadState('networkidle');
	}

	async navigateToAttachments(): Promise<void> {
		await this.attachmentsLink.first().click();
		await this.page.waitForLoadState('networkidle');
	}

	async navigateToProcessAdmins(): Promise<void> {
		await this.processAdminsLink.first().click();
		await this.page.waitForLoadState('networkidle');
	}

	async navigateToModerations(): Promise<void> {
		await this.moderationsLink.first().click();
		await this.page.waitForLoadState('networkidle');
	}
	async navigateToPrivateParticipants(): Promise<void> {
		await this.privateParticipantsLink.first().click();
		await this.page.waitForLoadState('networkidle');
	}

	// Mobile-specific navigation (opens dropdown first if needed)
	async navigateToAboutProcessMobile(): Promise<void> {
		await this.openMobileDropdown();
		await this.aboutProcessLink.last().click(); // Use last() for mobile menu
		await this.page.waitForLoadState('networkidle');
	}

	async navigateToLandingPageMobile(): Promise<void> {
		await this.openMobileDropdown();
		await this.landingPageLink.last().click();
		await this.page.waitForLoadState('networkidle');
	}

	async navigateToPhasesMobile(): Promise<void> {
		await this.openMobileDropdown();
		await this.phasesLink.last().click();
		await this.page.waitForLoadState('networkidle');
	}

	async navigateToComponentsMobile(): Promise<void> {
		await this.openMobileDropdown();
		await this.componentsLink.last().click();
		await this.page.waitForLoadState('networkidle');
	}

	async navigateToCategoriesMobile(): Promise<void> {
		await this.openMobileDropdown();
		await this.categoriesLink.last().click();
		await this.page.waitForLoadState('networkidle');
	}

	async navigateToAttachmentsMobile(): Promise<void> {
		await this.openMobileDropdown();
		await this.attachmentsLink.last().click();
		await this.page.waitForLoadState('networkidle');
	}

	async navigateToProcessAdminsMobile(): Promise<void> {
		await this.openMobileDropdown();
		await this.processAdminsLink.last().click();
		await this.page.waitForLoadState('networkidle');
	}

	async navigateToModerationsMobile(): Promise<void> {
		await this.openMobileDropdown();
		await this.moderationsLink.last().click();
		await this.page.waitForLoadState('networkidle');
	}

	// Active state checks
	async isAboutProcessActive(): Promise<boolean> {
		const activeLink = await this.aboutProcessLink.first().getAttribute('aria-current');
		return activeLink === 'page';
	}

	async isLandingPageActive(): Promise<boolean> {
		const activeLink = await this.landingPageLink.first().getAttribute('aria-current');
		return activeLink === 'page';
	}

	async isPhasesActive(): Promise<boolean> {
		const activeLink = await this.phasesLink.first().getAttribute('aria-current');
		return activeLink === 'page';
	}

	async isComponentsActive(): Promise<boolean> {
		const activeLink = await this.componentsLink.first().getAttribute('aria-current');
		return activeLink === 'page';
	}

	async isCategoriesActive(): Promise<boolean> {
		const activeLink = await this.categoriesLink.first().getAttribute('aria-current');
		return activeLink === 'page';
	}

	async isAttachmentsActive(): Promise<boolean> {
		const activeLink = await this.attachmentsLink.first().getAttribute('aria-current');
		return activeLink === 'page';
	}

	async isProcessAdminsActive(): Promise<boolean> {
		const activeLink = await this.processAdminsLink.first().getAttribute('aria-current');
		return activeLink === 'page';
	}

	async isModerationsActive(): Promise<boolean> {
		const activeLink = await this.moderationsLink.first().getAttribute('aria-current');
		return activeLink === 'page';
	}

	// URL-based checks (alternative to aria-current)
	async getCurrentActiveSection(): Promise<string> {
		const currentUrl = this.page.url();

		if (currentUrl.includes('/edit') && !currentUrl.includes('/landing_page/edit')) {
			return 'about';
		} else if (currentUrl.includes('/landing_page/edit')) {
			return 'landing_page';
		} else if (currentUrl.includes('/steps')) {
			return 'phases';
		} else if (currentUrl.includes('/components')) {
			return 'components';
		} else if (currentUrl.includes('/categories')) {
			return 'categories';
		} else if (currentUrl.includes('/attachments')) {
			return 'attachments';
		} else if (currentUrl.includes('/user_roles')) {
			return 'process_admins';
		} else if (currentUrl.includes('/moderations')) {
			return 'moderations';
		}

		return 'unknown';
	}

	// Utility methods
	async getAllMenuLinks(): Promise<string[]> {
		const links = await this.desktopMenu.locator('a').allTextContents();
		return links.filter(text => text.trim().length > 0);
	}

	async getMenuLinkHref(linkText: string): Promise<string | null> {
		const link = this.desktopMenu.locator(`a:has-text("${linkText}")`);
		return await link.getAttribute('href');
	}

	// Accessibility checks
	async checkAccessibility(): Promise<void> {
		// Check that menu items have proper roles
		await expect(this.desktopMenu.locator('li[role="menuitem"]')).toHaveCount(8);

		// Check that mobile dropdown has proper ARIA attributes
		await expect(this.mobileDropdownButton).toHaveAttribute('aria-haspopup', 'true');
		await expect(this.mobileDropdownButton).toHaveAttribute('aria-controls', 'dropdown-menu-sidebar');

		// Check that mobile menu has proper ARIA attributes
		await expect(this.mobileDropdownMenu).toHaveAttribute('role', 'menu');
		await expect(this.mobileDropdownMenu).toHaveAttribute('aria-labelledby');
	}
}
