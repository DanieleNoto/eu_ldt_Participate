import { BasePage } from '@pages/base/BasePage';
import { Page } from '@playwright/test';
import { AdminHeaderComponent } from '../../components/admin/AdminHeaderComponent';
import { FooterComponent } from '../../components/common/FooterComponent';
import { OfflineMessageComponent } from '../../components/common/OfflineMessageComponent';
import { CallToActionSectionComponent } from '../../components/home/CallToActionSectionComponent';
import { HeroSectionComponent } from '../../components/home/HeroSectionComponent';
import { ParticipationSectionComponent } from '../../components/home/ParticipationSectionComponent';
import { StatisticsSectionComponent } from '../../components/home/StatisticsSectionComponent';

/**
 * HomePage - Page Object Model per la pagina principale del sito.
 *
 * Estende BasePage e compone tutti i componenti necessari per la homepage:
 * - AdminHeaderComponent per la barra admin (quando visibile)
 * - Footer, OfflineMessage e sezioni della homepage
 * - Integra HeaderComponent e CookieBarComponent da BasePage
 *
 * Supporta sia utenti anonimi che autenticati, inclusi admin.
 * Fornisce metodi per navigazione, verifica delle sezioni e gestione
 * dei messaggi flash utilizzando l'API pubblica di BasePage.
 */
export class HomePage extends BasePage {
	// Componenti della pagina (header è ereditato da BasePage)
	public adminHeader: AdminHeaderComponent;
	public footer: FooterComponent;
	public offlineMessage: OfflineMessageComponent;
	public heroSection: HeroSectionComponent;
	public participationSection: ParticipationSectionComponent;
	public statisticsSection: StatisticsSectionComponent;
	public ctaSection: CallToActionSectionComponent;

	constructor(page: Page) {
		super(page);

		// Inizializzazione dei componenti (header già inizializzato in BasePage)
		this.adminHeader = new AdminHeaderComponent(page);
		this.footer = new FooterComponent(page);
		this.offlineMessage = new OfflineMessageComponent(page);
		this.heroSection = new HeroSectionComponent(page);
		this.participationSection = new ParticipationSectionComponent(page);
		this.statisticsSection = new StatisticsSectionComponent(page);
		this.ctaSection = new CallToActionSectionComponent(page);
	}

	// Selettori per la struttura principale della pagina
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

	// Metodi per la navigazione alla home page
	async navigateToHomePage(locale: string = 'it') {
		await this.navigateToAndHandleCookies(`/?locale=${locale}`);
	}

	async goToHomePage() {
		await this.page.goto('/');
	}

	// Metodi per verificare la struttura della pagina
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

	// Metodi per l'interazione con l'admin header
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

	// Metodi per gestire i flash messages (utilizza i metodi pubblici di BasePage)
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
		// Utilizza i metodi pubblici per verificare la presenza di flash messages
		const hasSuccess = await this.hasSuccessFlashMessage();
		const hasError = await this.hasErrorFlashMessage();
		return hasSuccess || hasError;
	}

	// Metodi per l'interazione con le sezioni principali
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

	// Metodi per ottenere informazioni dalla pagina
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

	// Metodi per la navigazione dalle sezioni
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

	// Metodi per la gestione della lingua
	async changeLanguageFromHeader(languageCode: string) {
		await this.header.selectLanguage(languageCode);
	}

	async changeLanguageFromFooter(languageCode: string) {
		await this.footer.selectLanguage(languageCode);
	}

	async getCurrentLanguage(): Promise<string> {
		return await this.header.getCurrentLanguage();
	}

	// Metodi per la gestione offline/online
	async isOfflineMessageDisplayed(): Promise<boolean> {
		return await this.offlineMessage.isOfflineMessageVisible();
	}

	async getOfflineMessage(): Promise<string> {
		return await this.offlineMessage.getOfflineMessageText();
	}

	// Metodi per la verifica della responsività
	async isResponsiveLayoutWorking(): Promise<boolean> {
		return await this.header.isResponsiveHeaderWorking();
	}

	async isMobileMenuAvailable(): Promise<boolean> {
		return await this.header.isMobileMenuButtonVisible();
	}

	// Metodi per attendere il caricamento completo
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

	// Metodi per la verifica della completezza della pagina
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

	// Metodi per lo scrolling alle sezioni
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

	// Metodi di utilità per i test
	async takeFullPageScreenshot(name: string = 'homepage') {
		await this.takeScreenshot(`${name}-${Date.now()}`);
	}

	async isHomeMenuSectionVisible(): Promise<boolean> {
		return await this.homeMenuSection.isVisible();
	}

	// Metodi per i cookie settings
	async openCookieSettingsFromFooter() {
		await this.footer.clickCookieSettings();
	}

	// Metodi per link esterni
	async goToDecidimWebsite() {
		await this.footer.clickDecidimLogo();
	}

	async goToCreativeCommonsLicense() {
		await this.footer.clickCreativeCommonsLink();
	}

	// Metodi di utilità per admin
	async isCurrentUserAdmin(): Promise<boolean> {
		// Verifica se l'utente corrente ha privilegi di admin controllando la presenza dell'admin bar
		return await this.isAdminHeaderVisible();
	}

	async hasAdminPermissions(): Promise<boolean> {
		// Verifica se l'utente ha permessi admin controllando sia l'admin bar che il link nel menu utente
		const adminBar = await this.isAdminHeaderVisible();

		if (!adminBar && (await this.header.isUserLoggedIn())) {
			// Se non c'è l'admin bar, controlla se c'è il link admin nel dropdown utente
			await this.header.openAccountDropdown();
			const adminLink = await this.page.locator('a[href*="/admin/"]').isVisible();
			await this.header.closeAccountDropdown();
			return adminLink;
		}

		return adminBar;
	}

	async navigateToAdminDashboard() {
		// Metodo universale per navigare alla dashboard admin
		if (await this.isAdminHeaderVisible()) {
			await this.navigateToAdminDashboardFromAdminBar();
		} else {
			await this.navigateToAdminDashboardFromUserMenu();
		}
	}

	// Metodo per verificare se la pagina è in modalità admin (con admin bar)
	async isInAdminMode(): Promise<boolean> {
		const hasAdminBar = await this.isAdminHeaderVisible();
		const hasAdminLayout = await this.isHeaderWithAdminBarLayout();

		return hasAdminBar && hasAdminLayout;
	}

	// Metodo per aspettare il messaggio di successo dopo il login
	async waitForLoginSuccessMessage() {
		await this.waitForSuccessFlashMessage();
	}

	async getLoginSuccessMessage(): Promise<string> {
		return await this.getSuccessFlashMessageText();
	}
}
