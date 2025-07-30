import { Locator, Page } from '@playwright/test';

/**
 * Interface for moderation table row data in global moderation
 */
export interface GlobalModerationRowData {
	id: string;
	type: string;
	participatorySpace: string;
	reportedContentUrl: string;
	reason: string;
	reportedAt: string;
	reportsCount: string;
}

/**
 * Component for handling the table section on the Global Moderation admin page
 * Based on the HTML structure: .table-scroll with moderation data table
 */
export class GlobalModerationTableComponent {
	private readonly page: Page;

	// Selectors based on the provided HTML structure
	private readonly tableScrollContainer = '.table-scroll';
	private readonly table = '.table-list';
	private readonly tableHeader = '.table-list thead';
	private readonly tableBody = '.table-list tbody';
	private readonly tableRows = '.table-list tbody tr';
	private readonly sortLinks = '.table-list .sort_link';
	private readonly expandActions = '.action-icon--expand';
	private readonly unreportActions = '.action-icon--unreport';
	private readonly hideActions = '.action-icon--hide';
	private readonly visitUrlLinks = 'a:has-text("Visit URL")';

	constructor(page: Page) {
		this.page = page;
	}

	/**
	 * Get the table scroll container
	 */
	getTableScrollContainer(): Locator {
		return this.page.locator(this.tableScrollContainer);
	}

	/**
	 * Get the table element
	 */
	getTable(): Locator {
		return this.page.locator(this.table);
	}

	/**
	 * Get the table header
	 */
	getTableHeader(): Locator {
		return this.page.locator(this.tableHeader);
	}

	/**
	 * Get the table body
	 */
	getTableBody(): Locator {
		return this.page.locator(this.tableBody);
	}

	/**
	 * Get all table rows
	 */
	getTableRows(): Locator {
		return this.page.locator(this.tableRows);
	}

	/**
	 * Get specific row by index
	 */
	getTableRow(index: number): Locator {
		return this.getTableRows().nth(index);
	}

	/**
	 * Get row by data-id attribute
	 */
	getTableRowById(id: string): Locator {
		return this.page.locator(`${this.tableRows}[data-id="${id}"]`);
	}

	/**
	 * Get sort links
	 */
	getSortLinks(): Locator {
		return this.page.locator(this.sortLinks);
	}

	/**
	 * Get expand action buttons
	 */
	getExpandActions(): Locator {
		return this.page.locator(this.expandActions);
	}

	/**
	 * Get unreport action buttons
	 */
	getUnreportActions(): Locator {
		return this.page.locator(this.unreportActions);
	}

	/**
	 * Get hide action buttons
	 */
	getHideActions(): Locator {
		return this.page.locator(this.hideActions);
	}

	/**
	 * Get visit URL links
	 */
	getVisitUrlLinks(): Locator {
		return this.page.locator(this.visitUrlLinks);
	}

	/**
	 * Check if table is visible
	 */
	async isVisible(): Promise<boolean> {
		return await this.getTable().isVisible();
	}

	/**
	 * Check if table scroll container is visible
	 */
	async isTableScrollVisible(): Promise<boolean> {
		return await this.getTableScrollContainer().isVisible();
	}

	/**
	 * Get number of rows in table
	 */
	async getRowCount(): Promise<number> {
		return await this.getTableRows().count();
	}

	/**
	 * Check if table is empty
	 */
	async isEmpty(): Promise<boolean> {
		const rowCount = await this.getRowCount();
		return rowCount === 0;
	}

	/**
	 * Get row data for a specific row index
	 */
	async getRowData(index: number): Promise<GlobalModerationRowData> {
		const row = this.getTableRow(index);
		const cells = row.locator('td');

		return {
			id: (await cells.nth(0).textContent()) || '',
			type: (await cells.nth(1).textContent()) || '',
			participatorySpace: (await cells.nth(2).textContent()) || '',
			reportedContentUrl: (await cells.nth(3).textContent()) || '',
			reason: (await cells.nth(4).textContent()) || '',
			reportedAt: (await cells.nth(5).textContent()) || '',
			reportsCount: (await cells.nth(6).textContent()) || ''
		};
	}

