import { Page, Locator } from '@playwright/test';
import { AdminHeaderComponent } from '../../AdminHeaderComponent';
import { AdminProcessBreadcrumbComponent } from '../../process/AdminProcessBreadcrumbComponent';
import { AdminNavigationComponent } from '../../AdminNavigationComponent';
import { ProcessSidebarComponent } from './ProcessSidebarComponent';
import { ModerationPageHeaderComponent } from './ModerationPageHeaderComponent';
import { ModerationTableComponent, ModerationRowData } from './ModerationTableComponent';
import { FlashMessageComponent } from './FlashMessageComponent';

/**
 * Main page object for the Process Moderation page.
 * Combines all the component objects to represent the complete page.
 */
export class ProcessModerationPage {
	private readonly page: Page;

	// Component objects
	public readonly header: AdminHeaderComponent;
	public readonly breadcrumb: AdminProcessBreadcrumbComponent;
	public readonly sidebarNavigation: AdminNavigationComponent;
	public readonly processSidebar: ProcessSidebarComponent;
	public readonly pageHeader: ModerationPageHeaderComponent;
	public readonly table: ModerationTableComponent;
	public readonly flashMessage: FlashMessageComponent;

	// Page-specific locators
	private readonly main: Locator;
	private readonly layoutWrapper: Locator;
	private readonly layoutContent: Locator;
	private readonly layoutContentContainer: Locator;

	constructor(page: Page) {
		this.page = page;

		// Initialize components
		this.header = new AdminHeaderComponent(page);
		this.breadcrumb = new AdminProcessBreadcrumbComponent(page);
		this.sidebarNavigation = new AdminNavigationComponent(page);
		this.processSidebar = new ProcessSidebarComponent(page);
		this.pageHeader = new ModerationPageHeaderComponent(page);
		this.table = new ModerationTableComponent(page);
		this.flashMessage = new FlashMessageComponent(page);

		// Page-specific locators
		this.main = page.locator('main.main');
		this.layoutWrapper = page.locator('.layout-wrapper');
		this.layoutContent = page.locator('.layout-content');
		this.layoutContentContainer = page.locator('.layout-content__container-sidebar');
	}

	// Page navigation
	async navigateToPage(processSlug: string): Promise<void> {
		await this.page.goto(`/admin/participatory_processes/${processSlug}/moderations`);
		await this.page.waitForLoadState('networkidle');
	}

	async navigateToHiddenModerations(processSlug: string): Promise<void> {
		await this.page.goto(`/admin/participatory_processes/${processSlug}/moderations?hidden=true`);
		await this.page.waitForLoadState('networkidle');
	}

	async navigateToMainModerationListing(processSlug: string): Promise<void> {
		// Navigate to the main moderation listing (not a detail page)
		await this.page.goto(`/admin/participatory_processes/${processSlug}/moderations`);
		await this.page.waitForLoadState('networkidle');

		// Ensure we're on the main listing page, not a detail page
		await this.ensureOnMainListing();
	}

	async ensureOnMainListing(): Promise<void> {
		const url = this.page.url();

		// If we're on a detail page (contains moderation ID or reports), navigate back to listing
		if (url.match(/\/moderations\/\d+/) || url.includes('/reports')) {
			console.log('Detected detail page, navigating back to main listing');
			const processSlug = await this.getCurrentProcessSlug();
			if (processSlug) {
				await this.page.goto(`/admin/participatory_processes/${processSlug}/moderations`);
			} else {
				// Fallback to global moderations page
				await this.page.goto('/admin/moderations');
			}
			await this.page.waitForLoadState('networkidle');
		}
	}

	// Page state checks
	async isPageLoaded(): Promise<boolean> {
		try {
			// Check if we're on a moderation page first
			const isOnCorrectPage = await this.isOnModerationPage();

			// Check if main content is visible
			const isMainVisible = await this.main.isVisible();

			// Check if table is visible (with a more lenient approach)
			const isTableVisible = await this.table.isTableVisible();

			return isOnCorrectPage && isMainVisible && isTableVisible;
		} catch (error) {
			console.log('Error checking if page is loaded:', error);
			return false;
		}
	}

	async isOnModerationPage(): Promise<boolean> {
		const url = this.page.url();
		// Check for both process-specific moderations and general admin moderations
		return (
			url.includes('/moderations') &&
			(url.includes('/admin/participatory_processes/') || url.includes('/admin/moderations'))
		);
	}

	async isOnMainModerationListing(): Promise<boolean> {
		const url = this.page.url();
		// Check if we're on the main listing page (not a detail page)
		return (await this.isOnModerationPage()) && !url.match(/\/moderations\/\d+/) && !url.includes('/reports');
	}

	async getCurrentProcessSlug(): Promise<string> {
		const url = this.page.url();
		const match = url.match(/\/admin\/participatory_processes\/([^\/]+)/);
		return match ? match[1] : '';
	}

