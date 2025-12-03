/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Denis Vasilev Dimchev
 */

import { expect, Locator, Page } from '@playwright/test';
import { BaseAdminPage } from '../../../../BaseAdminPage';

/**
 * Page Object Model for the Meetings management page.
 * Handles meeting management including filtering, searching, and performing actions on meetings.
 */
export class MeetingsManagePage extends BaseAdminPage {
	// Main page elements
	private readonly pageTitle: Locator;

	// Header elements
	private readonly exportDropdown: Locator;
	private readonly exportDropdownTrigger: Locator;
	private readonly newMeetingButton: Locator;
	private readonly configureButton: Locator;

	// Export options
	private readonly exportMeetingsCsv: Locator;
	private readonly exportMeetingsJson: Locator;
	private readonly exportMeetingsExcel: Locator;
	private readonly exportCommentsCsv: Locator;
	private readonly exportCommentsJson: Locator;
	private readonly exportCommentsExcel: Locator;
	private readonly exportAnswersCsv: Locator;
	private readonly exportAnswersJson: Locator;
	private readonly exportAnswersExcel: Locator;
	private readonly exportAnswersPdf: Locator;

	// Filter elements
	private readonly filterButton: Locator;

	// Filter submenu items
	private readonly typeOfMeetingFilter: Locator;
	private readonly inPersonFilter: Locator;
	private readonly onlineFilter: Locator;
	private readonly hybridFilter: Locator;
	private readonly stateFilter: Locator;
	private readonly closedFilter: Locator;
	private readonly openFilter: Locator;
	private readonly dateFilter: Locator;
	private readonly upcomingFilter: Locator;
	private readonly pastFilter: Locator;
	private readonly originFilter: Locator;
	private readonly participantOriginFilter: Locator;
	private readonly officialOriginFilter: Locator;
	private readonly userGroupOriginFilter: Locator;

	// Search elements
	private readonly searchInput: Locator;
	private readonly searchButton: Locator;

	// Table elements
	private readonly tableHeaders: Locator;
	private readonly meetingRows: Locator;

	// Table header columns
	private readonly idHeader: Locator;
	private readonly titleHeader: Locator;
	private readonly startDateHeader: Locator;
	private readonly endDateHeader: Locator;
	private readonly closedHeader: Locator;
	private readonly taxonomiesHeader: Locator;

	// Footer elements
	private readonly deletedMeetingsLink: Locator;

