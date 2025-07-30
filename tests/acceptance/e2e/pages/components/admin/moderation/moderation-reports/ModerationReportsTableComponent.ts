import { Locator, Page } from '@playwright/test';

/**
 * Component representing the reports table on the Moderation Reports page
 */
export class ModerationReportsTableComponent {
	readonly page: Page;
	readonly table: Locator;
	readonly tableRows: Locator;
	readonly tableHeaders: Locator;

	constructor(page: Page) {
		this.page = page;
		this.table = page.locator('table');
		this.tableRows = this.table.locator('tbody tr');
		this.tableHeaders = this.table.locator('thead th');
	}

	/**
	 * Get the number of report rows
	 */
	async getReportCount(): Promise<number> {
		return await this.tableRows.count();
	}

	/**
	 * Get report data from a specific row
	 */
	async getReportData(rowIndex: number): Promise<{
		reason: string;
		language: string;
		details: string;
		reportedBy: string;
		createdAt: string;
		hasActions: boolean;
	}> {
		const row = this.tableRows.nth(rowIndex);
		const cells = row.locator('td');

		const reason = (await cells.nth(0).textContent()) || '';
		const language = (await cells.nth(1).textContent()) || '';
		const details = (await cells.nth(2).textContent()) || '';
		const reportedBy = (await cells.nth(3).textContent()) || '';
		const createdAt = (await cells.nth(4).textContent()) || '';
		const hasActions = (await cells.nth(5).locator('a').count()) > 0;

		return {
			reason,
			language,
			details,
			reportedBy,
			createdAt,
			hasActions
		};
	}

	/**
	 * Get all report reasons
	 */
	async getAllReportReasons(): Promise<string[]> {
		const reasons: string[] = [];
		const count = await this.getReportCount();

		for (let i = 0; i < count; i++) {
			const reportData = await this.getReportData(i);
			reasons.push(reportData.reason);
		}

		return reasons;
	}

	/**
	 * Click on a report action link (e.g., "Hide", "Unreport")
	 */
	async clickReportAction(rowIndex: number, actionText: string): Promise<void> {
		const row = this.tableRows.nth(rowIndex);
		const actionLink = row.locator('a').filter({ hasText: actionText });
		await actionLink.click();
	}

	/**
	 * Verify the table is visible
	 */
	async isVisible(): Promise<boolean> {
		return await this.table.isVisible();
	}

	/**
	 * Get table headers
	 */
	async getTableHeaders(): Promise<string[]> {
		const headers: string[] = [];
		const count = await this.tableHeaders.count();

		for (let i = 0; i < count; i++) {
			const headerText = (await this.tableHeaders.nth(i).textContent()) || '';
			headers.push(headerText.trim());
		}

		return headers;
	}

	/**
	 * Check if table has any reports
	 */
	async hasReports(): Promise<boolean> {
		const count = await this.getReportCount();
		return count > 0;
	}

	/**
	 * Get all reports data
	 */
	async getAllReportsData(): Promise<
		Array<{
			reason: string;
			language: string;
			details: string;
			reportedBy: string;
			createdAt: string;
			hasActions: boolean;
		}>
	> {
		const reports = [];
		const count = await this.getReportCount();

		for (let i = 0; i < count; i++) {
			const reportData = await this.getReportData(i);
			reports.push(reportData);
		}

		return reports;
	}
}
