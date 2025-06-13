import { Page } from '@playwright/test';

/**
 * Component for the main header functionality.
 * Handles logo, navigation, user authentication, and language selection.
 */
export class HeaderComponent {
	constructor(private page: Page) {}

	// Selettori per la struttura principale
	private get mainBar() {
		return this.page.locator('#main-bar');
	}

	private get mainBarContainer() {
		return this.page.locator('.main-bar__container');
	}

	// Selettori per il logo
	private get logoDesktop() {
		return this.page.locator('.main-bar__logo-desktop a');
	}

	private get logoMobile() {
		return this.page.locator('.main-bar__logo-mobile a');
	}

	// Selettori per la ricerca
	private get searchForm() {
		return this.page.locator('#form-search_topbar');
	}

	private get searchInput() {
		return this.page.locator('#input-search');
	}

	private get searchButton() {
		return this.page.locator('#form-search_topbar button[type="submit"]');
	}

	private get searchFormMobile() {
		return this.page.locator('#form-search-mobile');
	}

	private get searchInputMobile() {
		return this.page.locator('#input-search-mobile');
	}

	// Selettori per i link desktop
	private get helpLink() {
		return this.page.locator('.main-bar__links-desktop__item[aria-label="Aiuto"]');
	}

	private get meetingsLink() {
		return this.page.locator('.main-bar__links-desktop__item[aria-label="Incontri"]');
	}

	private get activitiesLink() {
		return this.page.locator('.main-bar__links-desktop__item[aria-label="Attività"]');
	}

	private get loginLink() {
		return this.page.locator('.main-bar__links-desktop__item[aria-label="Accedi"]');
	}

	// Selettori per l'utente loggato (desktop)
	private get accountDropdownContainer() {
		return this.page.locator('.main-bar__dropdown-container');
	}

	private get accountDropdownTrigger() {
		return this.page.locator('#trigger-dropdown-account');
	}

	private get accountDropdownMenu() {
		return this.page.locator('#dropdown-menu-account');
	}

	private get userInitials() {
		return this.page.locator('.main-bar__links-desktop__item-account');
	}

	private get notificationBadge() {
		return this.page.locator('.main-bar__notification[data-unread-notifications="true"]');
	}

	// Selettori per i link del dropdown account (desktop)
	private get myAccountLink() {
		return this.page.locator('a[href*="/account"]');
	}

	private get myProfileLink() {
		return this.page.locator('a[href*="/profiles/"]');
	}

	private get notificationsLink() {
		return this.page.locator('a[href*="/notifications"]');
	}

	private get conversationsLink() {
		return this.page.locator('a[href*="/conversations"]');
	}

	private get logoutLink() {
		return this.page.locator('a[href*="/users/sign_out"]');
	}

	// Selettori per l'utente loggato (mobile)
	private get mobileAccountButton() {
		return this.page.locator('#dropdown-trigger-links-mobile');
	}

	private get mobileAccountDropdown() {
		return this.page.locator('#dropdown-menu-account-mobile');
	}

	private get mobileUserInitials() {
		return this.page.locator('.main-bar__avatar-name');
	}

	private get mobileUserGreeting() {
		return this.page.locator('.account-container .h3');
	}

	// Selettori per il menu mobile
	private get mobileMenuButton() {
		return this.page.locator('#main-dropdown-summary-mobile');
	}

	private get mobileMenuDropdown() {
		return this.page.locator('#dropdown-menu-main-mobile');
	}

	private get mobileLoginLink() {
		return this.page.locator('.main-bar__links-mobile__login');
	}

	// Selettori per il language chooser mobile
	private get languageChooserButton() {
		return this.page.locator('#dropdown-trigger-language-chooser-mobile');
	}

	private get languageChooserDropdown() {
		return this.page.locator('#dropdown-menu-language-chooser-mobile');
	}