	constructor(page: Page) {
		super(page);

		// Main page elements
		this.pageTitle = page.locator('.item_show__header-title h1, h1.item_show__header-title');

		// Header elements
		this.exportDropdown = page.locator('#export-dropdown');
		this.exportDropdownTrigger = page.locator('[data-toggle="export-dropdown"]');
		this.newMeetingButton = page.locator('a.button:has-text("New meeting")');
		this.configureButton = page.locator('a.button:has-text("Configure")');

		// Export options
		this.exportMeetingsCsv = page.locator('a[href*="exports.CSV?id=meetings"]');
		this.exportMeetingsJson = page.locator('a[href*="exports.JSON?id=meetings"]');
		this.exportMeetingsExcel = page.locator('a[href*="exports.Excel?id=meetings"]');
		this.exportCommentsCsv = page.locator('a[href*="exports.CSV?id=meeting_comments"]');
		this.exportCommentsJson = page.locator('a[href*="exports.JSON?id=meeting_comments"]');
		this.exportCommentsExcel = page.locator('a[href*="exports.Excel?id=meeting_comments"]');
		this.exportAnswersCsv = page.locator('a[href*="exports.CSV?id=answers"]');
		this.exportAnswersJson = page.locator('a[href*="exports.JSON?id=answers"]');
		this.exportAnswersExcel = page.locator('a[href*="exports.Excel?id=answers"]');
		this.exportAnswersPdf = page.locator('a[href*="exports.FormPDF?id=answers"]');

		// Filter elements
		this.filterButton = page.locator('a.dropdown.button:has-text("Filter")');

		// Filter submenu items
		this.typeOfMeetingFilter = page.locator('a[aria-label="Type of meeting"]');
		this.inPersonFilter = page.locator('a[href*="with_any_type%5D=in_person"]');
		this.onlineFilter = page.locator('a[href*="with_any_type%5D=online"]');
		this.hybridFilter = page.locator('a[href*="with_any_type%5D=hybrid"]');
		this.stateFilter = page.locator('a[aria-label="State"]');
		this.closedFilter = page.locator('a[href*="closed_at_present%5D=true"]');
		this.openFilter = page.locator('a[href*="closed_at_present%5D=false"]');
		this.dateFilter = page.locator('a[aria-label="Date"]');
		this.upcomingFilter = page.locator('a[href*="is_upcoming_true%5D=true"]');
		this.pastFilter = page.locator('a[href*="is_upcoming_true%5D=false"]');
		this.originFilter = page.locator('a[aria-label="Origin"]');
		this.participantOriginFilter = page.locator('a[href*="with_any_origin%5D=participants"]');
		this.officialOriginFilter = page.locator('a[href*="with_any_origin%5D=official"]');
		this.userGroupOriginFilter = page.locator('a[href*="with_any_origin%5D=user_group"]');

		// Search elements
		this.searchInput = page.locator('input[name="q[id_string_or_title_cont]"]');
		this.searchButton = page.locator('button[type="submit"][aria-label="Search"]');

		// Table elements
		this.tableHeaders = page.locator('.table-list thead th');
		this.meetingRows = page.locator('.table-list tbody tr');

		// Table header columns
		this.idHeader = page.locator('th:has(a[href*="q%5Bs%5D=id"])');
		this.titleHeader = page.locator('th:has(a[href*="q%5Bs%5D=translated_title"])');
		this.startDateHeader = page.locator('th:has(a[href*="q%5Bs%5D=start_time"])');
		this.endDateHeader = page.locator('th:has(a[href*="q%5Bs%5D=end_time"])');
		this.closedHeader = page.locator('th:has(a[href*="q%5Bs%5D=closed"])');
		this.taxonomiesHeader = page.locator('th:has(a[href*="q%5Bs%5D=scope_name"])');

		// Footer elements
		this.deletedMeetingsLink = page.locator('a[href*="manage_trash"]:has-text("View deleted meetings")');
	}

	// Navigation and page state
	async navigateToMeetings(processSlug: string, componentId: string) {
		await this.page.goto(`/admin/participatory_processes/${processSlug}/components/${componentId}/manage/meetings`);
		await this.waitForMeetingsPageLoad();
	}

	async waitForMeetingsPageLoad() {
		await this.page.waitForSelector('.item_show__wrapper');
		await this.page.waitForSelector('.table-list');
		await this.page.waitForLoadState('networkidle');
	}

	async isOnMeetingsPage(): Promise<boolean> {
		const url = this.page.url();
		return (
			url.includes('/admin/participatory_processes/') && url.includes('/components/') && url.includes('/manage/')
		);
	}

	async getPageTitle(): Promise<string> {
		return (await this.pageTitle.textContent()) || '';
	}

	// Header actions
	async clickNewMeeting() {
		await this.newMeetingButton.click();
		await this.page.waitForLoadState('networkidle');
	}

	async clickConfigure() {
		await this.configureButton.click();
		await this.page.waitForLoadState('networkidle');
	}

	// Export functionality
	async openExportDropdown() {
		await this.exportDropdownTrigger.click();
		await expect(this.exportDropdown).toBeVisible();
	}

	async closeExportDropdown() {
		if (await this.exportDropdown.isVisible()) {
			await this.exportDropdownTrigger.click();
			await expect(this.exportDropdown).not.toBeVisible();
		}
	}

	async exportMeetingsAsCsv() {
		await this.openExportDropdown();
		await this.exportMeetingsCsv.click();
	}

	async exportMeetingsAsJson() {
		await this.openExportDropdown();
		await this.exportMeetingsJson.click();
	}

