import { Page } from '@playwright/test';

/**
 * Component for managing the participatory processes table in the admin area.
 * Handles process listing, actions, and table interactions.
 */
export class AdminProcessTableComponent {
	constructor(private page: Page) {}

	// Table selectors
	private get tableContainer() {
		return this.page.locator('.table-list');
	}

	private get processRows() {
		return this.page.locator('.table-list tbody tr');
	}

	private get emptyState() {
		return this.page.locator('.empty-callout, .card-section:has-text("Non ci sono processi partecipativi")');
	}

	// Process row methods
	async getProcessByName(processName: string) {
		return this.processRows.filter({ hasText: processName }).first();
	}

	async getProcessActionMenu(processName: string) {
		const row = await this.getProcessByName(processName);
		return row.locator('.action-icon, [data-toggle="action-menu"]');
	}

	// Process actions
	async viewProcess(processName: string) {
		const actionMenu = await this.getProcessActionMenu(processName);
		await actionMenu.click();
		await this.page.locator('[data-action="view"], .action-menu-item:has-text("Visualizza")').first().click();
	}

	async editProcess(processName: string) {
		const actionMenu = await this.getProcessActionMenu(processName);
		await actionMenu.click();
		await this.page.locator('[data-action="edit"], .action-menu-item:has-text("Modifica")').first().click();
	}

	/**
	 * Clicks on the first process that has "Private" visibility
	 * @throws Error if no private process is found
	 */
	async clickFirstPrivateProcess(): Promise<void> {
		const rows = this.processRows;
		const rowCount = await rows.count();

		for (let i = 0; i < rowCount; i++) {
			const row = rows.nth(i);
			const privateSpan = row.locator('td.table-list__state span:has-text("Private")');

			if (await privateSpan.isVisible()) {
				// Click on the process title link in the first column
				const titleLink = row.locator('td:first-child a');
				await titleLink.click();
				return;
			}
		}

		throw new Error('No process with "Private" visibility found in the table');
	}

	async editFirstProcess() {
		// Get the first process row action menu
		const firstRow = this.processRows.first();
		const actionMenu = firstRow.locator('.action-icon').first();
		await actionMenu.click();
	}

	async duplicateProcess(processName: string) {
		const actionMenu = await this.getProcessActionMenu(processName);
		await actionMenu.click();
		await this.page.locator('[data-action="duplicate"], .action-menu-item:has-text("Duplica")').first().click();
	}

	async deleteProcess(processName: string) {
		const actionMenu = await this.getProcessActionMenu(processName);
		await actionMenu.click();
		await this.page.locator('[data-action="delete"], .action-menu-item:has-text("Elimina")').first().click();

		// Handle confirmation dialog if present
		const confirmButton = this.page.locator('[data-confirm="true"], .button--alert:has-text("Elimina")');
		if (await confirmButton.isVisible()) {
			await confirmButton.click();
		}
	}

	async publishProcess(processName: string) {
		const actionMenu = await this.getProcessActionMenu(processName);
		await actionMenu.click();
		await this.page.locator('[data-action="publish"], .action-menu-item:has-text("Pubblica")').first().click();
	}

	async unpublishProcess(processName: string) {
		const actionMenu = await this.getProcessActionMenu(processName);
		await actionMenu.click();
		await this.page
			.locator('[data-action="unpublish"], .action-menu-item:has-text("Annulla pubblicazione")')
			.first()
			.click();
	}

	// Table data methods
	async getProcessTitles() {
		const titles: string[] = [];
		const titleCells = this.page.locator('.table-list tbody tr td:first-child, .table-list tbody tr .title');
		const count = await titleCells.count();

		for (let i = 0; i < count; i++) {
			const title = await titleCells.nth(i).textContent();
			if (title) {
				titles.push(title.trim());
			}
		}

		return titles;
	}

