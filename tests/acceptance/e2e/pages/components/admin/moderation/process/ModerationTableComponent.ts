/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Simone Bianchelli
 * Denis Vasilev Dimchev
 */

import { Locator, Page } from '@playwright/test';

/**
 * Component for the moderation table displaying reported content items.
 * Handles table interactions, row actions, and content display.
 */
export class ModerationTableComponent {
	private readonly page: Page;

	// Main table container
	private readonly tableScroll: Locator;
	private readonly table: Locator;
	private readonly tableHead: Locator;
	private readonly tableBody: Locator;

	// Table headers
	private readonly idHeader: Locator;
	private readonly typeHeader: Locator;
	private readonly urlHeader: Locator;
	private readonly reasonHeader: Locator;
	private readonly reportedAtHeader: Locator;
	private readonly reportsCountHeader: Locator;
	private readonly actionsHeader: Locator;

	// Table rows
	private readonly tableRows: Locator;

	// Row elements (for a specific row)
	private readonly rowId: Locator;
	private readonly rowType: Locator;
	private readonly rowUrl: Locator;
	private readonly rowReason: Locator;
	private readonly rowReportedAt: Locator;
	private readonly rowReportsCount: Locator;
	private readonly rowActions: Locator;

	// Action buttons
	private readonly expandButton: Locator;
	private readonly unreportButton: Locator;
	private readonly hideButton: Locator;

	constructor(page: Page) {
		this.page = page;

		// Main table elements
		this.tableScroll = page.locator('.table-scroll');
		this.table = page.locator('.table-list');
		this.tableHead = page.locator('.table-list thead');
		this.tableBody = page.locator('.table-list tbody');

		// Headers
		this.idHeader = page.locator('th:has-text("ID")');
		this.typeHeader = page.locator('th:has-text("Type")');
		this.urlHeader = page.locator('th:has-text("Reported content URL")');
		this.reasonHeader = page.locator('th:has-text("Reason")');
		this.reportedAtHeader = page.locator('th a.sort_link:has-text("Reported at")');
		this.reportsCountHeader = page.locator('th a.sort_link:has-text("Reports count")');
		this.actionsHeader = page.locator('th:has-text("Actions")');

		// Rows
		this.tableRows = page.locator('.table-list tbody tr');

		// Row elements (generic selectors)
		this.rowId = page.locator('td').first();
		this.rowType = page.locator('td').nth(1);
		this.rowUrl = page.locator('td').nth(2);
		this.rowReason = page.locator('td').nth(3);
		this.rowReportedAt = page.locator('td').nth(4);
		this.rowReportsCount = page.locator('td').nth(5);
		this.rowActions = page.locator('td').nth(6);

		// Action buttons
		this.expandButton = page.locator('a.action-icon.action-icon--expand');
		this.unreportButton = page.locator('a.action-icon.action-icon--unreport');
		this.hideButton = page.locator('a.action-icon.action-icon--hide');
	}

	// Visibility checks
	async isTableVisible(): Promise<boolean> {
		return await this.table.isVisible();
	}

	async isTableHeaderVisible(): Promise<boolean> {
		return await this.tableHead.isVisible();
	}

	async isTableBodyVisible(): Promise<boolean> {
		return await this.tableBody.isVisible();
	}

	async hasData(): Promise<boolean> {
		const rowCount = await this.tableRows.count();
		return rowCount > 0;
	}

	// Table data getters
	async getRowCount(): Promise<number> {
		return await this.tableRows.count();
	}