	async exportMeetingsAsExcel() {
		await this.openExportDropdown();
		await this.exportMeetingsExcel.click();
	}

	async exportCommentsAsCsv() {
		await this.openExportDropdown();
		await this.exportCommentsCsv.click();
	}

	async exportCommentsAsJson() {
		await this.openExportDropdown();
		await this.exportCommentsJson.click();
	}

	async exportCommentsAsExcel() {
		await this.openExportDropdown();
		await this.exportCommentsExcel.click();
	}

	async exportAnswersAsCsv() {
		await this.openExportDropdown();
		await this.exportAnswersCsv.click();
	}

	async exportAnswersAsJson() {
		await this.openExportDropdown();
		await this.exportAnswersJson.click();
	}

	async exportAnswersAsExcel() {
		await this.openExportDropdown();
		await this.exportAnswersExcel.click();
	}

	async exportAnswersAsPdf() {
		await this.openExportDropdown();
		await this.exportAnswersPdf.click();
	}

	// Filter functionality
	async openFilterDropdown() {
		await this.filterButton.click();
		await this.page.waitForTimeout(500); // Wait for dropdown animation
	}

	async filterByMeetingType(type: 'in_person' | 'online' | 'hybrid') {
		await this.openFilterDropdown();
		await this.typeOfMeetingFilter.hover();

		switch (type) {
			case 'in_person':
				await this.inPersonFilter.click();
				break;
			case 'online':
				await this.onlineFilter.click();
				break;
			case 'hybrid':
				await this.hybridFilter.click();
				break;
		}
		await this.page.waitForLoadState('networkidle');
	}

	async filterByState(state: 'closed' | 'open') {
		await this.openFilterDropdown();
		await this.stateFilter.hover();

		if (state === 'closed') {
			await this.closedFilter.click();
		} else {
			await this.openFilter.click();
		}
		await this.page.waitForLoadState('networkidle');
	}

	async filterByDate(dateType: 'upcoming' | 'past') {
		await this.openFilterDropdown();
		await this.dateFilter.hover();

		if (dateType === 'upcoming') {
			await this.upcomingFilter.click();
		} else {
			await this.pastFilter.click();
		}
		await this.page.waitForLoadState('networkidle');
	}

	async filterByOrigin(origin: 'participants' | 'official' | 'user_group') {
		await this.openFilterDropdown();
		await this.originFilter.hover();

		switch (origin) {
			case 'participants':
				await this.participantOriginFilter.click();
				break;
			case 'official':
				await this.officialOriginFilter.click();
				break;
			case 'user_group':
				await this.userGroupOriginFilter.click();
				break;
		}
		await this.page.waitForLoadState('networkidle');
	}

	// Search functionality
	async searchMeetings(searchTerm: string) {
		await this.searchInput.fill(searchTerm);
		await this.searchButton.click();
		await this.page.waitForLoadState('networkidle');
	}

	async clearSearch() {
		await this.searchInput.clear();
		await this.searchButton.click();
		await this.page.waitForLoadState('networkidle');
	}

	// Table sorting
	async sortById(direction: 'asc' | 'desc' = 'desc') {
		await this.idHeader.locator('a').click();
		await this.page.waitForLoadState('networkidle');
	}

	async sortByTitle(direction: 'asc' | 'desc' = 'desc') {
		await this.titleHeader.locator('a').click();
		await this.page.waitForLoadState('networkidle');
	}

	async sortByStartDate(direction: 'asc' | 'desc' = 'desc') {
		await this.startDateHeader.locator('a').click();
		await this.page.waitForLoadState('networkidle');
	}

	async sortByEndDate(direction: 'asc' | 'desc' = 'desc') {
		await this.endDateHeader.locator('a').click();
		await this.page.waitForLoadState('networkidle');
	}

	async sortByClosed(direction: 'asc' | 'desc' = 'desc') {
		await this.closedHeader.locator('a').click();
		await this.page.waitForLoadState('networkidle');
	}

