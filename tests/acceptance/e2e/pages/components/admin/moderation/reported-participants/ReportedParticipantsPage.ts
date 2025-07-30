import { Page } from '@playwright/test';
import { ReportedParticipantsBreadcrumbComponent } from './ReportedParticipantsBreadcrumbComponent';
import { ReportedParticipantsSidebarComponent } from './ReportedParticipantsSidebarComponent';
import { ReportedParticipantsPageHeaderComponent } from './ReportedParticipantsPageHeaderComponent';
import { ReportedParticipantsFiltersComponent } from './ReportedParticipantsFiltersComponent';
import { ReportedParticipantsTableComponent } from './ReportedParticipantsTableComponent';
import { FlashMessageComponent } from '../process/FlashMessageComponent';

/**
 * Main page component for the Reported Participants page
 * Orchestrates all the individual UI components
 */
export class ReportedParticipantsPage {
	readonly page: Page;
	readonly breadcrumb: ReportedParticipantsBreadcrumbComponent;
	readonly sidebar: ReportedParticipantsSidebarComponent;
	readonly pageHeader: ReportedParticipantsPageHeaderComponent;
	readonly filters: ReportedParticipantsFiltersComponent;
	readonly table: ReportedParticipantsTableComponent;
	readonly flashMessage: FlashMessageComponent;

	constructor(page: Page) {
		this.page = page;
		this.breadcrumb = new ReportedParticipantsBreadcrumbComponent(page);
		this.sidebar = new ReportedParticipantsSidebarComponent(page);
		this.pageHeader = new ReportedParticipantsPageHeaderComponent(page);
		this.filters = new ReportedParticipantsFiltersComponent(page);
		this.table = new ReportedParticipantsTableComponent(page);
		this.flashMessage = new FlashMessageComponent(page);
	}

	/**
	 * Navigate to the reported participants page
	 */
	async navigateTo(): Promise<void> {
		await this.page.goto('/admin/moderated_users');
		await this.waitForPageLoad();
	}

	/**
	 * Navigate to the blocked participants page
	 */
	async navigateToBlocked(): Promise<void> {
		await this.page.goto('/admin/moderated_users?blocked=true');
		await this.waitForPageLoad();
	}

	/**
	 * Wait for the page to fully load
	 */
	async waitForPageLoad(): Promise<void> {
		await this.pageHeader.isVisible();
		await this.table.waitForTableToLoad();
	}

	/**
	 * Verify the page is displayed correctly
	 */
	async verifyPageStructure(): Promise<{
		breadcrumbVisible: boolean;
		sidebarVisible: boolean;
		headerVisible: boolean;
		filtersVisible: boolean;
		tableVisible: boolean;
	}> {
		return {
			breadcrumbVisible: await this.breadcrumb.isVisible(),
			sidebarVisible: await this.sidebar.isVisible(),
			headerVisible: await this.pageHeader.isVisible(),
			filtersVisible: await this.filters.isVisible(),
			tableVisible: await this.table.isVisible()
		};
	}

	/**
	 * Get comprehensive page information
	 */
	async getPageInformation(): Promise<{
		title: string;
		breadcrumbPath: string;
		sidebarData: {
			reportedContentCount: string;
			reportedParticipantsCount: string;
			reportedContentActive: boolean;
			reportedParticipantsActive: boolean;
		};
		participantCount: number;
		participants: Array<{
			name: string;
			nickname: string;
			reason: string;
			reportedAt: string;
			reportsCount: string;
			nameUrl: string;
			nicknameUrl: string;
			hasUnreportAction: boolean;
			hasBlockAction: boolean;
		}>;
		currentFilter: 'not-blocked' | 'blocked';
	}> {
		const title = await this.pageHeader.getTitleText();
		const breadcrumbPath = await this.breadcrumb.getBreadcrumbPath();
		const sidebarData = await this.sidebar.getSidebarData();
		const participantCount = await this.table.getParticipantCount();
		const participants = await this.table.getAllParticipantsData();
		const currentFilter = (await this.pageHeader.isBlockedFilterActive()) ? 'blocked' : 'not-blocked';

		return {
			title,
			breadcrumbPath,
			sidebarData,
			participantCount,
			participants,
			currentFilter
		};
	}

	/**
	 * Filter participants by "Not Blocked" status
	 */
	async filterByNotBlocked(): Promise<void> {
		await this.pageHeader.clickNotBlockedFilter();
		await this.waitForPageLoad();
	}

	/**
	 * Filter participants by "Blocked" status
	 */
	async filterByBlocked(): Promise<void> {
		await this.pageHeader.clickBlockedFilter();
		await this.waitForPageLoad();
	}