	// Metodi per verificare la visibilità degli elementi
	async isMainBarVisible(): Promise<boolean> {
		return await this.mainBar.isVisible();
	}

	async isLogoVisible(): Promise<boolean> {
		const desktop = await this.logoDesktop.isVisible();
		const mobile = await this.logoMobile.isVisible();
		return desktop || mobile;
	}

	async isSearchFormVisible(): Promise<boolean> {
		return await this.searchForm.isVisible();
	}

	// Metodi per la navigazione tramite logo
	async clickLogo() {
		if (await this.logoDesktop.isVisible()) {
			await this.logoDesktop.click();
		} else if (await this.logoMobile.isVisible()) {
			await this.logoMobile.click();
		}
	}

	async getLogoText(): Promise<string> {
		if (await this.logoDesktop.isVisible()) {
			return (await this.logoDesktop.locator('span').textContent()) || '';
		} else if (await this.logoMobile.isVisible()) {
			return (await this.logoMobile.locator('span').textContent()) || '';
		}
		return '';
	}

	// Metodi per la ricerca
	async performSearch(term: string) {
		if (await this.searchInput.isVisible()) {
			await this.searchInput.fill(term);
			await this.searchButton.click();
		} else if (await this.searchInputMobile.isVisible()) {
			await this.searchInputMobile.fill(term);
			await this.searchFormMobile.locator('button[type="submit"]').click();
		}
	}

	async isSearchInputVisible(): Promise<boolean> {
		const desktop = await this.searchInput.isVisible();
		const mobile = await this.searchInputMobile.isVisible();
		return desktop || mobile;
	}

	// Metodi per i link desktop
	async clickHelpLink() {
		await this.helpLink.click();
	}

	async clickMeetingsLink() {
		await this.meetingsLink.click();
	}

	async clickActivitiesLink() {
		await this.activitiesLink.click();
	}

	async goToLoginPage() {
		if (await this.loginLink.isVisible()) {
			await this.loginLink.click();
		} else if (await this.mobileLoginLink.isVisible()) {
			await this.mobileLoginLink.click();
		}
		await this.page.waitForLoadState('networkidle');
	}

	// Metodi per verificare lo stato di login
	async isUserLoggedIn(): Promise<boolean> {
		const desktopAccount = await this.accountDropdownTrigger.isVisible();
		const mobileAccount = await this.mobileAccountButton.isVisible();
		return desktopAccount || mobileAccount;
	}

	async isUserLoggedOut(): Promise<boolean> {
		const desktopLogin = await this.loginLink.isVisible();
		const mobileLogin = await this.mobileLoginLink.isVisible();
		return desktopLogin || mobileLogin;
	}

	// Metodi per l'account dropdown (desktop)
	async openAccountDropdown() {
		await this.accountDropdownTrigger.click();
	}

	async closeAccountDropdown() {
		if (await this.accountDropdownMenu.isVisible()) {
			await this.page.keyboard.press('Escape');
		}
	}

	async isAccountDropdownOpen(): Promise<boolean> {
		return await this.accountDropdownMenu.isVisible();
	}

	async getUserInitials(): Promise<string> {
		if (await this.userInitials.isVisible()) {
			return (await this.userInitials.textContent()) || '';
		} else if (await this.mobileUserInitials.isVisible()) {
			return (await this.mobileUserInitials.textContent()) || '';
		}
		return '';
	}

	async hasUnreadNotifications(): Promise<boolean> {
		return await this.notificationBadge.isVisible();
	}

	// Metodi per la navigazione dell'account (desktop)
	async goToMyAccount() {
		await this.openAccountDropdown();
		await this.myAccountLink.click();
	}

	async goToMyProfile() {
		await this.openAccountDropdown();
		await this.myProfileLink.click();
	}

	async goToNotifications() {
		await this.openAccountDropdown();
		await this.notificationsLink.click();
	}

	async goToConversations() {
		await this.openAccountDropdown();
		await this.conversationsLink.click();
	}