	/**
	 * Get all row data
	 */
	async getAllRowData(): Promise<GlobalModerationRowData[]> {
		const rowCount = await this.getRowCount();
		const allData: GlobalModerationRowData[] = [];

		for (let i = 0; i < rowCount; i++) {
			const rowData = await this.getRowData(i);
			allData.push(rowData);
		}

		return allData;
	}

	/**
	 * Click expand action for a specific row
	 */
	async clickExpandAction(rowIndex: number): Promise<void> {
		const row = this.getTableRow(rowIndex);
		const expandButton = row.locator(this.expandActions);
		await expandButton.click();
	}

	/**
	 * Click unreport action for a specific row
	 */
	async clickUnreportAction(rowIndex: number): Promise<void> {
		const row = this.getTableRow(rowIndex);
		const unreportButton = row.locator(this.unreportActions);
		await unreportButton.click();
	}

	/**
	 * Click hide action for a specific row
	 */
	async clickHideAction(rowIndex: number): Promise<void> {
		const row = this.getTableRow(rowIndex);
		const hideButton = row.locator(this.hideActions);
		await hideButton.click();
	}

	/**
	 * Click visit URL for a specific row
	 */
	async clickVisitUrl(rowIndex: number): Promise<void> {
		const row = this.getTableRow(rowIndex);
		const visitUrlLink = row.locator(this.visitUrlLinks);
		await visitUrlLink.click();
	}

	/**
	 * Check if expand action is available for a row
	 */
	async isExpandActionAvailable(rowIndex: number): Promise<boolean> {
		const row = this.getTableRow(rowIndex);
		const expandButton = row.locator(this.expandActions);
		return await expandButton.isVisible();
	}

	/**
	 * Check if unreport action is available for a row
	 */
	async isUnreportActionAvailable(rowIndex: number): Promise<boolean> {
		const row = this.getTableRow(rowIndex);
		const unreportButton = row.locator(this.unreportActions);
		return await unreportButton.isVisible();
	}

	/**
	 * Check if hide action is available for a row
	 */
	async isHideActionAvailable(rowIndex: number): Promise<boolean> {
		const row = this.getTableRow(rowIndex);
		const hideButton = row.locator(this.hideActions);
		return await hideButton.isVisible();
	}

	/**
	 * Check if visit URL is available for a row
	 */
	async isVisitUrlAvailable(rowIndex: number): Promise<boolean> {
		const row = this.getTableRow(rowIndex);
		const visitUrlLink = row.locator(this.visitUrlLinks);
		return await visitUrlLink.isVisible();
	}

	/**
	 * Sort table by "Reported at" column
	 */
	async sortByReportedAt(): Promise<void> {
		const sortLink = this.page.locator('.sort_link[href*="created_at"]');
		await sortLink.click();
	}

	/**
	 * Sort table by "Reports count" column
	 */
	async sortByReportsCount(): Promise<void> {
		const sortLink = this.page.locator('.sort_link[href*="report_count"]');
		await sortLink.click();
	}

	/**
	 * Check if table is sorted by "Reported at" (descending)
	 */
	async isSortedByReportedAtDesc(): Promise<boolean> {
		const sortLink = this.page.locator('.sort_link[href*="created_at"]');
		const classes = await sortLink.getAttribute('class');
		return classes ? classes.includes('desc') : false;
	}

	/**
	 * Check if table is sorted by "Reports count"
	 */
	async isSortedByReportsCount(): Promise<boolean> {
		const sortLink = this.page.locator('.sort_link[href*="report_count"]');
		const classes = await sortLink.getAttribute('class');
		return classes ? !classes.includes('sort_link ') : false;
	}

	/**
	 * Get table column headers
	 */
	async getColumnHeaders(): Promise<string[]> {
		const headers = this.getTableHeader().locator('th');
		const count = await headers.count();
		const headerTexts: string[] = [];

		for (let i = 0; i < count; i++) {
			const text = await headers.nth(i).textContent();
			if (text && text.trim()) {
				headerTexts.push(text.trim());
			}
		}

		return headerTexts;
	}

