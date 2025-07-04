import { Page } from '@playwright/test';

export class AdminReportedParticipantsComponent {
	constructor(private page: Page) {}

	private get pageTitle() {
		return this.page.locator('h1.item_show__header-title');
	}

	private get notBlockedFilter() {
		return this.page.locator('a[href="/admin/moderated_users"]:has-text("Not Blocked")');
	}

	private get blockedFilter() {
		return this.page.locator('a[href="/admin/moderated_users?blocked=true"]:has-text("Blocked")');
	}

	private get filterDropdown() {
		return this.page.locator('.dropdown button.button__secondary:has-text("Filter")');
	}

	private get reportReasonFilterSpam() {
		return this.page.locator('a[href*="reports_reason_eq"][href*="spam"]');
	}

	private get reportReasonFilterOffensive() {
		return this.page.locator('a[href*="reports_reason_eq"][href*="offensive"]');
	}

	private get reportReasonFilterDoesNotBelong() {
		return this.page.locator('a[href*="reports_reason_eq"][href*="does_not_belong"]');
	}

	private get searchInput() {
		return this.page.locator('input[placeholder*="Search User moderation by email, name or nickname"]');
	}

	private get searchButton() {
		return this.page.locator('button[type="submit"][aria-label="Search"]');
	}

	private get participantsTable() {
		return this.page.locator('table.table-list');
	}

	private get tableRows() {
		return this.participantsTable.locator('tbody tr');
	}

	private get reportedContentSidebarLink() {
		return this.page.locator('a[href="/admin/moderations"]:has-text("Reported content")');
	}

	private get reportedParticipantsSidebarLink() {
		return this.page.locator('a[href="/admin/moderated_users"]:has-text("Reported participants")');
	}

	private get sortByReportedAtLink() {
		return this.page.locator('a.sort_link[href*="created_at"]');
	}

	private get sortByReportsCountLink() {
		return this.page.locator('a.sort_link[href*="report_count"]');
	}

	async getPageTitle(): Promise<string> {
		return (await this.pageTitle.textContent()) || '';
	}

	async isPageTitleVisible(): Promise<boolean> {
		return await this.pageTitle.isVisible();
	}

	async clickNotBlockedFilter() {
		await this.notBlockedFilter.click();
	}

	async clickBlockedFilter() {
		await this.blockedFilter.click();
	}

	async isFilterDropdownVisible(): Promise<boolean> {
		return await this.filterDropdown.isVisible();
	}

	async clickFilterDropdown() {
		await this.filterDropdown.click();
	}

	async clickReportReasonFilterSpam() {
		await this.reportReasonFilterSpam.click();
	}

	async clickReportReasonFilterOffensive() {
		await this.reportReasonFilterOffensive.click();
	}

	async clickReportReasonFilterDoesNotBelong() {
		await this.reportReasonFilterDoesNotBelong.click();
	}

	async searchParticipant(searchTerm: string) {
		await this.searchInput.fill(searchTerm);
		await this.searchButton.click();
	}

	async getSearchInputValue(): Promise<string> {
		return (await this.searchInput.inputValue()) || '';
	}

	async isTableVisible(): Promise<boolean> {
		return await this.participantsTable.isVisible();
	}

	async getTableRowCount(): Promise<number> {
		return await this.tableRows.count();
	}

	async getParticipantData(rowIndex: number): Promise<{
		name: string;
		nickname: string;
		reason: string;
		reportedAt: string;
		reportsCount: string;
	}> {
		const row = this.tableRows.nth(rowIndex);
		const cells = row.locator('td');

		return {
			name: (await cells.nth(0).textContent()) || '',
			nickname: (await cells.nth(1).textContent()) || '',
			reason: (await cells.nth(2).textContent()) || '',
			reportedAt: (await cells.nth(3).textContent()) || '',
			reportsCount: (await cells.nth(4).textContent()) || ''
		};
	}

	async getParticipantNameLink(rowIndex: number) {
		const row = this.tableRows.nth(rowIndex);
		return row.locator('td:first-child a');
	}

	async getParticipantNicknameLink(rowIndex: number) {
		const row = this.tableRows.nth(rowIndex);
		return row.locator('td:nth-child(2) a');
	}

	async clickParticipantNameLink(rowIndex: number) {
		const nameLink = await this.getParticipantNameLink(rowIndex);
		await nameLink.click();
	}

	async clickParticipantNicknameLink(rowIndex: number) {
		const nicknameLink = await this.getParticipantNicknameLink(rowIndex);
		await nicknameLink.click();
	}

	async getParticipantProfileUrl(rowIndex: number): Promise<string> {
		const nameLink = await this.getParticipantNameLink(rowIndex);
		return (await nameLink.getAttribute('href')) || '';
	}