	async logout() {
		if (await this.isUserLoggedIn()) {
			await this.openAccountDropdown();
			await this.logoutLink.click();
		}
	}

	// Metodi per l'account mobile
	async openMobileAccountMenu() {
		await this.mobileAccountButton.click();
	}

	async closeMobileAccountMenu() {
		if (await this.mobileAccountDropdown.isVisible()) {
			await this.page.locator('.main-bar__links-mobile__trigger').click();
		}
	}

	async isMobileAccountMenuOpen(): Promise<boolean> {
		return await this.mobileAccountDropdown.isVisible();
	}

	async getMobileUserGreeting(): Promise<string> {
		return (await this.mobileUserGreeting.textContent()) || '';
	}

	// Metodi per la navigazione dell'account (mobile)
	async goToMyAccountMobile() {
		await this.openMobileAccountMenu();
		await this.page.locator('#dropdown-menu-account-mobile a[href*="/account"]').click();
	}

	async goToMyProfileMobile() {
		await this.openMobileAccountMenu();
		await this.page.locator('#dropdown-menu-account-mobile a[href*="/profiles/"]').click();
	}

	async goToNotificationsMobile() {
		await this.openMobileAccountMenu();
		await this.page.locator('#dropdown-menu-account-mobile a[href*="/notifications"]').click();
	}

	async goToConversationsMobile() {
		await this.openMobileAccountMenu();
		await this.page.locator('#dropdown-menu-account-mobile a[href*="/conversations"]').click();
	}

	async logoutMobile() {
		await this.openMobileAccountMenu();
		await this.page.locator('#dropdown-menu-account-mobile a[href*="/users/sign_out"]').click();
	}

	// Metodi universali che funzionano sia per desktop che mobile
	async navigateToMyAccount() {
		if (await this.accountDropdownTrigger.isVisible()) {
			await this.goToMyAccount();
		} else if (await this.mobileAccountButton.isVisible()) {
			await this.goToMyAccountMobile();
		}
	}

	async navigateToMyProfile() {
		if (await this.accountDropdownTrigger.isVisible()) {
			await this.goToMyProfile();
		} else if (await this.mobileAccountButton.isVisible()) {
			await this.goToMyProfileMobile();
		}
	}

	async navigateToNotifications() {
		if (await this.accountDropdownTrigger.isVisible()) {
			await this.goToNotifications();
		} else if (await this.mobileAccountButton.isVisible()) {
			await this.goToNotificationsMobile();
		}
	}

	async navigateToConversations() {
		if (await this.accountDropdownTrigger.isVisible()) {
			await this.goToConversations();
		} else if (await this.mobileAccountButton.isVisible()) {
			await this.goToConversationsMobile();
		}
	}

	async performLogout() {
		if (await this.accountDropdownTrigger.isVisible()) {
			await this.logout();
		} else if (await this.mobileAccountButton.isVisible()) {
			await this.logoutMobile();
		}
		await this.page.waitForLoadState('networkidle');
	}

	// Metodi per verificare la visibilità dei link desktop
	async areDesktopLinksVisible(): Promise<boolean> {
		const help = await this.helpLink.isVisible();
		const meetings = await this.meetingsLink.isVisible();
		const activities = await this.activitiesLink.isVisible();

		// Verifica se è presente il link di login (utente non loggato) o l'account dropdown (utente loggato)
		const authElement = (await this.loginLink.isVisible()) || (await this.accountDropdownTrigger.isVisible());

		return help && meetings && activities && authElement;
	}

	async areDesktopLinksVisibleForLoggedInUser(): Promise<boolean> {
		const help = await this.helpLink.isVisible();
		const meetings = await this.meetingsLink.isVisible();
		const activities = await this.activitiesLink.isVisible();
		const accountDropdown = await this.accountDropdownTrigger.isVisible();

		return help && meetings && activities && accountDropdown;
	}

