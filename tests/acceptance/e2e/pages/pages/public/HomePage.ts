import { BasePage } from '@pages/base/BasePage';
import { Page, expect } from '@playwright/test';
import { AdminHeaderComponent } from '../../components/admin/AdminHeaderComponent';
import { FooterComponent } from '../../components/common/FooterComponent';
import { OfflineMessageComponent } from '../../components/common/OfflineMessageComponent';
import { CallToActionSectionComponent } from '../../components/home/CallToActionSectionComponent';
import { HeroSectionComponent } from '../../components/home/HeroSectionComponent';
import { ParticipationSectionComponent } from '../../components/home/ParticipationSectionComponent';
import { StatisticsSectionComponent } from '../../components/home/StatisticsSectionComponent';

/**
 * HomePage - Page Object Model for the main site page.
 *
 * Extends BasePage and composes all necessary components for the homepage:
 * - AdminHeaderComponent for the admin bar (when visible)
 * - Footer, OfflineMessage, and homepage sections
 * - Integrates HeaderComponent and CookieBarComponent from BasePage
 *
 * Supports both anonymous and authenticated users, including admins.
 * Provides methods for navigation, section verification, and flash message management using the public API of BasePage.
 */
export class HomePage extends BasePage {
	// Page components (header is inherited from BasePage)
	public adminHeader: AdminHeaderComponent;
	public footer: FooterComponent;
	public offlineMessage: OfflineMessageComponent;
	public heroSection: HeroSectionComponent;
	public participationSection: ParticipationSectionComponent;
	public statisticsSection: StatisticsSectionComponent;
	public ctaSection: CallToActionSectionComponent;

	constructor(page: Page) {
		super(page);

		// Initialization of components (header already initialized in BasePage)
		this.adminHeader = new AdminHeaderComponent(page);
		this.footer = new FooterComponent(page);
		this.offlineMessage = new OfflineMessageComponent(page);
		this.heroSection = new HeroSectionComponent(page);
		this.participationSection = new ParticipationSectionComponent(page);
		this.statisticsSection = new StatisticsSectionComponent(page);
		this.ctaSection = new CallToActionSectionComponent(page);
	}

	// Selectors for the main page structure
	private get layoutContainer() {
		return this.page.locator('.layout-container');
	}

	private get stickyHeaderContainer() {
		return this.page.locator('#sticky-header-container');
	}

	private get headerWithAdminBar() {
		return this.page.locator('header.with-admin-bar');
	}

	private get menuBarContainer() {
		return this.page.locator('#menu-bar-container');
	}

	private get contentArea() {
		return this.page.locator('#content[data-content]');
	}

	private get mainElement() {
		return this.page.locator('main.home');
	}

	private get homeMenuSection() {
		return this.page.locator('#home__menu');
	}

	// Methods for navigating to the home page
	async navigateToHomePage() {
		await this.navigateToAndHandleCookies();
	}

	async goToHomePage() {
		await this.page.goto('/');
	}

	// Methods to verify the page structure
	async isPageLayoutValid(): Promise<boolean> {
		const layout = await this.layoutContainer.isVisible();
		const content = await this.contentArea.isVisible();
		const main = await this.mainElement.isVisible();

		return layout && content && main;
	}

	async isHeaderSectionVisible(): Promise<boolean> {
		const stickyHeader = await this.stickyHeaderContainer.isVisible();
		const mainBar = await this.header.isMainBarVisible();

		return stickyHeader && mainBar;
	}

	async isAdminHeaderVisible(): Promise<boolean> {
		return await this.adminHeader.isAdminBarVisible();
	}

	async isHeaderWithAdminBarLayout(): Promise<boolean> {
		return await this.headerWithAdminBar.isVisible();
	}

	async isHeaderSectionVisibleForAdmin(): Promise<boolean> {
		const stickyHeader = await this.stickyHeaderContainer.isVisible();
		const adminBar = await this.adminHeader.isAdminBarVisible();
		const mainBar = await this.header.isMainBarVisible();

		return stickyHeader && adminBar && mainBar;
	}

	// Methods for interacting with the admin header
	async navigateToAdminDashboardFromAdminBar() {
		await this.adminHeader.navigateToAdminDashboard();
	}

	async navigateToEditOrganizationFromAdminBar() {
		await this.adminHeader.navigateToEditOrganization();
	}

	async navigateToAdminDashboardFromUserMenu() {
		if (await this.header.isUserLoggedIn()) {
			await this.header.openAccountDropdown();
			await this.page.locator('a[href*="/admin/"]').click();
		}
	}

	async getAdminBarTitle(): Promise<string> {
		return await this.adminHeader.getAdminTitleText();
	}