	async isShowingHiddenContent(): Promise<boolean> {
		const url = this.page.url();
		return url.includes('hidden=true');
	}

	// Common page actions
	async refreshPage(): Promise<void> {
		await this.page.reload();
		await this.page.waitForLoadState('networkidle');
	}

	async waitForPageLoad(): Promise<void> {
		await this.page.waitForLoadState('networkidle');
		await this.main.waitFor({ state: 'visible' });
	}

	// Combined actions using multiple components
	async searchAndFilter(searchTerm: string, filterType?: 'comment' | 'proposal'): Promise<void> {
		if (filterType) {
			await this.pageHeader.filterByType(filterType);
		}

		if (searchTerm) {
			await this.pageHeader.searchModerations(searchTerm);
		}
	}

	async switchToHiddenView(): Promise<void> {
		await this.pageHeader.clickHiddenFilter();
	}

	async switchToNotHiddenView(): Promise<void> {
		await this.pageHeader.clickNotHiddenFilter();
	}

	async performBulkAction(action: 'hide' | 'unreport', rowIndices: number[]): Promise<void> {
		for (const index of rowIndices) {
			if (action === 'hide') {
				await this.table.hideRow(index);
			} else {
				await this.table.unreportRow(index);
			}
		}
	}

	async getModerationSummary(): Promise<ModerationSummary> {
		const rowCount = await this.table.getRowCount();
		const currentFilter = await this.pageHeader.getCurrentFilterState();
		const activeFilters = await this.pageHeader.getActiveFilters();
		const searchTerm = await this.pageHeader.getSearchValue();

		return {
			totalItems: rowCount,
			currentView: currentFilter,
			activeFilters,
			searchTerm,
			hasData: rowCount > 0
		};
	}

	// Mobile responsiveness
	async isMobileView(): Promise<boolean> {
		return await this.processSidebar.isMobileDropdownVisible();
	}

	async isDesktopView(): Promise<boolean> {
		return await this.processSidebar.isDesktopMenuVisible();
	}

	// Responsive navigation
	async navigateToAboutProcess(): Promise<void> {
		const isMobile = await this.isMobileView();
		if (isMobile) {
			await this.processSidebar.navigateToAboutProcessMobile();
		} else {
			await this.processSidebar.navigateToAboutProcess();
		}
	}

	async navigateToComponents(): Promise<void> {
		const isMobile = await this.isMobileView();
		if (isMobile) {
			await this.processSidebar.openMobileDropdown();
			await this.processSidebar.navigateToComponents();
		} else {
			await this.processSidebar.navigateToComponents();
		}
	}

	// Data retrieval methods
	async getAllModerationData(): Promise<ModerationRowData[]> {
		return await this.table.getAllRowsData();
	}

	async getModerationDataByType(type: 'Comment' | 'Proposal'): Promise<ModerationRowData[]> {
		return await this.table.getRowsByType(type);
	}

	async findModerationById(id: string): Promise<ModerationRowData | null> {
		return await this.table.findRowByContentId(id);
	}

	// Workflow methods
	async reviewModeration(rowIndex: number): Promise<void> {
		// First expand to view details
		await this.table.expandRow(rowIndex);

		// This would typically open a detail page
		// where further review actions can be taken
	}

	async quickHideModeration(rowIndex: number): Promise<void> {
		await this.table.hideRow(rowIndex);
	}

	async quickUnreportModeration(rowIndex: number): Promise<void> {
		await this.table.unreportRow(rowIndex);
	}

	// Accessibility methods
	async checkPageAccessibility(): Promise<void> {
		// Header and navigation accessibility would be checked separately
		// await this.header.checkAccessibility(); // Not available in AdminHeaderComponent
		// await this.sidebarNavigation.checkAccessibility(); // Not available in AdminNavigationComponent
		await this.processSidebar.checkAccessibility();
	}

	// Debug methods
	async debugPageState(): Promise<void> {
		console.log('=== Process Moderation Page Debug State ===');
		console.log('Page loaded:', await this.isPageLoaded());
		console.log('Current process slug:', await this.getCurrentProcessSlug());
		console.log('Is mobile view:', await this.isMobileView());
		console.log('Is showing hidden content:', await this.isShowingHiddenContent());
		console.log('Current URL:', this.page.url());

		// Debug individual components
		// await this.breadcrumb.debugBreadcrumbState(); // Not available in AdminProcessBreadcrumbComponent
		await this.processSidebar.debugSidebarState();
		await this.pageHeader.debugHeaderState();
		await this.table.debugTableState();

		console.log('===========================================');
	}
}

// Interface for moderation summary
export interface ModerationSummary {
	totalItems: number;
	currentView: 'not_hidden' | 'hidden';
	activeFilters: string[];
	searchTerm: string;
	hasData: boolean;
}

// Re-export types for convenience
export type { ModerationRowData } from './ModerationTableComponent';
