import { Page, Locator } from '@playwright/test';
import { AdminHeaderComponent } from '../../AdminHeaderComponent';
import { AdminNavigationComponent } from '../../AdminNavigationComponent';
import { GlobalModerationBreadcrumbComponent } from './GlobalModerationBreadcrumbComponent';
import { GlobalModerationSidebarComponent } from './GlobalModerationSidebarComponent';
import { GlobalModerationPageHeaderComponent } from './GlobalModerationPageHeaderComponent';
import { GlobalModerationFiltersComponent } from './GlobalModerationFiltersComponent';
import { GlobalModerationTableComponent, GlobalModerationRowData } from './GlobalModerationTableComponent';
import { FlashMessageComponent } from '../process/FlashMessageComponent';

/**
 * Main page object for the Global Moderation admin page.
 * Orchestrates all component objects to represent the complete page based on the HTML structure.
 */
export class GlobalModerationPage {
	private readonly page: Page;

	// Component objects representing different sections of the page
	public readonly header: AdminHeaderComponent;
	public readonly navigation: AdminNavigationComponent;
	public readonly breadcrumb: GlobalModerationBreadcrumbComponent;
	public readonly sidebar: GlobalModerationSidebarComponent;
	public readonly pageHeader: GlobalModerationPageHeaderComponent;
	public readonly filters: GlobalModerationFiltersComponent;
	public readonly table: GlobalModerationTableComponent;
	public readonly flashMessage: FlashMessageComponent;

	// Page-specific locators based on the provided HTML structure
	private readonly main: Locator;
	private readonly layoutWrapper: Locator;
	private readonly layoutContent: Locator;
	private readonly layoutContentContainer: Locator;
	private readonly sidebarContainer: Locator;
	private readonly itemShowWrapper: Locator;

	constructor(page: Page) {
		this.page = page;

		// Initialize all component objects
		this.header = new AdminHeaderComponent(page);
		this.navigation = new AdminNavigationComponent(page);
		this.breadcrumb = new GlobalModerationBreadcrumbComponent(page);
		this.sidebar = new GlobalModerationSidebarComponent(page);
		this.pageHeader = new GlobalModerationPageHeaderComponent(page);
		this.filters = new GlobalModerationFiltersComponent(page);
		this.table = new GlobalModerationTableComponent(page);
		this.flashMessage = new FlashMessageComponent(page);

		// Page-specific locators from the HTML structure
		this.main = page.locator('main.main');
		this.layoutWrapper = page.locator('.layout-wrapper');
		this.layoutContent = page.locator('.layout-content');
		this.layoutContentContainer = page.locator('.layout-content__container-sidebar');
		this.sidebarContainer = page.locator('.sidebar-menu__container');
		this.itemShowWrapper = page.locator('.item_show__wrapper');
	}

	/**
	 * Navigate to the Global Moderation page
	 */
	async goto(): Promise<void> {
		await this.page.goto('/admin/moderations');
		await this.waitForPageToLoad();
	}

	/**
	 * Wait for the complete page to load
	 */
	async waitForPageToLoad(): Promise<void> {
		await this.main.waitFor({ state: 'visible' });
		await this.breadcrumb.waitForBreadcrumbToLoad();
		await this.sidebar.waitForSidebarToLoad();
		await this.pageHeader.waitForHeaderToLoad();
		await this.filters.waitForFiltersToLoad();
		await this.table.waitForTableToLoad();
	}

	/**
	 * Check if the page is fully loaded and visible
	 */
	async isPageLoaded(): Promise<boolean> {
		try {
			const mainVisible = await this.main.isVisible();
			const breadcrumbVisible = await this.breadcrumb.isVisible();
			const sidebarVisible = await this.sidebar.isVisible();
			const headerVisible = await this.pageHeader.isVisible();
			const filtersVisible = await this.filters.isVisible();
			const tableVisible = await this.table.isVisible();

			return (
				mainVisible && breadcrumbVisible && sidebarVisible && headerVisible && filtersVisible && tableVisible
			);
		} catch {
			return false;
		}
	}

	/**
	 * Get the current page title from the page header
	 */
	async getPageTitle(): Promise<string> {
		return await this.pageHeader.getPageTitle();
	}

	/**
	 * Navigate to the reported content view
	 */
	async navigateToReportedContent(): Promise<void> {
		await this.sidebar.navigateToReportedContent();
		await this.waitForPageToLoad();
	}

	/**
	 * Navigate to the reported participants view
	 */
	async navigateToReportedParticipants(): Promise<void> {
		await this.sidebar.navigateToReportedParticipants();
		await this.waitForPageToLoad();
	}

	/**
	 * Switch to "Not hidden" filter view
	 */
	async switchToNotHiddenView(): Promise<void> {
		await this.pageHeader.clickNotHiddenFilter();
		await this.waitForPageToLoad();
	}

	/**
	 * Switch to "Hidden" filter view
	 */
	async switchToHiddenView(): Promise<void> {
		await this.pageHeader.clickHiddenFilter();
		await this.waitForPageToLoad();
	}

	/**
	 * Perform a search for moderation items
	 */
	async searchModerationItems(searchTerm: string): Promise<void> {
		await this.filters.performSearch(searchTerm);
		await this.table.waitForTableToLoad();
	}

	/**
	 * Clear the search and reset to default view
	 */
	async clearSearch(): Promise<void> {
		await this.filters.clearSearchText();
		await this.filters.submitSearch();
		await this.table.waitForTableToLoad();
	}

	/**
	 * Open the filter dropdown
	 */
	async openFilterDropdown(): Promise<void> {
		await this.filters.openFilterDropdown();
	}