	async getRowData(rowIndex: number): Promise<ModerationRowData> {
		// Check if we're on the right table type - if not, we need navigation
		const tableType = await this.detectTableType();
		if (tableType !== 'main-listing') {
			throw new Error(
				`NAVIGATION_NEEDED: Cannot extract row data from ${tableType} table. Need to be on main-listing page. Current URL: ${this.page.url()}`
			);
		}

		const row = this.tableRows.nth(rowIndex);

		try {
			// Get URL with proper error handling - it's in a span with tooltip
			let url = '';
			try {
				const urlCell = row.locator('td').nth(3); // "Reported content URL" column (0-indexed: ID=0, Type=1, Participatory space=2, URL=3)
				const urlLink = urlCell.locator('span.has-tip a');
				if (await urlLink.isVisible()) {
					url = (await urlLink.getAttribute('href')) || '';
				}
			} catch (error) {
				console.log('Could not get URL for row', rowIndex, ':', error);
			}

			return {
				id: (await row.locator('td').nth(0).textContent()) || '', // ID column
				type: (await row.locator('td').nth(1).textContent()) || '', // Type column
				url: url, // URL column (with proper handling)
				reason: (await row.locator('td').nth(4).textContent()) || '', // Reason column
				reportedAt: (await row.locator('td').nth(5).textContent()) || '', // Reported at column
				reportsCount: (await row.locator('td').nth(6).textContent()) || '', // Reports count column
				dataId: (await row.getAttribute('data-id')) || ''
			};
		} catch (error) {
			console.log('Error getting row data for row', rowIndex, ':', error);
			return {
				id: '',
				type: '',
				url: '',
				reason: '',
				reportedAt: '',
				reportsCount: '',
				dataId: ''
			};
		}
	}

	async getAllRowsData(): Promise<ModerationRowData[]> {
		const rowCount = await this.getRowCount();
		const rows: ModerationRowData[] = [];

		for (let i = 0; i < rowCount; i++) {
			rows.push(await this.getRowData(i));
		}

		return rows;
	}

	// Row actions
	async expandRow(rowIndex: number): Promise<void> {
		const row = this.tableRows.nth(rowIndex);
		await row.locator('button[data-controller="dropdown"]').click();
		const expandLink = row.locator('a.dropdown__button[href*="/reports"]');
		await expandLink.click();
		await this.page.waitForLoadState('load');
	}

	async unreportRow(rowIndex: number): Promise<void> {
		// Check if we're on a detail page or main listing
		const tableType = await this.detectTableType();

		if (tableType === 'detail-reports') {
			// On detail page, look for the unreport button in the sticky action area
			const unreportButton = this.page.locator('.item__edit-sticky a[href*="/unreport"]');
			await unreportButton.click();
		} else {
			// On main listing, open dropdown then click unreport
			const row = this.tableRows.nth(rowIndex);
			await row.locator('button[data-controller="dropdown"]').click();
			const unreportButton = row.locator('a.dropdown__button[href*="/unreport"]');
			await unreportButton.click();
		}

		await this.page.waitForLoadState('load');
	}

	async hideRow(rowIndex: number): Promise<void> {
		// Check if we're on a detail page or main listing
		const tableType = await this.detectTableType();

		if (tableType === 'detail-reports') {
			// On detail page, look for the hide button in the sticky action area
			const hideButton = this.page.locator('.item__edit-sticky a[href*="/hide"]');
			await hideButton.click();
		} else {
			// On main listing, open dropdown then click hide
			const row = this.tableRows.nth(rowIndex);
			await row.locator('button[data-controller="dropdown"]').click();
			const hideButton = row.locator('a.dropdown__button[href*="/hide"]');
			await hideButton.click();
		}

		await this.page.waitForLoadState('load');
	}

	// Row actions by ID
	async expandRowById(dataId: string): Promise<void> {
		const row = this.tableRows.filter({ has: this.page.locator(`[data-id="${dataId}"]`) });
		await row.locator('button[data-controller="dropdown"]').click();
		const expandLink = row.locator('a.dropdown__button[href*="/reports"]');
		await expandLink.click();
		await this.page.waitForLoadState('load');
	}

