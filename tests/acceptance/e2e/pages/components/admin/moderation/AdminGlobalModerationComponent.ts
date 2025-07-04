import { Page } from '@playwright/test';

export class AdminGlobalModerationComponent {
	constructor(private page: Page) {}

	private get pageTitle() {
		return this.page.locator('h1.item_show__header-title');
	}

	private get notHiddenFilter() {
		return this.page.locator('a[href="/admin/moderations"]:has-text("Not hidden")');
	}

	private get hiddenFilter() {
		return this.page.locator('a[href="/admin/moderations?hidden=true"]:has-text("Hidden")');
	}

	private get filterDropdown() {
		return this.page.locator('.dropdown button.button__secondary:has-text("Filter")');
	}

	private get typeFilterComment() {
		return this.page.locator('a[href*="reportable_type_string_eq"][href*="Comment"]');
	}

	private get typeFilterProposal() {
		return this.page.locator('a[href*="reportable_type_string_eq"][href*="Proposal"]');
	}

	private get searchInput() {
		return this.page.locator('input[placeholder*="Search Moderation by reportable id or content"]');
	}

	private get searchButton() {
		return this.page.locator('button[type="submit"][aria-label="Search"]');
	}

	private get moderationTable() {
		return this.page.locator('table.table-list');
	}

	private get tableRows() {
		return this.moderationTable.locator('tbody tr');
	}

	private get reportedContentSidebarLink() {
		return this.page.locator('a[href="/admin/moderations"]:has-text("Reported content")');
	}

	private get reportedParticipantsSidebarLink() {
		return this.page.locator('a[href="/admin/moderated_users"]:has-text("Reported participants")');
	}

	private get sortByCreatedAtLink() {
		return this.page.locator('a.sort_link[href*="created_at"]');
	}

	private get sortByReportsCountLink() {
		return this.page.locator('a.sort_link[href*="report_count"]');
	}

	private get successFlashMessage() {
		return this.page.locator('.flash.success .flash__message');
	}

	private get closeFlashMessageButton() {
		return this.page.locator('.flash.success .close-button');
	}

	async getPageTitle(): Promise<string> {
		return (await this.pageTitle.textContent()) || '';
	}

	async isPageTitleVisible(): Promise<boolean> {
		return await this.pageTitle.isVisible();
	}

	async clickNotHiddenFilter() {
		await this.notHiddenFilter.click();
	}

	async clickHiddenFilter() {
		await this.hiddenFilter.click();
	}

	async isFilterDropdownVisible(): Promise<boolean> {
		return await this.filterDropdown.isVisible();
	}

	async clickFilterDropdown() {
		await this.filterDropdown.click();
	}

	async clickTypeFilterComment() {
		await this.typeFilterComment.click();
	}

	async clickTypeFilterProposal() {
		await this.typeFilterProposal.click();
	}

	async searchContent(searchTerm: string) {
		await this.searchInput.fill(searchTerm);
		await this.searchButton.click();
	}

	async getSearchInputValue(): Promise<string> {
		return (await this.searchInput.inputValue()) || '';
	}

	async isTableVisible(): Promise<boolean> {
		return await this.moderationTable.isVisible();
	}

	async getTableRowCount(): Promise<number> {
		return await this.tableRows.count();
	}

	async getRowData(rowIndex: number): Promise<{
		id: string;
		type: string;
		participatorySpace: string;
		reportedAt: string;
		reportsCount: string;
	}> {
		const row = this.tableRows.nth(rowIndex);
		const cells = row.locator('td');

		return {
			id: (await cells.nth(0).textContent()) || '',
			type: (await cells.nth(1).textContent()) || '',
			participatorySpace: (await cells.nth(2).textContent()) || '',
			reportedAt: (await cells.nth(5).textContent()) || '',
			reportsCount: (await cells.nth(6).textContent()) || ''
		};
	}

	async getRowById(id: string) {
		return this.tableRows.filter({ has: this.page.locator(`td:has-text("${id}")`) });
	}

	async clickExpandAction(rowIndex: number) {
		const row = this.tableRows.nth(rowIndex);
		await row.locator('a.action-icon--expand').click();
	}

	async clickUnreportAction(rowIndex: number) {
		const row = this.tableRows.nth(rowIndex);
		await row.locator('a.action-icon--unreport').click();
	}

	async clickHideAction(rowIndex: number) {
		const row = this.tableRows.nth(rowIndex);
		await row.locator('a.action-icon--hide').click();
	}