	/**
	 * Sort moderations by reported date
	 */
	async sortByReportedAt(): Promise<void> {
		await this.table.sortByReportedAt();
		await this.table.waitForTableToLoad();
	}

	/**
	 * Sort moderations by reports count
	 */
	async sortByReportsCount(): Promise<void> {
		await this.table.sortByReportsCount();
		await this.table.waitForTableToLoad();
	}

	/**
	 * Get all moderation rows data
	 */
	async getAllModerationData(): Promise<GlobalModerationRowData[]> {
		return await this.table.getAllRowData();
	}

	/**
	 * Get specific moderation row data by index
	 */
	async getModerationRowData(index: number): Promise<GlobalModerationRowData> {
		return await this.table.getRowData(index);
	}

	/**
	 * Perform action on a specific moderation row
	 */
	async expandModerationRow(rowIndex: number): Promise<void> {
		await this.table.clickExpandAction(rowIndex);
	}

	/**
	 * Unreport a specific moderation item
	 */
	async unreportModerationItem(rowIndex: number): Promise<void> {
		await this.table.clickUnreportAction(rowIndex);
		await this.flashMessage.waitForSuccessMessage();
	}

	/**
	 * Hide a specific moderation item
	 */
	async hideModerationItem(rowIndex: number): Promise<void> {
		await this.table.clickHideAction(rowIndex);
		await this.flashMessage.waitForSuccessMessage();
	}

	/**
	 * Visit the URL of a specific moderation item
	 */
	async visitModerationItemUrl(rowIndex: number): Promise<void> {
		await this.table.clickVisitUrl(rowIndex);
	}

	/**
	 * Check if a flash message is displayed
	 */
	async hasFlashMessage(): Promise<boolean> {
		return await this.flashMessage.isFlashMessageVisible();
	}

	/**
	 * Get the flash message text
	 */
	async getFlashMessageText(): Promise<string> {
		return await this.flashMessage.getFlashMessageText();
	}

	/**
	 * Close the flash message
	 */
	async closeFlashMessage(): Promise<void> {
		await this.flashMessage.dismissFlashMessage();
	}

	/**
	 * Check if the page is in "Not hidden" view
	 */
	async isInNotHiddenView(): Promise<boolean> {
		return await this.pageHeader.isNotHiddenFilterActive();
	}

	/**
	 * Check if the page is in "Hidden" view
	 */
	async isInHiddenView(): Promise<boolean> {
		return await this.pageHeader.isHiddenFilterActive();
	}

	/**
	 * Check if currently on the reported content section
	 */
	async isOnReportedContentSection(): Promise<boolean> {
		return await this.sidebar.isReportedContentActive();
	}

	/**
	 * Check if currently on the reported participants section
	 */
	async isOnReportedParticipantsSection(): Promise<boolean> {
		return await this.sidebar.isReportedParticipantsActive();
	}

	/**
	 * Get the number of items in the moderation table
	 */
	async getModerationItemsCount(): Promise<number> {
		return await this.table.getRowCount();
	}

	/**
	 * Check if the moderation table is empty
	 */
	async isModerationTableEmpty(): Promise<boolean> {
		return await this.table.isEmpty();
	}

	/**
	 * Find a moderation item by its ID
	 */
	async findModerationItemByIdValue(idValue: string): Promise<number> {
		return await this.table.findRowByIdValue(idValue);
	}

	/**
	 * Get available actions for a specific moderation row
	 */
	async getAvailableActionsForRow(rowIndex: number): Promise<string[]> {
		return await this.table.getAvailableActions(rowIndex);
	}

	/**
	 * Verify all page components are properly structured
	 */
	async verifyPageStructure(): Promise<boolean> {
		const breadcrumbValid = await this.breadcrumb.verifyBreadcrumbStructure();
		const sidebarValid = await this.sidebar.verifySidebarStructure();
		const headerValid = await this.pageHeader.verifyHeaderStructure();
		const filtersValid = await this.filters.verifyFiltersStructure();
		const tableValid = await this.table.verifyTableStructure();

		return breadcrumbValid && sidebarValid && headerValid && filtersValid && tableValid;
	}

	/**
	 * Get accessibility information for the entire page
	 */
	async getPageAccessibilityInfo(): Promise<Record<string, any>> {
		return {
			breadcrumb: await this.breadcrumb.getAccessibilityInfo(),
			sidebar: await this.sidebar.getAccessibilityInfo(),
			pageHeader: await this.pageHeader.getAccessibilityInfo(),
			filters: await this.filters.getAccessibilityInfo(),
			table: await this.table.getAccessibilityInfo()
		};
	}

	/**
	 * Perform accessibility checks on all components
	 */
	async checkAccessibility(): Promise<void> {
		await this.breadcrumb.checkAccessibility();
		await this.sidebar.checkAccessibility();
		await this.pageHeader.checkAccessibility();
		await this.filters.checkAccessibility();
		await this.table.checkAccessibility();
	}

	/**
	 * Debug helper - get state of all page components
	 */
	async debugPageState(): Promise<any> {
		return {
			page: {
				loaded: await this.isPageLoaded(),
				title: await this.getPageTitle(),
				url: this.page.url()
			},
			breadcrumb: await this.breadcrumb.debugBreadcrumb(),
			sidebar: await this.sidebar.debugSidebar(),
			pageHeader: await this.pageHeader.debugHeader(),
			filters: await this.filters.debugFilters(),
			table: await this.table.debugTable(),
			flashMessage: {
				visible: await this.flashMessage.isFlashMessageVisible(),
				message: await this.flashMessage.getFlashMessageText()
			}
		};
	}
}