	async sortByTaxonomies(direction: 'asc' | 'desc' = 'asc') {
		await this.taxonomiesHeader.locator('a').click();
		await this.page.waitForLoadState('networkidle');
	}

	// Table data methods
	async getMeetingsCount(): Promise<number> {
		return await this.meetingRows.count();
	}

	async getTableHeaders(): Promise<string[]> {
		return await this.tableHeaders.allTextContents();
	}

	async getMeetingTitles(): Promise<string[]> {
		const titleLinks = this.meetingRows.locator('td:nth-child(2) a');
		return await titleLinks.allTextContents();
	}

	async getMeetingIds(): Promise<string[]> {
		const idCells = this.meetingRows.locator('td:first-child');
		const ids = await idCells.allTextContents();
		return ids.map(id => id.trim().split('\n')[0]);
	}

	// Meeting row methods
	getMeetingRow(meetingId: string): Locator {
		return this.meetingRows.filter({ has: this.page.locator(`td:first-child:has-text("${meetingId}")`) }).first();
	}

	getMeetingRowByTitle(title: string): Locator {
		return this.meetingRows.filter({ has: this.page.locator(`td:nth-child(2) a:has-text("${title}")`) }).first();
	}

	getMeetingRowByIndex(index: number): Locator {
		return this.meetingRows.nth(index);
	}

	// Meeting data extraction
	async getMeetingData(meetingId: string): Promise<{
		id: string;
		title: string;
		startDate: string;
		endDate: string;
		closed: string;
		hasMap: boolean;
		taxonomies: string;
	}> {
		const row = this.getMeetingRow(meetingId);

		const id = (await row.locator('td:nth-child(1)').textContent()) || '';
		const title = (await row.locator('td:nth-child(2) a').textContent()) || '';
		const startDate = (await row.locator('td:nth-child(3)').textContent()) || '';
		const endDate = (await row.locator('td:nth-child(4)').textContent()) || '';
		const closed = (await row.locator('td:nth-child(5)').textContent()) || '';
		const hasMap = await row.locator('td:nth-child(6) a.static-map__admin').isVisible();
		const taxonomies = (await row.locator('td:nth-child(7)').textContent()) || '';

		return {
			id: id.trim().split('\n')[0],
			title: title.trim(),
			startDate: startDate.trim(),
			endDate: endDate.trim(),
			closed: closed.trim(),
			hasMap,
			taxonomies: taxonomies.trim()
		};
	}

	// Meeting actions
	async editMeeting(meetingId: string) {
		const row = this.getMeetingRow(meetingId);
		const editButton = row.locator('a.action-icon--edit');
		await editButton.click();
		await this.page.waitForLoadState('networkidle');
	}

	async duplicateMeeting(meetingId: string) {
		const row = this.getMeetingRow(meetingId);
		const duplicateButton = row.locator('a.action-icon--copy');
		await duplicateButton.click();
		await this.page.waitForLoadState('networkidle');
	}

	async manageFolders(meetingId: string) {
		const row = this.getMeetingRow(meetingId);
		const foldersButton = row.locator('a.action-icon--attachment_collections');
		await foldersButton.click();
		await this.page.waitForLoadState('networkidle');
	}

	async manageAttachments(meetingId: string) {
		const row = this.getMeetingRow(meetingId);
		const attachmentsButton = row.locator('a.action-icon--attachments');
		await attachmentsButton.click();
		await this.page.waitForLoadState('networkidle');
	}

	async manageRegistrations(meetingId: string) {
		const row = this.getMeetingRow(meetingId);
		const registrationsButton = row.locator('a.action-icon--registrations');
		await registrationsButton.click();
		await this.page.waitForLoadState('networkidle');
	}

	async manageAgenda(meetingId: string) {
		const row = this.getMeetingRow(meetingId);
		const agendaButton = row.locator('a.action-icon--agenda');
		await agendaButton.click();
		await this.page.waitForLoadState('networkidle');
	}

