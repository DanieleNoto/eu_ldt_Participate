/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Simone Bianchelli
 * Denis Vasilev Dimchev
 * Antonio Abramo Carotenuto
 */

import { Page, Locator, expect } from '@playwright/test';
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
		await this.page.waitForLoadState('load');
	}

	async navigateToHiddenModerations(processSlug: string): Promise<void> {
		await this.page.goto(`/admin/participatory_processes/${processSlug}/moderations?hidden=true`);
		await this.page.waitForLoadState('load');
	}

	async navigateToMainModerationListing(processSlug: string): Promise<void> {
		// Navigate to the main moderation listing (not a detail page)
		await this.page.goto(`/admin/participatory_processes/${processSlug}/moderations`);
		await this.page.waitForLoadState('load');

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
			await this.page.waitForLoadState('load');
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
			const errorMessage = error instanceof Error ? error.message : String(error);
			console.log('Error checking if page is loaded:', errorMessage);
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
		await this.page.waitForLoadState('load');
	}

	async waitForPageLoad(): Promise<void> {
		await this.page.waitForLoadState('load');
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

	/**
	 * Verify detail page is fully loaded with all metadata and reports table
	 * @returns Promise<boolean> true if all elements are visible and loaded
	 */
	async verifyDetailPageLoaded(): Promise<boolean> {
		try {
			// Verify main container is visible
			const detailsVisible = await this.page.locator('.moderation-details').isVisible();
			if (!detailsVisible) {
				console.warn('Detail page: .moderation-details container not visible');
				return false;
			}

			// Verify required metadata fields are present
			const requiredMetadataFields = ['Reported content URL', 'ID', 'Type', 'Reported at', 'Author(s)'];

			for (const field of requiredMetadataFields) {
				const fieldExists = await this.page.locator(`.moderation-details dt:has-text("${field}")`).isVisible();
				if (!fieldExists) {
					console.warn(`Detail page: Missing required metadata field: ${field}`);
					return false;
				}
			}

			// Verify reports table is visible
			const tableVisible = await this.page.locator('.table-scroll table.table-list').isVisible();
			if (!tableVisible) {
				console.warn('Detail page: Reports table not visible');
				return false;
			}

			// Verify table headers are present by checking all headers at once
			const tableHeaders = await this.page.locator('.table-list thead th').allTextContents();
			const normalizedHeaders = tableHeaders.map(h => h.trim());

			console.log(`Detail page: Found table headers: [${normalizedHeaders.join(', ')}]`);

			const requiredHeaders = ['Reason', 'Language', 'Reason details', 'Actions'];

			for (const header of requiredHeaders) {
				if (!normalizedHeaders.includes(header)) {
					console.warn(`Detail page: Missing table header: ${header}`);
					console.warn(`Detail page: Available headers: [${normalizedHeaders.join(', ')}]`);
					return false;
				}
			}

			console.log('Detail page: All required table headers verified successfully');
			return true;
		} catch (error) {
			if (error instanceof Error) {
				console.error('Error verifying detail page loaded:', error.message);
				throw error;
			}
			throw new Error('Unknown error occurred while verifying detail page loaded');
		}
	}

	/**
	 * Get metadata from detail page
	 * @returns Promise with metadata object containing all detail page fields
	 */
	async getDetailPageMetadata(): Promise<{
		url: string;
		id: string;
		type: string;
		reportedAt: string;
		authors: string[];
		participatorySpace: string;
		reportedContent: string;
	}> {
		const metadata = {
			url: '',
			id: '',
			type: '',
			reportedAt: '',
			authors: [] as string[],
			participatorySpace: '',
			reportedContent: ''
		};

		try {
			// Helper function to get value from dt/dd pairs
			const getValue = async (label: string): Promise<string> => {
				const dt = this.page.locator(`.moderation-details dt:has-text("${label}")`);
				const dd = dt.locator('+ dd');
				const text = await dd.textContent();
				return text?.trim() || '';
			};

			metadata.url = await getValue('Reported content URL');
			metadata.id = await getValue('ID');
			metadata.type = await getValue('Type');
			metadata.reportedAt = await getValue('Reported at');
			metadata.participatorySpace = await getValue('Participatory space');

			// Handle authors list separately
			const authorsText = await this.page
				.locator('.moderation-details dt:has-text("Author(s)") + dd')
				.textContent();
			metadata.authors = authorsText ? [authorsText.trim()] : [];

			// Extract reported content text from blockquote
			const reportedContentElement = this.page.locator(
				'.moderation-details dd.reported-content blockquote p[sanitize="true"]'
			);
			const reportedContentText = await reportedContentElement.first().textContent();
			metadata.reportedContent = reportedContentText?.trim() || '';

			console.log(`Extracted reported content text: "${metadata.reportedContent}"`);

			return metadata;
		} catch (error) {
			if (error instanceof Error) {
				console.error('Error getting detail page metadata:', error.message);
				throw error;
			}
			throw new Error('Unknown error occurred while getting detail page metadata');
		}
	}

	/**
	 * Verify metadata fields are populated with actual data
	 * @returns Promise<boolean> true if essential fields contain data
	 */
	async verifyMetadataPopulated(): Promise<boolean> {
		try {
			const metadata = await this.getDetailPageMetadata();

			const isPopulated =
				metadata.url !== '' &&
				metadata.id !== '' &&
				metadata.type !== '' &&
				metadata.reportedAt !== '' &&
				metadata.authors.length > 0 &&
				metadata.reportedContent !== '';

			if (!isPopulated) {
				console.warn('Detail page: Metadata not fully populated:', metadata);
			} else {
				console.log('Detail page: All metadata fields populated successfully');
				console.log(`Reported content: "${metadata.reportedContent}"`);
			}

			return isPopulated;
		} catch (error) {
			if (error instanceof Error) {
				console.error('Error verifying metadata populated:', error.message);
				throw error;
			}
			throw new Error('Unknown error occurred while verifying metadata populated');
		}
	}

	/**
	 * Get content ID from detail page metadata
	 * Extracts the actual content/report ID from the detail page "ID" field
	 * @returns Promise<string> The content ID
	 */
	async getContentIdFromDetailPage(): Promise<string> {
		try {
			const idElement = this.page.locator('.moderation-details dt:has-text("ID") + dd');
			const idText = await idElement.textContent();
			const contentId = idText?.trim() || '';

			if (!contentId) {
				throw new Error('Could not extract content ID from detail page');
			}

			console.log(`Extracted content ID from detail page: ${contentId}`);
			return contentId;
		} catch (error) {
			if (error instanceof Error) {
				console.error('Error getting content ID from detail page:', error.message);
				throw error;
			}
			throw new Error('Unknown error occurred while getting content ID from detail page');
		}
	}

	/**
	 * Verify a content ID exists in the current table
	 * Searches the ID column (second column) for the specified content ID
	 * @param contentId The content ID to search for
	 * @returns Promise<boolean> True if ID is found in current table
	 */
	async verifyContentIdInCurrentTable(contentId: string): Promise<boolean> {
		try {
			// Wait for table rows to be visible
			await this.page.locator('.table-list tbody tr').first().waitFor({ state: 'visible' });

			// Get all ID cells from the second column (ID column)
			const idCells = await this.page.locator('.table-list tbody tr td:nth-child(2)').allTextContents();

			// Clean up the IDs (remove whitespace and empty entries)
			const ids = idCells.map(id => id.trim()).filter(id => id !== '');

			const found = ids.includes(contentId);

			console.log(`Searching for content ID ${contentId} in table ID column`);
			console.log(`Found IDs: [${ids.join(', ')}]`);
			console.log(`Result: ${found ? 'found' : 'not found'}`);

			return found;
		} catch (error) {
			if (error instanceof Error) {
				console.error('Error checking content ID in table:', error.message);
				throw error;
			}
			throw new Error('Unknown error occurred while checking table');
		}
	}

	/**
	 * Navigate to hidden list and verify content ID is present using provided process slug
	 * @param contentId The content ID to verify
	 * @param processSlug The process slug to use for navigation
	 * @returns Promise<boolean> True if ID is found in hidden list
	 */
	async verifyContentIdInHiddenListWithSlug(contentId: string, processSlug: string): Promise<boolean> {
		console.log(`Verifying content ID ${contentId} is in hidden list for process: ${processSlug}`);

		if (!processSlug) {
			throw new Error('Cannot verify hidden list: process slug is required');
		}

		await this.page.goto(`/admin/participatory_processes/${processSlug}/moderations?hidden=true`);
		await this.page.waitForLoadState('load');

		// Wait for table to be fully loaded
		await this.page.locator('.table-list').waitFor({ state: 'visible' });

		const isInHidden = await this.verifyContentIdInCurrentTable(contentId);

		return isInHidden;
	}

	/**
	 * Perform bulk unhide on all selected items
	 * @returns Promise<void>
	 */
	async bulkUnhideAll(): Promise<void> {
		const selectedCount = await this.table.getSelectedCount();

		if (selectedCount === 0) {
			console.warn('No moderations selected for bulk unhide');
			return;
		}

		console.log(`Performing bulk unhide on ${selectedCount} moderation(s)...`);

		// Open Actions dropdown
		const actionsButton = this.page.locator('button#js-bulk-actions-button');
		await actionsButton.click();

		// Wait for dropdown to be visible
		const dropdown = this.page.locator('#js-bulk-actions-dropdown');
		await dropdown.waitFor({ state: 'visible' });

		// Click Unhide button in dropdown
		const unhideButton = this.page.locator('button[data-action="unhide-global-moderations"]');
		await unhideButton.click();

		// Wait for confirmation button to appear and be visible
		const confirmButton = this.page.locator('button#js-submit-unhide-global-moderations');
		await confirmButton.waitFor({ state: 'visible' });
		await confirmButton.click();

		// Wait for action to complete
		await this.page.waitForLoadState('load');

		console.log(`Bulk unhide action confirmed and completed`);
	}

	/**
	 * Cleanup all hidden content by unhiding everything
	 * Used in test cleanup to restore data to initial state
	 * @returns Promise<void>
	 */
	async cleanupHiddenContent(): Promise<void> {
		try {
			console.log('Starting cleanup of hidden content...');

			const processSlug = await this.getCurrentProcessSlug();

			if (!processSlug) {
				console.warn('Cannot cleanup without process context');
				return;
			}

			// Navigate to hidden list
			await this.page.goto(`/admin/participatory_processes/${processSlug}/moderations?hidden=true`);
			await this.page.waitForLoadState('load');

			// Check if table exists and is visible before proceeding
			const tableExists = await this.page
				.locator('.table-list')
				.isVisible()
				.catch(() => false);

			if (!tableExists) {
				console.log('No moderation table found, nothing to clean up');
				return;
			}

			// Wait for table to load
			await this.page.locator('.table-list').waitFor({ state: 'visible' });

			// Check row count
			const hiddenCount = await this.table.getRowCount();
			console.log(`Found ${hiddenCount} hidden item(s)`);

			if (hiddenCount === 0) {
				console.log('No hidden content to cleanup');
				return;
			}

			console.log(`Unhiding all ${hiddenCount} hidden item(s)...`);

			// Select all items
			await this.table.selectAll();

			// Wait for header checkbox to be checked using expect assertion
			const checkboxHeader = this.page.locator('input#moderations_bulk');
			try {
				await checkboxHeader.check();
				// Verify it was checked
				const isChecked = await checkboxHeader.isChecked();
				if (!isChecked) {
					console.warn('Header checkbox not checked after check() call');
				}
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : String(error);
				console.warn('Error checking header checkbox, continuing anyway:', errorMessage);
			}

			// Verify selection
			const selectedCount = await this.table.getSelectedCount();
			console.log(`Selected ${selectedCount} item(s) for bulk unhide`);

			if (selectedCount === 0) {
				console.warn('Failed to select items - trying alternative approach');

				// Retry selection
				await this.table.selectAll();

				const retryCount = await this.table.getSelectedCount();
				if (retryCount === 0) {
					throw new Error('Unable to select hidden items for cleanup');
				}
				console.log(`Retry successful: ${retryCount} items selected`);
			}

			// Perform bulk unhide
			await this.bulkUnhideAll();

			// Verify cleanup
			await this.page.goto(`/admin/participatory_processes/${processSlug}/moderations?hidden=true`);
			await this.page.waitForLoadState('load');

			// Check if table still exists before proceeding with verification
			const tableStillExists = await this.page
				.locator('.table-list')
				.isVisible()
				.catch(() => false);

			if (!tableStillExists) {
				console.log('Cleanup completed successfully - no hidden table visible');
				return;
			}

			// Wait for table to load
			await this.page.locator('.table-list').waitFor({ state: 'visible' });

			const remainingHidden = await this.table.getRowCount();
			if (remainingHidden > 0) {
				console.warn(`Cleanup incomplete: ${remainingHidden} items still hidden`);
			} else {
				console.log('Cleanup completed successfully - all items unhidden');
			}
		} catch (error) {
			if (error instanceof Error) {
				console.error('Error during cleanup:', error.message);
			} else {
				console.error('Unknown error during cleanup');
			}
		}
	}

	/**
	 * Navigate to a specific debate within a process
	 */
	async navigateToDebate(
		processSlug: string,
		componentId: string | number,
		debateId: string | number
	): Promise<void> {
		await this.page.goto(`/processes/${processSlug}/f/${componentId}/debates/${debateId}`);
	}

	/**
	 * Verify that a comment has been moderated (hidden from public view).
	 * A moderated comment will have the .comment__moderated div instead of the original content.
	 */
	async verifyCommentNotPresentById(commentId: string): Promise<boolean> {
		const selector = `#comment_${commentId}`;
		const commentLocator = this.page.locator(selector);
		const moderatedLocator = commentLocator.locator('.comment__moderated');

		// Poll the comment's final state
		try {
			await expect
				.poll(async () => {
					// Case 1: comment element absent from DOM (fully removed after moderation)
					const count = await commentLocator.count();
					if (count === 0) return 'absent';

					// Case 2: comment present but replaced by moderated placeholder
					const isModerated = await moderatedLocator.isVisible().catch(() => false);
					if (isModerated) return 'moderated';

					// Case 3: comment still fully visible (not yet moderated)
					return 'visible';
				})
				.toMatch(/absent|moderated/);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			console.warn(
				`Comment with id ${selector} is still visible and not moderated after waiting: ${errorMessage}`
			);
			return false;
		}

		const count = await commentLocator.count();
		if (count === 0) {
			console.log(`Comment with id ${selector} is not present in DOM`);
			return true;
		}

		const moderationText = await moderatedLocator.textContent().catch(() => '');
		console.log(`Comment with id ${selector} is correctly moderated: "${moderationText?.trim()}"`);
		return true;
	}

	/**
	 * Verify that a comment is publicly visible (i.e. NOT moderated/hidden).
	 * Use this when the expected outcome is that the comment remains on the page,
	 * e.g. after an "Unreport" action.
	 * @param commentId The ID of the comment (without the '#comment_' prefix)
	 * @returns Promise<boolean> true if the comment element is present and visible
	 */
	async verifyCommentIsVisibleById(commentId: string): Promise<boolean> {
		const commentLocator = this.page.locator(`#comment_${commentId}`);
		try {
			await commentLocator.waitFor({ state: 'visible', timeout: 10000 });
			const moderatedLocator = commentLocator.locator('.comment__moderated');
			const isModerated = await moderatedLocator.isVisible().catch(() => false);
			if (isModerated) {
				console.warn(`Comment #comment_${commentId} is present but shows moderated placeholder`);
				return false;
			}
			console.log(`Comment #comment_${commentId} is visible and not moderated`);
			return true;
		} catch {
			console.warn(`Comment #comment_${commentId} is not visible`);
			return false;
		}
	}

	/**
	 * Find and return the URL for a specific content ID
	 * @param contentId The content ID to search for
	 * @returns Promise<string> The URL of the reported content
	 */
	async getReportedContentUrlByContentId(contentId: string): Promise<string> {
		try {
			const rows = await this.page.locator('.table-list tbody tr').all();

			for (let i = 0; i < rows.length; i++) {
				const idCell = rows[i].locator('td').nth(1); // ID column
				const idText = await idCell.textContent();

				if (idText?.trim() === contentId) {
					const urlCell = rows[i].locator('td').nth(3);
					const visitUrlLink = urlCell.locator('a:has-text("Visit URL")');

					if (await visitUrlLink.isVisible()) {
						const href = await visitUrlLink.getAttribute('href');
						if (href) {
							console.log(`Found URL for content ID ${contentId}: ${href}`);
							return href;
						}
					}
				}
			}

			throw new Error(`Could not find URL for content ID ${contentId}`);
		} catch (error) {
			if (error instanceof Error) {
				console.error('Error finding URL by content ID:', error.message);
				throw error;
			}
			throw new Error('Unknown error occurred while finding URL');
		}
	}

	/**
	 * Check if a specific content ID is present in the moderation table
	 * @param contentId The content ID to search for
	 * @returns Promise<boolean> True if the content ID is found in the table
	 */
	async isContentIdInModerationTable(contentId: string): Promise<boolean> {
		try {
			const rows = await this.page.locator('.table-list tbody tr').all();

			for (const row of rows) {
				const idCell = row.locator('td').nth(1); // "ID" column (second column)
				const idText = await idCell.textContent();

				if (idText?.trim() === contentId) {
					console.log(`Content ID ${contentId} found in moderation table`);
					return true;
				}
			}

			console.log(`Content ID ${contentId} not found in moderation table`);
			return false;
		} catch (error) {
			if (error instanceof Error) {
				console.error('Error checking if content ID is in moderation table:', error.message);
			}
			return false;
		}
	}

	/**
	 * Report a specific comment by its ID on the debate page
	 * @param commentId The ID of the comment to report
	 * @param reportReason The reason for reporting
	 */
	async reportCommentById(commentId: string, reportReason: string = 'test report content'): Promise<void> {
		try {
			const commentSelector = `#comment_${commentId}`;

			// Wait for comment to be visible and scroll it into view.
			// With long comment lists the element may be below the viewport.
			await this.page.locator(commentSelector).waitFor({ state: 'visible' });
			await this.page.locator(commentSelector).scrollIntoViewIfNeeded();

			// Click the three dots button scoped to the comment container
			const commentContainer = this.page.locator(commentSelector);
			const controlsButton = commentContainer.locator(
				'button[data-controller="dropdown"][aria-label="Comment controls"]'
			);
			await expect(controlsButton).toBeVisible();
			await controlsButton.click();

			// Click the Report button using the data-dialog-open attribute (more specific selector)
			const reportButton = this.page.locator(`button[data-dialog-open="flagModalComment${commentId}"]`);
			await reportButton.waitFor({ state: 'visible' });
			await reportButton.click();

			// Wait for report dialog to be visible
			const reportDialog = this.page.getByRole('dialog');
			await reportDialog.waitFor({ state: 'visible' });

			// Fill in the report reason
			const reasonTextbox = reportDialog.getByRole('textbox', { name: 'Additional comments' });
			await reasonTextbox.fill(reportReason);

			// Submit the form directly via JS to bypass any overlay
			// that may intercept pointer events. requestSubmit() triggers native HTML5 validation
			await this.page.evaluate(dialogId => {
				const dialog = document.getElementById(dialogId);
				const form = dialog?.querySelector<HTMLFormElement>('form');
				if (!form) throw new Error(`Form not found inside dialog #${dialogId}`);
				form.requestSubmit();
			}, `flagModalComment${commentId}`);

			// Wait for the server to confirm the report was created.
			// requestSubmit() triggers an AJAX/Turbo call – without this wait the caller
			// would navigate back to the moderation table before the record is persisted.
			const successConfirmed = await this.waitForReportSuccessMessage();
			if (!successConfirmed) {
				throw new Error(`Report submission for comment ${commentId} did not produce a success message`);
			}

			console.log(`Successfully reported comment ${commentId}`);
		} catch (error) {
			if (error instanceof Error) {
				console.error(`Error reporting comment ${commentId}:`, error.message);
				throw error;
			}
			throw new Error('Unknown error occurred while reporting comment');
		}
	}

	/**
	 * Find row index by content ID in the moderation table
	 * @param contentId The ID of the content to search for
	 * @returns Promise<number> The row index, or -1 if not found
	 */
	async findRowByContentId(contentId: string): Promise<number> {
		try {
			const rows = await this.page.locator('.table-list tbody tr').all();

			for (let i = 0; i < rows.length; i++) {
				const idCell = rows[i].locator('td').nth(1); // "ID" column (second column)
				const idText = await idCell.textContent();

				if (idText?.trim() === contentId) {
					console.log(`Found content ID ${contentId} at row index ${i}`);
					return i;
				}
			}

			console.warn(`Content ID ${contentId} not found in table`);
			return -1;
		} catch (error) {
			if (error instanceof Error) {
				console.error('Error finding row by content ID:', error.message);
			}
			return -1;
		}
	}

	/**
	 * Ensure test comment is reported and ready for moderation
	 * @param testCommentId The ID of the test comment
	 * @param processSlug The process slug
	 * @param componentId The component ID
	 * @param debateId The debate ID
	 * @returns Promise<void>
	 */
	async ensureTestCommentIsReported(
		testCommentId: string,
		processSlug: string,
		componentId: string | number,
		debateId: string | number,
		moderationScope: 'global' | 'process' = 'process'
	): Promise<void> {
		try {
			console.log(`Ensuring test comment ${testCommentId} is reported...`);

			const activeUrl =
				moderationScope === 'global'
					? '/admin/moderations'
					: `/admin/participatory_processes/${processSlug}/moderations`;
			const hiddenUrl =
				moderationScope === 'global'
					? '/admin/moderations?hidden=true'
					: `/admin/participatory_processes/${processSlug}/moderations?hidden=true`;

			// Step 1: check the active (non-hidden) moderation table.
			await this.page.goto(activeUrl);
			await this.page.waitForLoadState('load');
			let isCommentInTable = await this.isContentIdInModerationTable(testCommentId);

			if (!isCommentInTable) {
				// Step 2: the comment might be hidden from a previous test run.
				// In Decidim, "Unhide" restores the moderation record to the active list
				console.log(
					`Comment ID ${testCommentId} not found in active moderation table – checking hidden list...`
				);
				await this.page.goto(hiddenUrl);
				await this.page.waitForLoadState('load');

				const isHidden = await this.isContentIdInModerationTable(testCommentId);
				if (isHidden) {
					console.log(`Comment ID ${testCommentId} is hidden – unhiding to restore active record...`);
					const rows = await this.page.locator('table.table-list tbody tr').all();
					for (const row of rows) {
						const idCell = row.locator('td').nth(1);
						const idText = await idCell.textContent();
						if (idText?.trim() === testCommentId) {
							await row.locator('button[data-controller="dropdown"]').click();
							const unhideLink = row.locator('a.dropdown__button[href*="/unhide"]');
							await unhideLink.waitFor({ state: 'visible' });
							await unhideLink.click();
							await this.page.waitForLoadState('load');
							console.log(`Unhidden comment ID ${testCommentId}`);
							break;
						}
					}

					// After unhiding, Decidim restores the moderation record to the active list –
					// navigate back to the active table and re-check.
					await this.page.goto(activeUrl);
					await this.page.waitForLoadState('load');
					isCommentInTable = await this.isContentIdInModerationTable(testCommentId);
				} else {
					console.log(`Comment ID ${testCommentId} not in hidden list either – will report it now`);
					await this.page.goto(activeUrl);
					await this.page.waitForLoadState('load');
				}
			}

			if (!isCommentInTable) {
				// Step 3: comment is in neither list – navigate to the debate page and report it.
				console.log(`Reporting comment ID ${testCommentId}...`);
				await this.navigateToDebate(processSlug, componentId, debateId);
				await this.page.waitForLoadState('load');

				await this.reportCommentById(testCommentId, 'test report content');
				await this.page.waitForLoadState('load');

				// Navigate back to moderation page to verify
				await this.page.goto(activeUrl);
				await this.page.waitForLoadState('load');
				console.log('Comment reported and moderation page refreshed');
			} else {
				console.log(`Comment ID ${testCommentId} already in active moderation table, skipping report action`);
			}

			// Ensure we're on main listing view
			await this.ensureOnMainListing();

			// Final guard: verify the comment is actually present in the active table.
			const isPresent = await this.isContentIdInModerationTable(testCommentId);
			if (!isPresent) {
				throw new Error(`Failed to ensure comment ${testCommentId} is reported`);
			}

			console.log(`Test comment ${testCommentId} is ready for moderation`);
		} catch (error) {
			if (error instanceof Error) {
				console.error(`Error ensuring test comment is reported:`, error.message);
				throw error;
			}
			throw new Error('Unknown error occurred while ensuring test comment is reported');
		}
	}

	/**
	 * Generate oversized text for testing submission limits
	 */
	generateOversizedText(): string {
		const dummyParagraph =
			'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ';
		const repetitions = 10000;
		const oversizedText = dummyParagraph.repeat(repetitions);
		console.log(`Generated oversized text: ${(oversizedText.length / 1024 / 1024).toFixed(2)}MB`);
		return oversizedText;
	}

	/**
	 * Verify 413 error page is displayed
	 * @returns Promise<boolean> True if 413 error is visible
	 */
	async verify413ErrorPage(): Promise<boolean> {
		try {
			const errorMessageVisible = await this.page
				.locator('text=413')
				.isVisible()
				.catch(() => false);
			const requestEntityErrorVisible = await this.page
				.locator('text=Request Entity Too Large')
				.isVisible()
				.catch(() => false);

			const hasError = errorMessageVisible || requestEntityErrorVisible;
			if (hasError) {
				console.log('413 Request Entity Too Large error page confirmed');
			}
			return hasError;
		} catch (error) {
			if (error instanceof Error) {
				console.error('Error checking 413 error page:', error.message);
			}
			return false;
		}
	}

	/**
	 * Wait for report success message after submitting a report
	 * @returns Promise<boolean> True if success message is visible
	 */
	async waitForReportSuccessMessage(): Promise<boolean> {
		try {
			// Wait for flash container to appear
			const flashContainer = this.page.locator('#flash-messages-container');
			await flashContainer.waitFor({ state: 'visible' });

			// Wait for success flash message
			const successMessage = this.page.locator('.flash.success[role="alert"]');
			await successMessage.waitFor({ state: 'visible' });

			// Get the message text
			const messageText = await successMessage.locator('.flash__message').textContent();
			const hasExpectedMessage = messageText?.includes(
				'The report has been created successfully and it will be reviewed by an admin'
			);

			if (hasExpectedMessage) {
				console.log(`Report success message confirmed: "${messageText?.trim()}"`);
			} else {
				console.warn(`Unexpected success message: "${messageText?.trim()}"`);
			}

			return hasExpectedMessage || false;
		} catch (error) {
			if (error instanceof Error) {
				console.error('Error waiting for success message:', error.message);
			}
			return false;
		}
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
