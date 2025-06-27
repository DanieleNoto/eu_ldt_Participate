import { Page } from '@playwright/test';
import { AdminActivityCardComponent } from '../../components/admin/AdminActivityCardComponent';
import { AdminDashboardHeaderComponent } from '../../components/admin/AdminDashboardHeaderComponent';
import { AdminLogsCardComponent } from '../../components/admin/AdminLogsCardComponent';
import { AdminMetricsCardComponent } from '../../components/admin/AdminMetricsCardComponent';
import { BaseAdminPage } from './BaseAdminPage';

/**
 * AdminHomePage - Page Object Model per la dashboard principale dell'area admin.
 *
 * Estende BaseAdminPage e compone tutti i componenti specifici della dashboard:
 * - AdminDashboardHeaderComponent per breadcrumb e titolo
 * - AdminActivityCardComponent per le statistiche di attività
 * - AdminMetricsCardComponent per le metriche di partecipazione
 * - AdminLogsCardComponent per il registro di amministrazione
 *
 * Integra AdminNavigationComponent e AdminTitleBarComponent da BaseAdminPage.
 * Fornisce metodi per navigazione, verifica delle sezioni e gestione dei dati dashboard.
 */
export class AdminHomePage extends BaseAdminPage {
	// Componenti specifici della dashboard
	public dashboardHeader: AdminDashboardHeaderComponent;
	public activityCard: AdminActivityCardComponent;
	public metricsCard: AdminMetricsCardComponent;
	public logsCard: AdminLogsCardComponent;

	constructor(page: Page) {
		super(page);

		// Inizializzazione dei componenti specifici della dashboard
		this.dashboardHeader = new AdminDashboardHeaderComponent(page);
		this.activityCard = new AdminActivityCardComponent(page);
		this.metricsCard = new AdminMetricsCardComponent(page);
		this.logsCard = new AdminLogsCardComponent(page);
	}

	// Selettori per la struttura principale della dashboard
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

	// Metodi di navigazione alla dashboard
	async navigateToAdminHomePage(locale: string = 'en'): Promise<void> {
		await this.navigateTo(`/admin/?locale=${locale}`);
	}

	async goToAdminDashboard(): Promise<void> {
		await this.navigateToAdminHomePage();
	}

	// Metodi per verificare la struttura della pagina
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

	// Metodi per verificare i componenti della dashboard
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

	// Metodi per l'interazione con le card
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

	// Metodi di navigazione tramite dashboard
	async navigateToMetricsDetails(): Promise<void> {
		await this.metricsCard.clickViewDetails();
	}

	async navigateToLogsDetails(): Promise<void> {
		await this.logsCard.clickViewMoreLogs();
	}

	async navigateToAdminTerms(): Promise<void> {
		await this.adminTermsLink.click();
	}

	// Metodi per verificare la presenza di elementi specifici
	async hasAdminTermsLink(): Promise<boolean> {
		return await this.adminTermsLink.isVisible();
	}

	async getAdminTermsLinkText(): Promise<string> {
		return (await this.adminTermsLink.textContent()) || '';
	}

	// Metodi per l'interazione con i log
	async expandLogEntry(index: number): Promise<void> {
		await this.logsCard.expandLogEntry(index);
	}

	async getLogEntryDetails(index: number): Promise<{ date: string; explanation: string; author: string }> {
		return await this.logsCard.getLogEntryByIndex(index);
	}

	// Metodi per verificare lo stato della dashboard
	async isDashboardFullyLoaded(): Promise<boolean> {
		const layoutValid = await this.isPageLayoutValid();
		const adminLayoutLoaded = await this.isAdminLayoutLoaded();
		const headerVisible = await this.isHeaderSectionVisible();
		const cardsLoaded = await this.areAllCardsFullyLoaded();
		const dashboardContentVisible = await this.isDashboardContentVisible();

		return layoutValid && adminLayoutLoaded && headerVisible && cardsLoaded && dashboardContentVisible;
	}

	// Metodi per l'interazione con la breadcrumb
	async navigateToHomeViaBreadcrumb(): Promise<void> {
		await this.dashboardHeader.clickHomeIcon();
	}

	async getDashboardTitle(): Promise<string> {
		return await this.dashboardHeader.getDashboardTitle();
	}

	// Metodi per verificare la presenza di notifiche
	async hasNotifications(): Promise<boolean> {
		return await this.dashboardHeader.hasCalloutNotifications();
	}

	async getNotificationContent(): Promise<string> {
		return await this.dashboardHeader.getCalloutContent();
	}

	// Metodi per verificare lo stato della sessione admin
	async isAdminSessionActive(): Promise<boolean> {
		const isLoggedIn = await this.isLoggedIn();
		const hasAdminPermissions = await this.hasAdminPermissions();
		const dashboardLoaded = await this.isDashboardFullyLoaded();

		return isLoggedIn && hasAdminPermissions && dashboardLoaded;
	}

	// Metodi di utilità per la dashboard
	async waitForDashboardToLoad(timeout: number = 30000): Promise<void> {
		await this.page.waitForLoadState('networkidle');
		await this.waitForElement('.layout-content__container[data-content]', timeout);

		// Attende che tutte le card siano visibili
		await this.activityCard.isActivityCardVisible();
		await this.metricsCard.isMetricsCardVisible();
		await this.logsCard.isLogsCardVisible();
	}

	// Metodi per ottenere informazioni aggregate della dashboard
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

	// Metodi per gestire il locale tramite AdminTitleBarComponent

	/**
	 * Verifica se il dropdown delle lingue è visibile
	 */
	async isLanguageDropdownVisible(): Promise<boolean> {
		await this.adminTitleBar.openLanguageDropdown();
		await this.page.waitForTimeout(500); // Attende che il dropdown si apra
		return await this.adminTitleBar.isLanguageDropdownVisible();
	}

	/**
	 * Ottiene la lingua corrente dal dropdown
	 */
	async getCurrentLanguage(): Promise<string> {
		return await this.adminTitleBar.getCurrentLanguage();
	}

	/**
	 * Verifica se una specifica lingua è disponibile nel dropdown
	 */
	async isLanguageAvailable(languageName: string): Promise<boolean> {
		return await this.adminTitleBar.isLanguageAvailable(languageName);
	}

	/**
	 * Seleziona una lingua specifica dal dropdown
	 */
	async selectLanguage(languageCode: string): Promise<void> {
		await this.adminTitleBar.selectLanguage(languageCode);
	}

	/**
	 * Ottiene tutte le lingue disponibili nel dropdown
	 */
	async getAvailableLanguages(): Promise<string[]> {
		return await this.adminTitleBar.getAvailableLanguages();
	}

	/**
	 * Imposta il locale inglese se disponibile
	 */
	async setEnglishLocale(): Promise<boolean> {
		const currentLanguage = await this.getCurrentLanguage();

		// Verifica se l'inglese è già selezionato
		if (currentLanguage.toLowerCase().includes('en') || currentLanguage.toLowerCase().includes('english')) {
			return true;
		}

		// Verifica se l'inglese è disponibile e lo seleziona
		const isEnglishAvailable = await this.isLanguageAvailable('English');
		if (isEnglishAvailable) {
			await this.selectLanguage('en');
			// Attende che la pagina si ricarichi con il nuovo locale
			await this.page.waitForLoadState('networkidle');
			return true;
		}

		return false;
	}
}