	async managePoll(meetingId: string) {
		const row = this.getMeetingRow(meetingId);
		const pollButton = row.locator('a.action-icon--manage-poll-questionnaire');
		await pollButton.click();
		await this.page.waitForLoadState('networkidle');
	}

	async closeMeeting(meetingId: string) {
		const row = this.getMeetingRow(meetingId);
		const closeButton = row.locator('a.action-icon--close');
		await closeButton.click();
		await this.page.waitForLoadState('networkidle');
	}

	async unpublishMeeting(meetingId: string) {
		const row = this.getMeetingRow(meetingId);
		const unpublishButton = row.locator('a.action-icon--unpublish');

		// Click the unpublish button
		await unpublishButton.click();

		// Wait for the confirmation modal to appear
		const confirmModal = this.page.locator('#confirm-modal');
		await confirmModal.waitFor({ state: 'visible' });

		// Click the OK button to confirm the unpublish action
		const confirmButton = confirmModal.locator('button[data-confirm-ok]');
		await confirmButton.click();

		// Wait for the modal to disappear and the action to complete
		await confirmModal.waitFor({ state: 'hidden' });
		await this.page.waitForLoadState('networkidle');
	}

	async previewMeeting(meetingId: string) {
		const row = this.getMeetingRow(meetingId);
		const previewButton = row.locator('a.action-icon--preview');
		await previewButton.click();
	}

	async managePermissions(meetingId: string) {
		const row = this.getMeetingRow(meetingId);
		const permissionsButton = row.locator('a.action-icon--permissions');
		await permissionsButton.click();
		await this.page.waitForLoadState('networkidle');
	}

	async softDeleteMeeting(meetingId: string, opts: { confirm?: boolean } = { confirm: true }) {
		const { confirm = true } = opts;
		const row = this.getMeetingRow(meetingId);
		const deleteButton = row.locator('a.action-icon--delete');

		// Click the soft delete button
		await deleteButton.click();

		// Wait for the confirmation modal to appear
		const confirmModal = this.page.locator('#confirm-modal');
		await confirmModal.waitFor({ state: 'visible' });

		if (confirm) {
			// Confirm deletion
			const confirmButton = confirmModal.locator('button[data-confirm-ok]');
			await confirmButton.click();
		} else {
			// Cancel deletion
			const cancelButton = confirmModal.locator('button[data-confirm-cancel]');
			await cancelButton.click();
		}

		// Wait for the modal to disappear and the action to complete or abort
		await confirmModal.waitFor({ state: 'hidden' });
		await this.page.waitForLoadState('networkidle');
	}

	// Meeting state checks
	async isMeetingClosed(meetingId: string): Promise<boolean> {
		const meetingData = await this.getMeetingData(meetingId);
		return meetingData.closed.toLowerCase() === 'yes';
	}

	async isMeetingOpen(meetingId: string): Promise<boolean> {
		const meetingData = await this.getMeetingData(meetingId);
		return meetingData.closed.toLowerCase() === 'no';
	}

	async hasMeetingMap(meetingId: string): Promise<boolean> {
		const meetingData = await this.getMeetingData(meetingId);
		return meetingData.hasMap;
	}

	async hasActionPermission(
		meetingId: string,
		action:
			| 'edit'
			| 'duplicate'
			| 'folders'
			| 'attachments'
			| 'registrations'
			| 'agenda'
			| 'poll'
			| 'close'
			| 'unpublish'
			| 'preview'
			| 'permissions'
			| 'delete'
	): Promise<boolean> {
		const row = this.getMeetingRow(meetingId);
		const actionMap = {
			edit: 'a.action-icon--edit',
			duplicate: 'a.action-icon--copy',
			folders: 'a.action-icon--attachment_collections',
			attachments: 'a.action-icon--attachments',
			registrations: 'a.action-icon--registrations',
			agenda: 'a.action-icon--agenda',
			poll: 'a.action-icon--manage-poll-questionnaire',
			close: 'a.action-icon--close',
			unpublish: 'a.action-icon--unpublish',
			preview: 'a.action-icon--preview',
			permissions: 'a.action-icon--permissions',
			delete: 'a.action-icon--delete'
		};

		const selector = actionMap[action];
		if (!selector) {
			throw new Error(`Unknown action: ${action}`);
		}

		return await row.locator(selector).isVisible();
	}