	async isAdminDashboardButtonVisible(): Promise<boolean> {
		return await this.adminHeader.isAdminDashboardButtonVisible();
	}

	async isEditOrganizationButtonVisible(): Promise<boolean> {
		return await this.adminHeader.isEditOrganizationButtonVisible();
	}

	// Methods for managing flash messages (uses public methods from BasePage)
	async isSuccessFlashMessageVisible(): Promise<boolean> {
		return await this.hasSuccessFlashMessage();
	}

	async getSuccessFlashMessageText(): Promise<string> {
		return await super.getSuccessFlashMessageText();
	}

	async dismissSuccessFlashMessage() {
		await this.dismissFlashMessage();
	}

	async waitForSuccessFlashMessage() {
		await super.waitForSuccessFlashMessage();
	}

	async hasFlashMessagesContainer(): Promise<boolean> {
		// Uses public methods to check for the presence of flash messages
		const hasSuccess = await this.hasSuccessFlashMessage();
		const hasError = await this.hasErrorFlashMessage();
		return hasSuccess || hasError;
	}

	// Methods for interacting with main sections
	async participateInPlatform() {
		await this.heroSection.clickParticipateButton();
	}

	async registerOnPlatform() {
		await this.ctaSection.clickRegisterButton();
	}

	async goToLoginFromHeader() {
		await this.header.goToLoginPage();
	}

	async goToLoginFromFooter() {
		await this.footer.clickLogin();
	}

	async searchInPlatform(searchTerm: string) {
		await this.header.performSearch(searchTerm);
	}

	// Methods to get information from the page
	async getHeroTitle(): Promise<string> {
		return await this.heroSection.getHeroTitle();
	}

	async getParticipationOptions(): Promise<Array<{ title: string; description: string }>> {
		return await this.participationSection.getAllParticipationOptions();
	}

	async getCurrentStatistics(): Promise<Array<{ title: string; value: string }>> {
		return await this.statisticsSection.getAllStatistics();
	}

	async getParticipantsCount(): Promise<number> {
		return await this.statisticsSection.getParticipantsCount();
	}

	// Methods for navigation from sections
	async goToMeetingsFromHeader() {
		await this.header.clickMeetingsLink();
	}

	async goToActivitiesFromHeader() {
		await this.header.clickActivitiesLink();
	}

	async goToHelpFromHeader() {
		await this.header.clickHelpLink();
	}

	async goToMeetingsFromFooter() {
		await this.footer.clickMeetings();
	}

	async goToActivitiesFromFooter() {
		await this.footer.clickActivities();
	}

	async getMoreParticipationInfo() {
		await this.participationSection.clickMoreInfo();
	}

	// Methods for language management
	async changeLanguageFromHeader(languageCode: string) {
		await this.header.selectLanguage(languageCode);
	}

	async changeLanguageFromFooter(languageCode: string) {
		await this.footer.selectLanguage(languageCode);
	}

	async getCurrentLanguage(): Promise<string> {
		return await this.header.getCurrentLanguage();
	}

	// Methods for offline/online management
	async isOfflineMessageDisplayed(): Promise<boolean> {
		return await this.offlineMessage.isOfflineMessageVisible();
	}

	async getOfflineMessage(): Promise<string> {
		return await this.offlineMessage.getOfflineMessageText();
	}

	// Methods to verify responsiveness
	async isResponsiveLayoutWorking(): Promise<boolean> {
		return await this.header.isResponsiveHeaderWorking();
	}

	async isMobileMenuAvailable(): Promise<boolean> {
		return await this.header.isMobileMenuButtonVisible();
	}

	// Methods to wait for full page load
	async waitForPageToFullyLoad() {
		await this.waitForLoadState();
		await this.layoutContainer.waitFor({ state: 'visible' });
		await this.header.waitForHeaderToLoad();
		await this.heroSection.waitForHeroToLoad();
	}

	async waitForPageToFullyLoadForAdmin() {
		await this.waitForLoadState();
		await this.layoutContainer.waitFor({ state: 'visible' });
		await this.header.waitForHeaderToLoad();
		await this.adminHeader.waitForAdminBarToLoad();
		await this.heroSection.waitForHeroToLoad();
	}

	// Methods to verify page completeness
	async isHomePageCompletelyLoaded(): Promise<boolean> {
		const layout = await this.isPageLayoutValid();
		const header = await this.isHeaderSectionVisible();
		const hero = await this.heroSection.isHeroVisible();
		const participation = await this.participationSection.isParticipationSectionVisible();
		const statistics = await this.statisticsSection.isStatisticsSectionVisible();
		const cta = await this.ctaSection.isCTASectionVisible();
		const footer = await this.footer.isFooterCompletelyVisible();

		return layout && header && hero && participation && statistics && cta && footer;
	}