	async areDesktopLinksVisibleForLoggedOutUser(): Promise<boolean> {
		const help = await this.helpLink.isVisible();
		const meetings = await this.meetingsLink.isVisible();
		const activities = await this.activitiesLink.isVisible();
		const login = await this.loginLink.isVisible();

		return help && meetings && activities && login;
	}

	// Metodi per il menu mobile
	async openMobileMenu() {
		await this.mobileMenuButton.click();
	}

	async closeMobileMenu() {
		if (await this.mobileMenuDropdown.isVisible()) {
			await this.mobileMenuButton.click();
		}
	}

	async isMobileMenuOpen(): Promise<boolean> {
		return await this.mobileMenuDropdown.isVisible();
	}

	async isMobileMenuButtonVisible(): Promise<boolean> {
		return await this.mobileMenuButton.isVisible();
	}

	// Metodi per il language chooser
	async openLanguageChooser() {
		await this.languageChooserButton.click();
	}

	async selectLanguage(languageCode: string) {
		await this.openLanguageChooser();
		await this.page.locator(`a[href="/locale?locale=${languageCode}"]`).click();
	}

	async getCurrentLanguage(): Promise<string> {
		return (await this.languageChooserButton.locator('span').first().textContent()) || '';
	}

	async isLanguageChooserVisible(): Promise<boolean> {
		return await this.languageChooserButton.isVisible();
	}

	// Metodi di utilità
	async waitForHeaderToLoad() {
		await this.mainBar.waitFor({ state: 'visible' });
	}

	async isResponsiveHeaderWorking(): Promise<boolean> {
		// Verifica se il comportamento responsive funziona correttamente
		const desktopLinks = await this.page.locator('.main-bar__links-desktop').isVisible();
		const mobileMenu = await this.mobileMenuButton.isVisible();

		// Almeno uno dei due dovrebbe essere visibile
		return desktopLinks || mobileMenu;
	}

	// Metodo per ottenere tutti i link del menu mobile
	async getMobileMenuLinks(): Promise<string[]> {
		await this.openMobileMenu();
		const links = await this.page.locator('.menu-bar__main-dropdown__menu li a span').allTextContents();
		await this.closeMobileMenu();
		return links;
	}

	// Metodi di utilità per l'account management
	async getAccountMenuItems(): Promise<string[]> {
		if (await this.accountDropdownTrigger.isVisible()) {
			await this.openAccountDropdown();
			const items = await this.accountDropdownMenu.locator('.dropdown__item span').allTextContents();
			await this.closeAccountDropdown();
			return items;
		} else if (await this.mobileAccountButton.isVisible()) {
			await this.openMobileAccountMenu();
			const items = await this.mobileAccountDropdown.locator('.dropdown__item span').allTextContents();
			await this.closeMobileAccountMenu();
			return items;
		}
		return [];
	}

	async waitForUserLogin() {
		await this.accountDropdownTrigger.waitFor({ state: 'visible', timeout: 10000 });
	}

	async waitForUserLogout() {
		await this.loginLink.waitFor({ state: 'visible', timeout: 10000 });
	}

	// Metodo per verificare se l'header è completamente caricato per un utente loggato
	async isHeaderLoadedForLoggedInUser(): Promise<boolean> {
		const mainBar = await this.isMainBarVisible();
		const logo = await this.isLogoVisible();
		const search = await this.isSearchFormVisible();
		const account = await this.accountDropdownTrigger.isVisible();

		return mainBar && logo && search && account;
	}

	// Metodo per verificare se l'header è completamente caricato per un utente non loggato
	async isHeaderLoadedForLoggedOutUser(): Promise<boolean> {
		const mainBar = await this.isMainBarVisible();
		const logo = await this.isLogoVisible();
		const search = await this.isSearchFormVisible();
		const login = await this.loginLink.isVisible();

		return mainBar && logo && search && login;
	}
}