	async unreportRowById(dataId: string): Promise<void> {
		const row = this.tableRows.filter({ has: this.page.locator(`[data-id="${dataId}"]`) });
		await row.locator('button[data-controller="dropdown"]').click();
		const unreportButton = row.locator('a.dropdown__button[href*="/unreport"]');
		await unreportButton.click();
		await this.page.waitForLoadState('load');
	}

	async hideRowById(dataId: string): Promise<void> {
		const row = this.tableRows.filter({ has: this.page.locator(`[data-id="${dataId}"]`) });
		await row.locator('button[data-controller="dropdown"]').click();
		const hideButton = row.locator('a.dropdown__button[href*="/hide"]');
		await hideButton.click();
		await this.page.waitForLoadState('load');
	}

	// URL navigation
	async visitReportedContentUrl(rowIndex: number): Promise<void> {
		const row = this.tableRows.nth(rowIndex);
		const urlCell = row.locator('td').nth(3); // Updated column index (URL = 3rd column)
		const urlLink = urlCell.locator('span.has-tip a');

		if (await urlLink.isVisible()) {
			await urlLink.click();
			await this.page.waitForLoadState('load');
		} else {
			console.log('URL link not found for row', rowIndex);
		}
	}

	async getReportedContentUrl(rowIndex: number): Promise<string | null> {
		const row = this.tableRows.nth(rowIndex);
		const urlCell = row.locator('td').nth(3); // Updated column index (URL = 3rd column)
		const urlLink = urlCell.locator('span.has-tip a');

		try {
			if (await urlLink.isVisible()) {
				return await urlLink.getAttribute('href');
			}
		} catch (error) {
			console.log('Could not get URL for row', rowIndex, ':', error);
		}

		return null;
	}

	// Sorting
	async sortByReportedAt(direction: 'asc' | 'desc' = 'desc'): Promise<void> {
		const sortLink = this.reportedAtHeader;

		// Check current sort direction
		const currentClass = await sortLink.getAttribute('class');
		const isCurrentlyDesc = currentClass?.includes('desc');

		// Click if we need to change direction
		if ((direction === 'asc' && isCurrentlyDesc) || (direction === 'desc' && !isCurrentlyDesc)) {
			await sortLink.click();
			await this.page.waitForLoadState('load');
		}
	}

	async sortByReportsCount(direction: 'asc' | 'desc' = 'asc'): Promise<void> {
		const sortLink = this.reportsCountHeader;

		// Check current sort direction
		const currentClass = await sortLink.getAttribute('class');
		const isCurrentlyDesc = currentClass?.includes('desc');

		// Click if we need to change direction
		if ((direction === 'asc' && isCurrentlyDesc) || (direction === 'desc' && !isCurrentlyDesc)) {
			await sortLink.click();
			await this.page.waitForLoadState('load');
		}
	}

	// Filtering and searching
	async getRowsByType(type: 'Comment' | 'Proposal'): Promise<ModerationRowData[]> {
		const allRows = await this.getAllRowsData();
		return allRows.filter(row => row.type.trim() === type);
	}

	async getRowsByReason(reason: string): Promise<ModerationRowData[]> {
		const allRows = await this.getAllRowsData();
		return allRows.filter(row => row.reason.toLowerCase().includes(reason.toLowerCase()));
	}

	async findRowByContentId(contentId: string): Promise<ModerationRowData | null> {
		const allRows = await this.getAllRowsData();
		return allRows.find(row => row.id === contentId) || null;
	}

	// Tooltip interactions
	async getTooltipContent(rowIndex: number, columnIndex: number): Promise<string> {
		const row = this.tableRows.nth(rowIndex);
		const cell = row.locator('td').nth(columnIndex);
		const tooltipElement = cell.locator('[data-tooltip]');

		if (await tooltipElement.isVisible()) {
			return (await tooltipElement.getAttribute('data-tooltip')) || '';
		}

		return '';
	}