	async isHomePageCompletelyLoadedForAdmin(): Promise<boolean> {
		const layout = await this.isPageLayoutValid();
		const header = await this.isHeaderSectionVisibleForAdmin();
		const hero = await this.heroSection.isHeroVisible();
		const participation = await this.participationSection.isParticipationSectionVisible();
		const statistics = await this.statisticsSection.isStatisticsSectionVisible();
		const cta = await this.ctaSection.isCTASectionVisible();
		const footer = await this.footer.isFooterCompletelyVisible();

		return layout && header && hero && participation && statistics && cta && footer;
	}

	// Methods for scrolling to sections
	async scrollToHero() {
		await this.heroSection.scrollToHero();
	}

	async scrollToParticipation() {
		await this.participationSection.scrollToSection();
	}

	async scrollToStatistics() {
		await this.statisticsSection.scrollToSection();
	}

	async scrollToCTA() {
		await this.ctaSection.scrollToSection();
	}

	async scrollToFooter() {
		await this.footer.scrollToFooter();
	}

	// Utility methods for tests
	async takeFullPageScreenshot(name: string = 'homepage') {
		await this.takeScreenshot(`${name}-${Date.now()}`);
	}

	async isHomeMenuSectionVisible(): Promise<boolean> {
		return await this.homeMenuSection.isVisible();
	}

	async goToProcessesFromHomeMenu() {
		return await this.homeMenuSection.locator('a[href*="/processes"]').click();
	}

	async goToCalendarFromHomeMenu() {
		return await this.homeMenuSection.locator('a[href*="/calendar"]').click();
	}

	// Methods for cookie settings
	async openCookieSettingsFromFooter() {
		await this.footer.clickCookieSettings();
	}

	// Methods for external links
	async goToDecidimWebsite() {
		await this.footer.clickDecidimLogo();
	}

	async goToCreativeCommonsLicense() {
		await this.footer.clickCreativeCommonsLink();
	}

	// Utility methods for admin
	async isCurrentUserAdmin(): Promise<boolean> {
		// Checks if the current user has admin privileges by checking for the admin bar
		return await this.isAdminHeaderVisible();
	}

	async hasAdminPermissions(): Promise<boolean> {
		// Checks if the user has admin permissions by checking both the admin bar and the link in the user menu
		const adminBar = await this.isAdminHeaderVisible();

		if (!adminBar && (await this.header.isUserLoggedIn())) {
			// If there is no admin bar, check if there is an admin link in the user dropdown
			await this.header.openAccountDropdown();
			const adminLink = await this.page.locator('a[href*="/admin/"]').isVisible();
			await this.header.closeAccountDropdown();
			return adminLink;
		}

		return adminBar;
	}

	async navigateToAdminDashboard() {
		// Universal method to navigate to the admin dashboard
		if (await this.isAdminHeaderVisible()) {
			await this.navigateToAdminDashboardFromAdminBar();
		} else {
			await this.navigateToAdminDashboardFromUserMenu();
		}
	}

	// Method to check if the page is in admin mode (with admin bar)
	async isInAdminMode(): Promise<boolean> {
		const hasAdminBar = await this.isAdminHeaderVisible();
		const hasAdminLayout = await this.isHeaderWithAdminBarLayout();

		return hasAdminBar && hasAdminLayout;
	}

	// Method to wait for the success message after login
	async waitForLoginSuccessMessage() {
		await this.waitForSuccessFlashMessage();
	}

	async getLoginSuccessMessage(): Promise<string> {
		return await this.getSuccessFlashMessageText();
	}

	/**
	 * Verify that we are on the home page
	 */
	async expectToBeOnHomePage(): Promise<void> {
		await expect(this.page).toHaveURL(/.*\/(it|en|fr|de|es)?(\?.*)?$/);
		await this.waitForPageToFullyLoad();
	}
	/**
	 * Navigate to Privacy Policy page from current page
	 * Note: The privacy policy is available through the "Terms of Service" link in the footer
	 */
	async navigateToPrivacyPolicy(): Promise<void> {
		// Scroll to footer to ensure the Terms of Service link is visible
		await this.footer.scrollToFooter();

		// Look for the "Terms of Service" link in the footer's legal navigation section
		const termsOfServiceLink = this.page.locator('a[href="/pages/terms-of-service"]');

		try {
			// Wait for the link to be visible and click it
			await termsOfServiceLink.waitFor({ state: 'visible' });
			await termsOfServiceLink.click();
			await this.page.waitForLoadState('networkidle');
		} catch {
			// If link not found, navigate directly to the URL
			await this.page.goto('/pages/terms-of-service');
			await this.page.waitForLoadState('networkidle');
		}
	}
}
