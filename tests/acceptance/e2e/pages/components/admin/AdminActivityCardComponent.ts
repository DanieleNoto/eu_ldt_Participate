import { Page } from '@playwright/test';

/**
 * Component for the activity card in the admin dashboard.
 * Manages the table with participant and admin statistics.
 */
export class AdminActivityCardComponent {
	constructor(private page: Page) {}

	// Main selectors
	private get activityCard() {
		return this.page.locator('.card').filter({ hasText: 'Activity' });
	}

	private get cardTitle() {
		return this.activityCard.locator('.card-title');
	}

	private get activityTable() {
		return this.activityCard.locator('.table-list');
	}

	private get tableHeaders() {
		return this.activityTable.locator('thead th');
	}

	private get tableRows() {
		return this.activityTable.locator('tbody tr');
	}

	// Selectors for specific rows
	private get participantsRow() {
		return this.activityTable.locator('tr').filter({ hasText: 'Participants' });
	}

	private get adminsRow() {
		return this.activityTable.locator('tr').filter({ hasText: 'Admins' });
	}

	// Verification methods
	async isActivityCardVisible(): Promise<boolean> {
		return await this.activityCard.isVisible();
	}

	async isActivityTableVisible(): Promise<boolean> {
		return await this.activityTable.isVisible();
	}

	async getCardTitle(): Promise<string> {
		return (await this.cardTitle.textContent()) || '';
	}

	// Methods to get table data
	async getTableHeaders(): Promise<string[]> {
		const headers = await this.tableHeaders.all();
		const headerTexts: string[] = [];

		for (const header of headers) {
			const text = await header.textContent();
			if (text) {
				headerTexts.push(text.trim());
			}
		}

		return headerTexts;
	}

	async getParticipantsData(): Promise<{
		lastMonth: string;
		lastWeek: string;
		lastDay: string;
	}> {
		const cells = await this.participantsRow.locator('td').all();
		return {
			lastMonth: (await cells[1]?.textContent()) || '0',
			lastWeek: (await cells[2]?.textContent()) || '0',
			lastDay: (await cells[3]?.textContent()) || '0'
		};
	}

	async getAdminsData(): Promise<{
		lastMonth: string;
		lastWeek: string;
		lastDay: string;
	}> {
		const cells = await this.adminsRow.locator('td').all();
		return {
			lastMonth: (await cells[1]?.textContent()) || '0',
			lastWeek: (await cells[2]?.textContent()) || '0',
			lastDay: (await cells[3]?.textContent()) || '0'
		};
	}

	// Methods to check for specific data presence
	async hasParticipantsData(): Promise<boolean> {
		return await this.participantsRow.isVisible();
	}

	async hasAdminsData(): Promise<boolean> {
		return await this.adminsRow.isVisible();
	}

	// Methods to get numeric values
	async getParticipantsLastMonth(): Promise<number> {
		const data = await this.getParticipantsData();
		return parseInt(data.lastMonth) || 0;
	}

	async getParticipantsLastWeek(): Promise<number> {
		const data = await this.getParticipantsData();
		return parseInt(data.lastWeek) || 0;
	}

	async getParticipantsLastDay(): Promise<number> {
		const data = await this.getParticipantsData();
		return parseInt(data.lastDay) || 0;
	}

	async getAdminsLastMonth(): Promise<number> {
		const data = await this.getAdminsData();
		return parseInt(data.lastMonth) || 0;
	}

	async getAdminsLastWeek(): Promise<number> {
		const data = await this.getAdminsData();
		return parseInt(data.lastWeek) || 0;
	}

	async getAdminsLastDay(): Promise<number> {
		const data = await this.getAdminsData();
		return parseInt(data.lastDay) || 0;
	}

	// Methods to check table structure
	async getRowCount(): Promise<number> {
		return await this.tableRows.count();
	}

	async getColumnCount(): Promise<number> {
		return await this.tableHeaders.count();
	}
}