	async clickVisitUrl(rowIndex: number) {
		const row = this.tableRows.nth(rowIndex);
		await row.locator('a:has-text("Visit URL")').click();
	}

	async isExpandActionVisible(rowIndex: number): Promise<boolean> {
		const row = this.tableRows.nth(rowIndex);
		return await row.locator('a.action-icon--expand').isVisible();
	}

	async isUnreportActionVisible(rowIndex: number): Promise<boolean> {
		const row = this.tableRows.nth(rowIndex);
		return await row.locator('a.action-icon--unreport').isVisible();
	}

	async isHideActionVisible(rowIndex: number): Promise<boolean> {
		const row = this.tableRows.nth(rowIndex);
		return await row.locator('a.action-icon--hide').isVisible();
	}

	async clickReportedContentSidebar() {
		await this.reportedContentSidebarLink.click();
	}

	async clickReportedParticipantsSidebar() {
		await this.reportedParticipantsSidebarLink.click();
	}

	async isReportedContentSidebarActive(): Promise<boolean> {
		return await this.reportedContentSidebarLink
			.locator('..')
			.getAttribute('class')
			.then(classes => classes?.includes('is-active') || false);
	}

	async getReportedContentCount(): Promise<string> {
		const counter = this.reportedContentSidebarLink.locator('.component-counter');
		return (await counter.textContent()) || '';
	}

	async getReportedParticipantsCount(): Promise<string> {
		const counter = this.reportedParticipantsSidebarLink.locator('.component-counter');
		return (await counter.textContent()) || '';
	}

	async sortByCreatedAt() {
		await this.sortByCreatedAtLink.click();
	}

	async sortByReportsCount() {
		await this.sortByReportsCountLink.click();
	}

	async isSortedByCreatedAtDesc(): Promise<boolean> {
		return await this.sortByCreatedAtLink.getAttribute('class').then(classes => classes?.includes('desc') || false);
	}

	async waitForTableToLoad() {
		await this.moderationTable.waitFor({ state: 'visible' });
	}

	async waitForPageToLoad() {
		await this.pageTitle.waitFor({ state: 'visible' });
		await this.moderationTable.waitFor({ state: 'visible' });
	}

	async hasRowWithId(id: string): Promise<boolean> {
		const row = await this.getRowById(id);
		return (await row.count()) > 0;
	}

	async getRowReason(rowIndex: number): Promise<string> {
		const row = this.tableRows.nth(rowIndex);
		const reasonCell = row.locator('td').nth(4);
		return (await reasonCell.textContent()) || '';
	}

	async getRowParticipatorySpace(rowIndex: number): Promise<string> {
		const row = this.tableRows.nth(rowIndex);
		const spaceCell = row.locator('td').nth(2);
		return (await spaceCell.textContent()) || '';
	}

	async isTableEmpty(): Promise<boolean> {
		const rowCount = await this.getTableRowCount();
		return rowCount === 0;
	}

	async getAllRowIds(): Promise<string[]> {
		const rows = await this.tableRows.all();
		const ids: string[] = [];

		for (const row of rows) {
			const idCell = row.locator('td').first();
			const id = await idCell.textContent();
			if (id) {
				ids.push(id.trim());
			}
		}

		return ids;
	}

	async isResourceSuccessfullyHidden(): Promise<boolean> {
		try {
			const message = await this.successFlashMessage.textContent();
			return message?.includes('Resource successfully hidden') || false;
		} catch {
			return false;
		}
	}

	async getSuccessFlashMessage(): Promise<string> {
		return (await this.successFlashMessage.textContent()) || '';
	}

	async isSuccessFlashMessageVisible(): Promise<boolean> {
		return await this.successFlashMessage.isVisible();
	}

	async closeSuccessFlashMessage() {
		await this.closeFlashMessageButton.click();
	}

	async isCloseFlashMessageButtonVisible(): Promise<boolean> {
		return await this.closeFlashMessageButton.isVisible();
	}

	async waitForSuccessMessage() {
		await this.successFlashMessage.waitFor({ state: 'visible' });
	}

	async isResourceSuccessfullyUnreported(): Promise<boolean> {
		try {
			const message = await this.successFlashMessage.textContent();
			return message?.includes('Resource successfully unreported') || false;
		} catch {
			return false;
		}
	}

	async waitForUnreportSuccessMessage() {
		await this.successFlashMessage.waitFor({ state: 'visible' });
	}
}
