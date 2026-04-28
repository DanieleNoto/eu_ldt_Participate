/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Simone Bianchelli
 * Gianfranco Cedro
 */

import { Page } from '@playwright/test';
import { AdminActivityCardComponent } from '../../components/admin/AdminActivityCardComponent';
import { AdminDashboardHeaderComponent } from '../../components/admin/AdminDashboardHeaderComponent';
import { AdminLogsCardComponent } from '../../components/admin/AdminLogsCardComponent';
import { AdminMetricsCardComponent } from '../../components/admin/AdminMetricsCardComponent';
import { BaseAdminPage } from './BaseAdminPage';

/**
 * AdminHomePage - Page Object Model for the main admin dashboard.
 *
 * Extends BaseAdminPage and composes all dashboard-specific components:
 * - AdminDashboardHeaderComponent for breadcrumb and title
 * - AdminActivityCardComponent for activity statistics
 * - AdminMetricsCardComponent for participation metrics
 * - AdminLogsCardComponent for the admin log
 *
 * Integrates AdminNavigationComponent and AdminTitleBarComponent from BaseAdminPage.
 * Provides methods for navigation, section verification, and dashboard data management.
 */
export class AdminHomePage extends BaseAdminPage {
	// Dashboard-specific components
	public dashboardHeader: AdminDashboardHeaderComponent;
	public activityCard: AdminActivityCardComponent;
	public metricsCard: AdminMetricsCardComponent;
	public logsCard: AdminLogsCardComponent;

	constructor(page: Page) {
		super(page);

		// Initialization of dashboard-specific components
		this.dashboardHeader = new AdminDashboardHeaderComponent(page);
		this.activityCard = new AdminActivityCardComponent(page);
		this.metricsCard = new AdminMetricsCardComponent(page);
		this.logsCard = new AdminLogsCardComponent(page);
	}

	// Selectors for the main dashboard structure
	private get mainContent() {
		return this.page.locator('main.main');
	}

	private get layoutWrapper() {
		return this.page.locator('.layout-wrapper');
	}

	private get layoutContent() {
		return this.page.locator('.layout-content');
	}

	private get contentContainer() {
		return this.page.locator('.layout-content__container[data-content]');
	}

	private get dashboardContent() {
		return this.page.locator('.content');
	}

	private get gridContainer() {
		return this.page.locator('.grid-x.grid-margin-x');
	}

	private get adminTermsLink() {
		return this.page.locator('a[href*="/admin/admin_terms/show"]');
	}

	// Methods for navigating to the dashboard
	async navigateToAdminHomePage(locale: string = 'en'): Promise<void> {
		await this.navigateTo(`/admin/?locale=${locale}`);
	}

	async goToAdminDashboard(): Promise<void> {
		await this.navigateToAdminHomePage();
	}

	async navigateToDecidimAwesome(): Promise<void> {
		await this.page.getByRole('link', { name: 'Decidim awesome' }).click();
	}

	// Methods to verify the page structure
	async isPageLayoutValid(): Promise<boolean> {
		const main = await this.mainContent.isVisible();
		const wrapper = await this.layoutWrapper.isVisible();
		const content = await this.layoutContent.isVisible();
		const container = await this.contentContainer.isVisible();

		return main && wrapper && content && container;
	}

	async isDashboardContentVisible(): Promise<boolean> {
		return await this.dashboardContent.isVisible();
	}

	async isGridLayoutVisible(): Promise<boolean> {
		return await this.gridContainer.isVisible();
	}

	// Methods to verify dashboard components
	async isHeaderSectionVisible(): Promise<boolean> {
		const titleBarVisible = await this.adminTitleBar.isTitleBarVisible();
		const navigationVisible = await this.adminNavigation.isNavigationVisible();
		const dashboardHeaderVisible = await this.dashboardHeader.isComponentFullyLoaded();

		return titleBarVisible && navigationVisible && dashboardHeaderVisible;
	}

	async areAllCardsVisible(): Promise<boolean> {
		const activityVisible = await this.activityCard.isActivityCardVisible();
		const metricsVisible = await this.metricsCard.isMetricsCardVisible();
		const logsVisible = await this.logsCard.isLogsCardVisible();

		return activityVisible && metricsVisible && logsVisible;
	}

	async areAllCardsFullyLoaded(): Promise<boolean> {
		const activityLoaded = await this.activityCard.isActivityCardVisible();
		const metricsLoaded = await this.metricsCard.isCardFullyLoaded();
		const logsLoaded = await this.logsCard.isCardFullyLoaded();

		return activityLoaded && metricsLoaded && logsLoaded;
	}

	// Methods for interacting with the cards
	async getActivityData(): Promise<{
		participants: { lastMonth: string; lastWeek: string; lastDay: string };
		admins: { lastMonth: string; lastWeek: string; lastDay: string };
	}> {
		return {
			participants: await this.activityCard.getParticipantsData(),
			admins: await this.activityCard.getAdminsData()
		};
	}

	async getMetricsCount(): Promise<number> {
		return await this.metricsCard.getMetricsCount();
	}

	async getLogsCount(): Promise<number> {
		return await this.logsCard.getLogEntriesCount();
	}