	async clickUnreportAction(rowIndex: number) {
		const row = this.tableRows.nth(rowIndex);
		await row.locator('a.action-icon--unreport').click();
	}

	async clickBlockUserAction(rowIndex: number) {
		const row = this.tableRows.nth(rowIndex);
		await row.locator('a.action-icon:has([aria-label="Block User"])').click();
	}

	async isUnreportActionVisible(rowIndex: number): Promise<boolean> {
		const row = this.tableRows.nth(rowIndex);
		return await row.locator('a.action-icon--unreport').isVisible();
	}

	async isBlockUserActionVisible(rowIndex: number): Promise<boolean> {
		const row = this.tableRows.nth(rowIndex);
		return await row.locator('a.action-icon:has([aria-label="Block User"])').isVisible();
	}

	async clickReportedContentSidebar() {
		await this.reportedContentSidebarLink.click();
	}

	async clickReportedParticipantsSidebar() {
		await this.reportedParticipantsSidebarLink.click();
	}

	async isReportedParticipantsSidebarActive(): Promise<boolean> {
		return await this.reportedParticipantsSidebarLink
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

	async sortByReportedAt() {
		await this.sortByReportedAtLink.click();
	}

	async sortByReportsCount() {
		await this.sortByReportsCountLink.click();
	}

	async waitForTableToLoad() {
		await this.participantsTable.waitFor({ state: 'visible' });
	}

	async waitForPageToLoad() {
		await this.pageTitle.waitFor({ state: 'visible' });
		await this.participantsTable.waitFor({ state: 'visible' });
	}

	async isTableEmpty(): Promise<boolean> {
		const rowCount = await this.getTableRowCount();
		return rowCount === 0;
	}

	async getAllParticipantNames(): Promise<string[]> {
		const rows = await this.tableRows.all();
		const names: string[] = [];

		for (const row of rows) {
			const nameCell = row.locator('td').first();
			const name = await nameCell.textContent();
			if (name) {
				names.push(name.trim());
			}
		}

		return names;
	}

	async getAllParticipantNicknames(): Promise<string[]> {
		const rows = await this.tableRows.all();
		const nicknames: string[] = [];

		for (const row of rows) {
			const nicknameCell = row.locator('td').nth(1);
			const nickname = await nicknameCell.textContent();
			if (nickname) {
				nicknames.push(nickname.trim());
			}
		}

		return nicknames;
	}

	async getParticipantByName(name: string) {
		return this.tableRows.filter({ has: this.page.locator(`td:has-text("${name}")`) });
	}

	async getParticipantByNickname(nickname: string) {
		return this.tableRows.filter({ has: this.page.locator(`td:has-text("${nickname}")`) });
	}

	async hasParticipantWithName(name: string): Promise<boolean> {
		const participant = await this.getParticipantByName(name);
		return (await participant.count()) > 0;
	}

	async hasParticipantWithNickname(nickname: string): Promise<boolean> {
		const participant = await this.getParticipantByNickname(nickname);
		return (await participant.count()) > 0;
	}

	async getParticipantReasons(rowIndex: number): Promise<string[]> {
		const row = this.tableRows.nth(rowIndex);
		const reasonCell = row.locator('td').nth(2);
		const reasonText = await reasonCell.textContent();

		if (!reasonText) return [];

		return reasonText
			.split(',')
			.map(reason => reason.trim())
			.filter(reason => reason.length > 0);
	}

	async getParticipantReportedAt(rowIndex: number): Promise<string> {
		const row = this.tableRows.nth(rowIndex);
		const reportedAtCell = row.locator('td').nth(3);
		return (await reportedAtCell.textContent()) || '';
	}

	async getParticipantReportsCount(rowIndex: number): Promise<string> {
		const row = this.tableRows.nth(rowIndex);
		const reportsCountCell = row.locator('td').nth(4);
		return (await reportsCountCell.textContent()) || '';
	}

	async getBlockUserActionUrl(rowIndex: number): Promise<string> {
		const row = this.tableRows.nth(rowIndex);
		const blockAction = row.locator('a.action-icon:has([aria-label="Block User"])');
		return (await blockAction.getAttribute('href')) || '';
	}

	async getAllParticipantData(): Promise<
		Array<{
			name: string;
			nickname: string;
			reason: string;
			reportedAt: string;
			reportsCount: string;
		}>
	> {
		const rowCount = await this.getTableRowCount();
		const participants = [];

		for (let i = 0; i < rowCount; i++) {
			const data = await this.getParticipantData(i);
			participants.push(data);
		}

		return participants;
	}
}