	async hoverOverTooltip(rowIndex: number, columnIndex: number): Promise<void> {
		const row = this.tableRows.nth(rowIndex);
		const cell = row.locator('td').nth(columnIndex);
		const tooltipElement = cell.locator('[data-tooltip]');

		if (await tooltipElement.isVisible()) {
			await tooltipElement.hover();
		}
	}

	// Table state checks
	async getCurrentSortColumn(): Promise<string> {
		const sortLinks = await this.tableHead.locator('a.sort_link').all();

		for (const link of sortLinks) {
			const className = await link.getAttribute('class');
			if (className?.includes('desc') || className?.includes('asc')) {
				return (await link.textContent()) || '';
			}
		}

		return '';
	}

	async getCurrentSortDirection(): Promise<'asc' | 'desc' | 'none'> {
		const sortLinks = await this.tableHead.locator('a.sort_link').all();

		for (const link of sortLinks) {
			const className = await link.getAttribute('class');
			if (className?.includes('desc')) {
				return 'desc';
			} else if (className?.includes('asc')) {
				return 'asc';
			}
		}

		return 'none';
	}

	// Table validation methods
	async detectTableType(): Promise<'main-listing' | 'detail-reports' | 'unknown'> {
		try {
			// Check table headers to determine table type
			const headers = await this.page.locator('.table-list thead th').allTextContents();
			console.log('Detected table headers:', headers);
			console.log('Current URL:', this.page.url());

			// Main listing table headers: "ID", "Type", "Reported content URL", "Reason", "Reported at", "Reports count", "Actions"
			if (
				headers.includes('ID') &&
				headers.includes('Reported content URL') &&
				headers.includes('Reports count')
			) {
				return 'main-listing';
			}

			// Detail reports table headers: "Reason", "Language", "Reason details", "Actions"
			if (headers.includes('Reason') && headers.includes('Language') && headers.includes('Reason details')) {
				return 'detail-reports';
			}

			return 'unknown';
		} catch (error) {
			console.log('Error detecting table type:', error);
			return 'unknown';
		}
	}

	async isMainListingTable(): Promise<boolean> {
		const tableType = await this.detectTableType();
		return tableType === 'main-listing';
	}

	async validateTableForMainListing(autoNavigate: boolean = false): Promise<void> {
		const tableType = await this.detectTableType();
		if (tableType !== 'main-listing') {
			if (autoNavigate) {
				console.log(`Found ${tableType} table, attempting to navigate to main listing...`);
				// Delegate navigation back to the ProcessModerationPage
				throw new Error(
					`NAVIGATION_NEEDED: Found ${tableType} table instead of main-listing. Current URL: ${this.page.url()}`
				);
			} else {
				throw new Error(
					`Expected main listing table but found ${tableType} table. Current URL: ${this.page.url()}`
				);
			}
		}
	}

	// Utility methods
	async getTableHeaders(): Promise<string[]> {
		const headers = await this.tableHead.locator('th').allTextContents();
		return headers.filter(text => text.trim().length > 0);
	}

	async isEmptyTable(): Promise<boolean> {
		const rowCount = await this.getRowCount();
		return rowCount === 0;
	}

	/**
	 * Select all moderations using the header checkbox
	 * @returns Promise<void>
	 */
	async selectAll(): Promise<void> {
		const selectAllCheckbox = this.page.locator('input#moderations_bulk[value="all"]');
		if (!(await selectAllCheckbox.isChecked())) {
			await selectAllCheckbox.check();
			await this.page.waitForLoadState('load');
		}
	}

	/**
	 * Get count of selected moderations
	 * @returns Promise<number>
	 */
	async getSelectedCount(): Promise<number> {
		return await this.page.locator('tbody input[type="checkbox"]:checked').count();
	}
}

// Interface for row data
export interface ModerationRowData {
	id: string;
	type: string;
	url: string;
	reason: string;
	reportedAt: string;
	reportsCount: string;
	dataId: string;
}