	async getMostRecentLogInfo(): Promise<{ date: string; author: string }> {
		return {
			date: await this.logsCard.getMostRecentLogDate(),
			author: await this.logsCard.getMostRecentLogAuthor()
		};
	}

	// Methods for navigation via dashboard
	async navigateToMetricsDetails(): Promise<void> {
		await this.metricsCard.clickViewDetails();
	}

	async navigateToLogsDetails(): Promise<void> {
		await this.logsCard.clickViewMoreLogs();
	}

	async navigateToAdminTerms(): Promise<void> {
		await this.adminTermsLink.click();
	}

	// Methods to verify the presence of specific elements
	async hasAdminTermsLink(): Promise<boolean> {
		return await this.adminTermsLink.isVisible();
	}

	async getAdminTermsLinkText(): Promise<string> {
		return (await this.adminTermsLink.textContent()) || '';
	}

	// Methods for interacting with the log
	async expandLogEntry(index: number): Promise<void> {
		await this.logsCard.expandLogEntry(index);
	}

	async getLogEntryDetails(index: number): Promise<{ date: string; explanation: string; author: string }> {
		return await this.logsCard.getLogEntryByIndex(index);
	}

	// Methods to verify the dashboard state
	async isDashboardFullyLoaded(): Promise<boolean> {
		const layoutValid = await this.isPageLayoutValid();
		const adminLayoutLoaded = await this.isAdminLayoutLoaded();
		const headerVisible = await this.isHeaderSectionVisible();
		const cardsLoaded = await this.areAllCardsFullyLoaded();
		const dashboardContentVisible = await this.isDashboardContentVisible();

		return layoutValid && adminLayoutLoaded && headerVisible && cardsLoaded && dashboardContentVisible;
	}

	// Methods for interacting with the breadcrumb
	async navigateToHomeViaBreadcrumb(): Promise<void> {
		await this.dashboardHeader.clickHomeIcon();
	}

	async getDashboardTitle(): Promise<string> {
		return await this.dashboardHeader.getDashboardTitle();
	}

	// Methods to verify the presence of notifications
	async hasNotifications(): Promise<boolean> {
		return await this.dashboardHeader.hasCalloutNotifications();
	}

	async getNotificationContent(): Promise<string> {
		return await this.dashboardHeader.getCalloutContent();
	}

	// Methods to verify the admin session state
	async isAdminSessionActive(): Promise<boolean> {
		const isLoggedIn = await this.isLoggedIn();
		const hasAdminPermissions = await this.hasAdminPermissions();
		const dashboardLoaded = await this.isDashboardFullyLoaded();

		return isLoggedIn && hasAdminPermissions && dashboardLoaded;
	}

	// Methods to get aggregated dashboard information
	async getDashboardSummary(): Promise<{
		title: string;
		organizationName: string;
		currentUser: string;
		activityData: any;
		metricsCount: number;
		logsCount: number;
		mostRecentLog: any;
	}> {
		return {
			title: await this.getDashboardTitle(),
			organizationName: await this.getOrganizationName(),
			currentUser: await this.getCurrentAdminUser(),
			activityData: await this.getActivityData(),
			metricsCount: await this.getMetricsCount(),
			logsCount: await this.getLogsCount(),
			mostRecentLog: await this.getMostRecentLogInfo()
		};
	}

	// Methods to manage the locale via AdminTitleBarComponent

	/**
	 * Checks if the language dropdown is visible
	 */
	async isLanguageDropdownVisible(): Promise<boolean> {
		await this.adminTitleBar.openLanguageDropdown();
		await this.page.waitForTimeout(500); // Waits for the dropdown to open
		return await this.adminTitleBar.isLanguageDropdownVisible();
	}

	/**
	 * Gets the current language from the dropdown
	 */
	async getCurrentLanguage(): Promise<string> {
		return await this.adminTitleBar.getCurrentLanguage();
	}

	/**
	 * Checks if a specific language is available in the dropdown
	 */
	async isLanguageAvailable(languageName: string): Promise<boolean> {
		return await this.adminTitleBar.isLanguageAvailable(languageName);
	}

	/**
	 * Selects a specific language from the dropdown
	 */
	async selectLanguage(languageCode: string): Promise<void> {
		await this.adminTitleBar.selectLanguage(languageCode);
	}

	/**
	 * Gets all available languages from the dropdown
	 */
	async getAvailableLanguages(): Promise<string[]> {
		return await this.adminTitleBar.getAvailableLanguages();
	}

	/**
	 * Sets the English locale if available
	 */
	async setEnglishLocale(): Promise<boolean> {
		const currentLanguage = await this.getCurrentLanguage();

		// Checks if English is already selected
		if (currentLanguage.toLowerCase().includes('en') || currentLanguage.toLowerCase().includes('english')) {
			return true;
		}

		// Checks if English is available and selects it
		const isEnglishAvailable = await this.isLanguageAvailable('English');
		if (isEnglishAvailable) {
			await this.selectLanguage('en');
			// Waits for the page to reload with the new locale
			await this.page.waitForLoadState('load');
			return true;
		}

		return false;
	}
}