	/**
	 * Search for participants by name, nickname, or email
	 */
	async searchParticipants(searchTerm: string): Promise<void> {
		await this.filters.searchParticipant(searchTerm);
		await this.waitForPageLoad();
	}

	/**
	 * Apply report reason filter
	 */
	async filterByReportReason(reason: 'spam' | 'offensive' | 'does_not_belong'): Promise<void> {
		await this.filters.openReportReasonFilters();

		switch (reason) {
			case 'spam':
				await this.filters.clickSpamFilter();
				break;
			case 'offensive':
				await this.filters.clickOffensiveFilter();
				break;
			case 'does_not_belong':
				await this.filters.clickDoesNotBelongFilter();
				break;
		}

		await this.waitForPageLoad();
	}

	/**
	 * Sort participants by reported date
	 */
	async sortByReportedAt(): Promise<void> {
		await this.table.sortByReportedAt();
		await this.waitForPageLoad();
	}

	/**
	 * Sort participants by reports count
	 */
	async sortByReportsCount(): Promise<void> {
		await this.table.sortByReportsCount();
		await this.waitForPageLoad();
	}

	/**
	 * Unreport a participant
	 */
	async unreportParticipant(rowIndex: number): Promise<void> {
		await this.table.clickUnreportAction(rowIndex);
		// Wait for any confirmation dialogs or page changes
		await this.page.waitForTimeout(500);
	}

	/**
	 * Block a user
	 */
	async blockUser(rowIndex: number): Promise<void> {
		await this.table.clickBlockUserAction(rowIndex);
		// Wait for navigation to block user form or confirmation
		await this.page.waitForTimeout(500);
	}

	/**
	 * Navigate to participant profile
	 */
	async navigateToParticipantProfile(rowIndex: number, linkType: 'name' | 'nickname' = 'name'): Promise<void> {
		if (linkType === 'name') {
			await this.table.clickParticipantName(rowIndex);
		} else {
			await this.table.clickParticipantNickname(rowIndex);
		}
	}

	/**
	 * Navigate back using breadcrumb
	 */
	async navigateBackViaBreadcrumb(): Promise<void> {
		await this.breadcrumb.clickGlobalModerations();
	}

	/**
	 * Navigate to reported content via sidebar
	 */
	async navigateToReportedContent(): Promise<void> {
		await this.sidebar.clickReportedContent();
	}

	/**
	 * Find participant by name and get their row index
	 */
	async findParticipantByName(name: string): Promise<number | null> {
		return await this.table.findParticipantByName(name);
	}

	/**
	 * Find participant by nickname and get their row index
	 */
	async findParticipantByNickname(nickname: string): Promise<number | null> {
		return await this.table.findParticipantByNickname(nickname);
	}

	/**
	 * Check if the page shows any flash messages
	 */
	async hasFlashMessage(): Promise<boolean> {
		return await this.flashMessage.isFlashMessageVisible();
	}

	/**
	 * Get flash message if present
	 */
	async getFlashMessage(): Promise<string> {
		if (await this.hasFlashMessage()) {
			return await this.flashMessage.getFlashMessageText();
		}
		return '';
	}

	/**
	 * Verify all participants have required actions
	 */
	async verifyParticipantActions(): Promise<{
		allHaveUnreport: boolean;
		allHaveBlock: boolean;
		participantsWithoutActions: number[];
	}> {
		const count = await this.table.getParticipantCount();
		const participantsWithoutActions: number[] = [];
		let allHaveUnreport = true;
		let allHaveBlock = true;

		for (let i = 0; i < count; i++) {
			const hasUnreport = await this.table.hasUnreportAction(i);
			const hasBlock = await this.table.hasBlockAction(i);

			if (!hasUnreport) allHaveUnreport = false;
			if (!hasBlock) allHaveBlock = false;

			if (!hasUnreport || !hasBlock) {
				participantsWithoutActions.push(i);
			}
		}

		return {
			allHaveUnreport,
			allHaveBlock,
			participantsWithoutActions
		};
	}

	/**
	 * Get all participant names
	 */
	async getAllParticipantNames(): Promise<string[]> {
		return await this.table.getAllParticipantNames();
	}

	/**
	 * Get all participant nicknames
	 */
	async getAllParticipantNicknames(): Promise<string[]> {
		return await this.table.getAllParticipantNicknames();
	}

	/**
	 * Check if table is empty
	 */
	async isTableEmpty(): Promise<boolean> {
		return await this.table.isEmpty();
	}

	/**
	 * Get table headers
	 */
	async getTableHeaders(): Promise<string[]> {
		return await this.table.getTableHeaders();
	}

	/**
	 * Clear current search
	 */
	async clearSearch(): Promise<void> {
		await this.filters.clearSearch();
		await this.waitForPageLoad();
	}
}