	// Footer actions
	async viewDeletedMeetings() {
		await this.deletedMeetingsLink.click();
		await this.page.waitForLoadState('networkidle');
	}

	// Validation methods
	async expectMeetingExists(meetingId: string) {
		await expect(this.getMeetingRow(meetingId)).toBeVisible();
	}

	async expectMeetingNotExists(meetingId: string) {
		await expect(this.getMeetingRow(meetingId)).not.toBeVisible();
	}

	async expectMeetingIsClosed(meetingId: string) {
		expect(await this.isMeetingClosed(meetingId)).toBeTruthy();
	}

	async expectMeetingIsOpen(meetingId: string) {
		expect(await this.isMeetingOpen(meetingId)).toBeTruthy();
	}

	async expectMeetingsCount(expectedCount: number) {
		await expect(this.meetingRows).toHaveCount(expectedCount);
	}

	// URL expectations
	async expectToBeOnMeetingsPage() {
		// Accept: .../manage, .../manage/, .../manage/meetings, .../manage/meetings/
		await expect(this.page).toHaveURL(
			/\/admin\/participatory_processes\/.*\/components\/.*\/manage(?:\/meetings)?\/?$/
		);
	}

	async expectToBeOnNewMeetingPage() {
		await expect(this.page).toHaveURL(
			/\/admin\/participatory_processes\/.*\/components\/.*\/manage\/meetings\/new$/
		);
	}

	async expectToBeOnEditMeetingPage(meetingId: string) {
		await expect(this.page).toHaveURL(
			new RegExp(`/admin/participatory_processes/.*/components/.*/manage/meetings/${meetingId}/edit$`)
		);
	}

	// Bulk operations
	async getAllMeetingsData(): Promise<
		Array<{
			id: string;
			title: string;
			startDate: string;
			endDate: string;
			closed: string;
			hasMap: boolean;
			taxonomies: string;
		}>
	> {
		const meetings = [];
		const count = await this.getMeetingsCount();

		for (let i = 0; i < count; i++) {
			const row = this.getMeetingRowByIndex(i);

			const id = (await row.locator('td:nth-child(1)').textContent()) || '';

			// Handle both cases: title with link and title without link
			let title = '';
			const titleCell = row.locator('td:nth-child(2)');
			const titleLink = titleCell.locator('a');
			if (await titleLink.isVisible()) {
				title = (await titleLink.textContent()) || '';
			} else {
				title = (await titleCell.textContent()) || '';
			}

			const startDate = (await row.locator('td:nth-child(3)').textContent()) || '';
			const endDate = (await row.locator('td:nth-child(4)').textContent()) || '';
			const closed = (await row.locator('td:nth-child(5)').textContent()) || '';
			const taxonomies = (await row.locator('td:nth-child(6)').textContent()) || '';

			meetings.push({
				id: id.trim().split('\n')[0],
				title: title.trim(),
				startDate: startDate.trim(),
				endDate: endDate.trim(),
				closed: closed.trim(),
				taxonomies: taxonomies.trim()
			});
		}

		return meetings;
	}

	// Search and filter methods
	async findMeetingById(id: string): Promise<boolean> {
		const meetingIds = await this.getMeetingIds();
		return meetingIds.includes(id);
	}

	async findMeetingByTitle(title: string): Promise<boolean> {
		const meetingTitles = await this.getMeetingTitles();
		return meetingTitles.some(meetingTitle => meetingTitle.toLowerCase().includes(title.toLowerCase()));
	}

	async findMeetingsByState(state: 'closed' | 'open'): Promise<string[]> {
		const meetings = await this.getAllMeetingsData();
		const targetState = state === 'closed' ? 'Yes' : 'No';
		return meetings.filter(meeting => meeting.closed === targetState).map(meeting => meeting.id);
	}
}
