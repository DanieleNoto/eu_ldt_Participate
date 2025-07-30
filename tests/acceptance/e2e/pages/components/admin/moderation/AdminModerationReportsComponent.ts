import { Page } from '@playwright/test';

export class AdminModerationReportsComponent {
	constructor(private page: Page) {}

	private get pageTitle() {
		return this.page.locator('h1.item_show__header-title');
	}

	private get backToReportedContentLink() {
		return this.page.locator('a[href="/admin/moderations"]:has-text("Reported content")');
	}

	private get warningMessage() {
		return this.page.locator('.flash.warning .flash__message');
	}

	private get reportedContentUrl() {
		return this.page.locator('dd a[target="_blank"]');
	}

	private get contentId() {
		return this.page.locator('dt:has-text("ID") + dd');
	}

	private get contentLanguage() {
		return this.page.locator('dt:has-text("Content original language") + dd');
	}

	private get toggleContentButton() {
		return this.page.locator('button.toggle-content');
	}

	private get reportedContentCurrent() {
		return this.page.locator('dd.reported-content > div:first-child');
	}

	private get reportedContentOriginal() {
		return this.page.locator('dd.reported-content .original');
	}

	private get authorsList() {
		return this.page.locator('ul.reportable-authors');
	}

	private get contentType() {
		return this.page.locator('dt:has-text("Type") + dd');
	}

	private get reportedAt() {
		return this.page.locator('dt:has-text("Reported at") + dd');
	}

	private get participatorySpace() {
		return this.page.locator('dt:has-text("Participatory space") + dd');
	}

	private get reportsTable() {
		return this.page.locator('table.table-list');
	}

	private get tableRows() {
		return this.reportsTable.locator('tbody tr');
	}

	private get unreportButton() {
		return this.page.locator('.item__edit-sticky a:has-text("Unreport")');
	}

	private get hideButton() {
		return this.page.locator('.item__edit-sticky a:has-text("Hide")');
	}

	private get reportedContentSidebarLink() {
		return this.page.locator('a[href="/admin/moderations"]:has-text("Reported content")');
	}

	private get reportedParticipantsSidebarLink() {
		return this.page.locator('a[href="/admin/moderated_users"]:has-text("Reported participants")');
	}

	async getPageTitle(): Promise<string> {
		return (await this.pageTitle.textContent()) || '';
	}

	async isPageTitleVisible(): Promise<boolean> {
		return await this.pageTitle.isVisible();
	}

	async clickBackToReportedContent() {
		await this.backToReportedContentLink.click();
	}

	async getWarningMessage(): Promise<string> {
		return (await this.warningMessage.textContent()) || '';
	}

	async isWarningMessageVisible(): Promise<boolean> {
		return await this.warningMessage.isVisible();
	}

	async getReportedContentUrl(): Promise<string> {
		return (await this.reportedContentUrl.getAttribute('href')) || '';
	}

	async clickReportedContentUrl() {
		await this.reportedContentUrl.click();
	}

	async getContentId(): Promise<string> {
		return (await this.contentId.textContent()) || '';
	}

	async getContentLanguage(): Promise<string> {
		return (await this.contentLanguage.textContent()) || '';
	}

	async clickToggleContentButton() {
		await this.toggleContentButton.click();
	}

	async getToggleContentButtonText(): Promise<string> {
		return (await this.toggleContentButton.textContent()) || '';
	}

	async getCurrentReportedContent(): Promise<string> {
		return (await this.reportedContentCurrent.textContent()) || '';
	}

	async getOriginalReportedContent(): Promise<string> {
		return (await this.reportedContentOriginal.textContent()) || '';
	}

	async isOriginalContentVisible(): Promise<boolean> {
		return await this.reportedContentOriginal.isVisible();
	}

	async getAuthors(): Promise<string[]> {
		const authors = await this.authorsList.locator('li').all();
		const authorNames: string[] = [];

		for (const author of authors) {
			const name = await author.textContent();
			if (name) {
				authorNames.push(name.trim());
			}
		}

		return authorNames;
	}

	async getContentType(): Promise<string> {
		return (await this.contentType.textContent()) || '';
	}

	async getReportedAt(): Promise<string> {
		return (await this.reportedAt.textContent()) || '';
	}

	async getParticipatorySpace(): Promise<string> {
		return (await this.participatorySpace.textContent()) || '';
	}

	async isReportsTableVisible(): Promise<boolean> {
		return await this.reportsTable.isVisible();
	}

	async getReportsTableRowCount(): Promise<number> {
		return await this.tableRows.count();
	}

	async getReportData(rowIndex: number): Promise<{
		reason: string;
		language: string;
		reasonDetails: string;
	}> {
		const row = this.tableRows.nth(rowIndex);
		const cells = row.locator('td');

		return {
			reason: (await cells.nth(0).textContent()) || '',
			language: (await cells.nth(1).textContent()) || '',
			reasonDetails: (await cells.nth(2).textContent()) || ''
		};
	}

	async clickExpandReportAction(rowIndex: number) {
		const row = this.tableRows.nth(rowIndex);
		await row.locator('a.action-icon--expand').click();
	}

	async isExpandReportActionVisible(rowIndex: number): Promise<boolean> {
		const row = this.tableRows.nth(rowIndex);
		return await row.locator('a.action-icon--expand').isVisible();
	}

	async clickUnreportButton() {
		await this.unreportButton.click();
	}

	async clickHideButton() {
		await this.hideButton.click();
	}

	async isUnreportButtonVisible(): Promise<boolean> {
		return await this.unreportButton.isVisible();
	}

	async isHideButtonVisible(): Promise<boolean> {
		return await this.hideButton.isVisible();
	}

	async isHideButtonAlert(): Promise<boolean> {
		return await this.hideButton.getAttribute('class').then(classes => classes?.includes('alert') || false);
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

	async waitForPageToLoad() {
		await this.pageTitle.waitFor({ state: 'visible' });
		await this.reportsTable.waitFor({ state: 'visible' });
	}

	async waitForReportsTableToLoad() {
		await this.reportsTable.waitFor({ state: 'visible' });
	}

	async hasReportsData(): Promise<boolean> {
		const rowCount = await this.getReportsTableRowCount();
		return rowCount > 0;
	}

	async getAllReportReasons(): Promise<string[]> {
		const rows = await this.tableRows.all();
		const reasons: string[] = [];

		for (const row of rows) {
			const reasonCell = row.locator('td').first();
			const reason = await reasonCell.textContent();
			if (reason) {
				reasons.push(reason.trim());
			}
		}

		return reasons;
	}

	async getReportByReason(reason: string) {
		return this.tableRows.filter({ has: this.page.locator(`td:has-text("${reason}")`) });
	}

	async hasReportWithReason(reason: string): Promise<boolean> {
		const report = await this.getReportByReason(reason);
		return (await report.count()) > 0;
	}

	async getContentDetails(): Promise<{
		id: string;
		language: string;
		type: string;
		reportedAt: string;
		participatorySpace: string;
		authors: string[];
		url: string;
	}> {
		return {
			id: await this.getContentId(),
			language: await this.getContentLanguage(),
			type: await this.getContentType(),
			reportedAt: await this.getReportedAt(),
			participatorySpace: await this.getParticipatorySpace(),
			authors: await this.getAuthors(),
			url: await this.getReportedContentUrl()
		};
	}
}