	async getProcessStatuses() {
		const statuses: string[] = [];
		const statusCells = this.page.locator('.table-list tbody tr .status, .table-list tbody tr .label');
		const count = await statusCells.count();

		for (let i = 0; i < count; i++) {
			const status = await statusCells.nth(i).textContent();
			if (status) {
				statuses.push(status.trim());
			}
		}

		return statuses;
	}

	async getProcessCount() {
		return await this.processRows.count();
	}

	// Table state checks
	async isTableVisible() {
		return await this.tableContainer.isVisible();
	}

	async isEmpty() {
		return await this.emptyState.isVisible();
	}

	async hasProcesses() {
		return (await this.getProcessCount()) > 0;
	}

	// Process status checks
	async isProcessPublished(processName: string) {
		const row = await this.getProcessByName(processName);
		const statusElement = row.locator('.status:has-text("Pubblicato"), .label:has-text("Pubblicato")');
		return await statusElement.isVisible();
	}

	async isProcessDraft(processName: string) {
		const row = await this.getProcessByName(processName);
		const statusElement = row.locator('.status:has-text("Bozza"), .label:has-text("Bozza")');
		return await statusElement.isVisible();
	}

	async isProcessArchived(processName: string) {
		const row = await this.getProcessByName(processName);
		const statusElement = row.locator('.status:has-text("Archiviato"), .label:has-text("Archiviato")');
		return await statusElement.isVisible();
	}

	// Bulk actions
	async selectProcess(processName: string) {
		const row = await this.getProcessByName(processName);
		const checkbox = row.locator('input[type="checkbox"]');
		await checkbox.check();
	}

	async selectAllProcesses() {
		const selectAllCheckbox = this.page.locator('.table-list thead input[type="checkbox"]');
		await selectAllCheckbox.check();
	}

	async deselectAllProcesses() {
		const selectAllCheckbox = this.page.locator('.table-list thead input[type="checkbox"]');
		await selectAllCheckbox.uncheck();
	}

	async getSelectedProcessCount() {
		const selectedCheckboxes = this.page.locator('.table-list tbody input[type="checkbox"]:checked');
		return await selectedCheckboxes.count();
	}

	// Bulk action buttons
	async performBulkAction(action: 'publish' | 'unpublish' | 'delete') {
		const bulkActionButton = this.page.locator(
			`[data-bulk-action="${action}"], .bulk-actions .button:has-text("${action}")`
		);
		await bulkActionButton.click();

		// Handle confirmation if present
		if (action === 'delete') {
			const confirmButton = this.page.locator('[data-confirm="true"], .button--alert:has-text("Elimina")');
			if (await confirmButton.isVisible()) {
				await confirmButton.click();
			}
		}
	}

	// Sorting and pagination
	async sortByColumn(columnName: string) {
		const sortLink = this.page.locator(
			`.table-list th:has-text("${columnName}") a, .table-list th [data-sort="${columnName}"]`
		);
		await sortLink.click();
	}

	async goToNextPage() {
		const nextPageLink = this.page.locator(
			'.pagination .next a:not(.disabled), .pagination .page-item:last-child a:not(.disabled)'
		);
		if (await nextPageLink.isVisible()) {
			await nextPageLink.click();
		}
	}

	async goToPreviousPage() {
		const prevPageLink = this.page.locator(
			'.pagination .prev a:not(.disabled), .pagination .page-item:first-child a:not(.disabled)'
		);
		if (await prevPageLink.isVisible()) {
			await prevPageLink.click();
		}
	}

	async goToPage(pageNumber: number) {
		const pageLink = this.page.locator(`.pagination a:has-text("${pageNumber}")`);
		await pageLink.click();
	}

	// Utility methods
	async waitForTableLoad() {
		await this.page.waitForSelector('.table-list, .empty-callout', { state: 'visible' });
	}

	async refreshTable() {
		await this.page.reload();
		await this.waitForTableLoad();
	}
}