	/**
	 * Find row by ID value
	 */
	async findRowByIdValue(idValue: string): Promise<number> {
		const rowCount = await this.getRowCount();

		for (let i = 0; i < rowCount; i++) {
			const rowData = await this.getRowData(i);
			if (rowData.id.trim() === idValue.trim()) {
				return i;
			}
		}

		return -1; // Not found
	}

	/**
	 * Get all available actions for a specific row
	 */
	async getAvailableActions(rowIndex: number): Promise<string[]> {
		const actions: string[] = [];

		if (await this.isExpandActionAvailable(rowIndex)) {
			actions.push('expand');
		}
		if (await this.isUnreportActionAvailable(rowIndex)) {
			actions.push('unreport');
		}
		if (await this.isHideActionAvailable(rowIndex)) {
			actions.push('hide');
		}
		if (await this.isVisitUrlAvailable(rowIndex)) {
			actions.push('visit');
		}

		return actions;
	}

	/**
	 * Verify table structure matches expected pattern
	 */
	async verifyTableStructure(): Promise<boolean> {
		try {
			await this.getTable().waitFor({ state: 'visible' });

			// Check that all expected elements are present
			const tableVisible = await this.getTable().isVisible();
			const headerVisible = await this.getTableHeader().isVisible();
			const bodyVisible = await this.getTableBody().isVisible();

			return tableVisible && headerVisible && bodyVisible;
		} catch {
			return false;
		}
	}

	/**
	 * Get accessibility attributes for screen readers
	 */
	async getAccessibilityInfo(): Promise<Record<string, string | null>> {
		const table = this.getTable();

		return {
			ariaLabel: await table.getAttribute('aria-label'),
			role: await table.getAttribute('role'),
			ariaDescribedBy: await table.getAttribute('aria-describedby')
		};
	}

	/**
	 * Wait for table to load
	 */
	async waitForTableToLoad(): Promise<void> {
		await this.getTable().waitFor({ state: 'visible' });
		await this.getTableHeader().waitFor({ state: 'visible' });
	}

	/**
	 * Check accessibility compliance
	 */
	async checkAccessibility(): Promise<void> {
		// Check if table has proper caption or aria-label
		const caption = this.getTable().locator('caption');
		const ariaLabel = await this.getTable().getAttribute('aria-label');

		if (!(await caption.isVisible()) && !ariaLabel) {
			console.warn('Table should have either a caption or aria-label');
		}

		// Check if action buttons have proper aria-labels
		const expandButtons = this.getExpandActions();
		const count = await expandButtons.count();

		for (let i = 0; i < count; i++) {
			const button = expandButtons.nth(i);
			const ariaLabel = await button.getAttribute('aria-label');
			if (!ariaLabel) {
				console.warn('Action buttons should have aria-label attribute');
			}
		}
	}

	/**
	 * Debug helper - get table structure and data
	 */
	async debugTable(): Promise<any> {
		return {
			container: {
				visible: await this.getTableScrollContainer().isVisible(),
				class: await this.getTableScrollContainer().getAttribute('class')
			},
			table: {
				visible: await this.getTable().isVisible(),
				class: await this.getTable().getAttribute('class')
			},
			structure: {
				headerVisible: await this.getTableHeader().isVisible(),
				bodyVisible: await this.getTableBody().isVisible(),
				rowCount: await this.getRowCount(),
				isEmpty: await this.isEmpty()
			},
			headers: await this.getColumnHeaders(),
			sorting: {
				sortedByReportedAt: await this.isSortedByReportedAtDesc(),
				sortedByReportsCount: await this.isSortedByReportsCount()
			},
			actions: {
				expandCount: await this.getExpandActions().count(),
				unreportCount: await this.getUnreportActions().count(),
				hideCount: await this.getHideActions().count(),
				visitUrlCount: await this.getVisitUrlLinks().count()
			}
		};
	}
}
