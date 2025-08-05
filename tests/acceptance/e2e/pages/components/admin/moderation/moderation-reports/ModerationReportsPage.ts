import { Page } from '@playwright/test';
import { ModerationReportsBreadcrumbComponent } from './ModerationReportsBreadcrumbComponent';
import { ModerationReportsSidebarComponent } from './ModerationReportsSidebarComponent';
import { ModerationReportsPageHeaderComponent } from './ModerationReportsPageHeaderComponent';
import { ModerationReportsWarningComponent } from './ModerationReportsWarningComponent';
import { ModerationReportsContentDetailsComponent } from './ModerationReportsContentDetailsComponent';
import { ModerationReportsTableComponent } from './ModerationReportsTableComponent';
import { ModerationReportsActionsComponent } from './ModerationReportsActionsComponent';
import { FlashMessageComponent } from '../process/FlashMessageComponent';

/**
 * Main page component for the Moderation Reports page
 * Orchestrates all the individual UI components
 */
export class ModerationReportsPage {
	readonly page: Page;
	readonly breadcrumb: ModerationReportsBreadcrumbComponent;
	readonly sidebar: ModerationReportsSidebarComponent;
	readonly pageHeader: ModerationReportsPageHeaderComponent;
	readonly warning: ModerationReportsWarningComponent;
	readonly contentDetails: ModerationReportsContentDetailsComponent;
	readonly reportsTable: ModerationReportsTableComponent;
	readonly actions: ModerationReportsActionsComponent;
	readonly flashMessage: FlashMessageComponent;

	constructor(page: Page) {
		this.page = page;
		this.breadcrumb = new ModerationReportsBreadcrumbComponent(page);
		this.sidebar = new ModerationReportsSidebarComponent(page);
		this.pageHeader = new ModerationReportsPageHeaderComponent(page);
		this.warning = new ModerationReportsWarningComponent(page);
		this.contentDetails = new ModerationReportsContentDetailsComponent(page);
		this.reportsTable = new ModerationReportsTableComponent(page);
		this.actions = new ModerationReportsActionsComponent(page);
		this.flashMessage = new FlashMessageComponent(page);
	}

	/**
	 * Navigate to the moderation reports page
	 */
	async navigateTo(reportId: string): Promise<void> {
		await this.page.goto(`/admin/moderation_reports/${reportId}`);
		await this.waitForPageLoad();
	}

	/**
	 * Wait for the page to fully load
	 */
	async waitForPageLoad(): Promise<void> {
		await this.pageHeader.isVisible();
		await this.contentDetails.isVisible();
		await this.reportsTable.isVisible();
	}

	/**
	 * Verify the page is displayed correctly
	 */
	async verifyPageStructure(): Promise<{
		breadcrumbVisible: boolean;
		sidebarVisible: boolean;
		headerVisible: boolean;
		warningVisible: boolean;
		contentDetailsVisible: boolean;
		tableVisible: boolean;
		actionsVisible: boolean;
	}> {
		return {
			breadcrumbVisible: await this.breadcrumb.isVisible(),
			sidebarVisible: await this.sidebar.isVisible(),
			headerVisible: await this.pageHeader.isVisible(),
			warningVisible: await this.warning.isVisible(),
			contentDetailsVisible: await this.contentDetails.isVisible(),
			tableVisible: await this.reportsTable.isVisible(),
			actionsVisible: await this.actions.isVisible()
		};
	}

	/**
	 * Get comprehensive report information
	 */
	async getReportInformation(): Promise<{
		title: string;
		warningMessage: string;
		contentUrl: string;
		contentId: string;
		contentLanguage: string;
		contentBody: string;
		contentAuthors: string;
		reportCount: number;
		reports: Array<{
			reason: string;
			language: string;
			details: string;
			reportedBy: string;
			createdAt: string;
			hasActions: boolean;
		}>;
	}> {
		const title = await this.pageHeader.getTitleText();
		const warningMessage = await this.warning.getWarningText();
		const contentUrl = await this.contentDetails.getContentUrl();
		const contentId = await this.contentDetails.getContentId();
		const contentLanguage = await this.contentDetails.getContentLanguage();
		const contentBody = await this.contentDetails.getContentBody();
		const contentAuthors = await this.contentDetails.getContentAuthors();
		const reportCount = await this.reportsTable.getReportCount();
		const reports = await this.reportsTable.getAllReportsData();

		return {
			title,
			warningMessage,
			contentUrl,
			contentId,
			contentLanguage,
			contentBody,
			contentAuthors,
			reportCount,
			reports
		};
	}

	/**
	 * Perform unreport action
	 */
	async unreportContent(): Promise<void> {
		await this.actions.waitForActionsReady();
		await this.actions.clickUnreport();
		// Wait for any confirmation dialogs or page changes
		await this.page.waitForTimeout(500);
	}

	/**
	 * Perform hide action
	 */
	async hideContent(): Promise<void> {
		await this.actions.waitForActionsReady();
		await this.actions.clickHide();
		// Wait for any confirmation dialogs or page changes
		await this.page.waitForTimeout(500);
	}

	/**
	 * Navigate back using the breadcrumb
	 */
	async navigateBackViaBreadcrumb(): Promise<void> {
		await this.breadcrumb.clickGlobalModerations();
	}

	/**
	 * Navigate back using the back button
	 */
	async navigateBackViaBackButton(): Promise<void> {
		await this.pageHeader.clickBack();
	}

	/**
	 * Navigate to reported content via sidebar
	 */
	async navigateToReportedContent(): Promise<void> {
		await this.sidebar.clickReportedContent();
	}

	/**
	 * Navigate to reported participants via sidebar
	 */
	async navigateToReportedParticipants(): Promise<void> {
		await this.sidebar.clickReportedParticipants();
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
	 * Verify the content details section has all required information
	 */
	async verifyContentDetailsComplete(): Promise<boolean> {
		return await this.contentDetails.hasAllContentDetails();
	}

	/**
	 * Get the moderation actions available
	 */
	async getAvailableActions(): Promise<{
		unreportAvailable: boolean;
		hideAvailable: boolean;
		unreportEnabled: boolean;
		hideEnabled: boolean;
	}> {
		return {
			unreportAvailable: await this.actions.isUnreportVisible(),
			hideAvailable: await this.actions.isHideVisible(),
			unreportEnabled: await this.actions.isUnreportEnabled(),
			hideEnabled: await this.actions.isHideEnabled()
		};
	}
}
