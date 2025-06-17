import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from '@pages/base/BasePage';
import { LoginPage } from '../pages/auth/LoginPage';
import { HeaderComponent } from '@pages/shared/HeaderComponent';
import { ROUTES } from '@utils/routes';
import { TEST_SELECTORS } from '@utils/constants';
/**
 * Page Object Model for Cookie Settings functionality.
 * Handles cookie banner interactions, preferences management, and verification.
 */
export class CookieSettingsPage extends BasePage {
	// Cookie Banner Elements
	readonly cookieBanner: Locator;
	readonly acceptAllButton: Locator;
	readonly acceptOnlyEssentialButton: Locator;
	readonly rejectAllButton: Locator;
	readonly cookieSettingsButton: Locator;
	readonly settingsButton: Locator;
	// Cookie Settings Dialog Elements
	readonly cookieDialog: Locator;
	readonly modalAcceptButton: Locator;
	readonly modalRejectButton: Locator;
	readonly modalSaveButton: Locator;
	readonly preferencesToggle: Locator;
	readonly analyticsToggle: Locator;
	readonly marketingToggle: Locator;
	readonly saveSettingsButton: Locator;

	// Form Inputs (by ID for more reliable targeting)
	readonly preferencesCheckbox: Locator;
	readonly analyticsCheckbox: Locator;
	readonly marketingCheckbox: Locator;

	// Related Page Objects
	private loginPage: LoginPage;
	private headerComponent: HeaderComponent;

	constructor(page: Page) {
		super(page);

		// Initialize related page objects
		this.loginPage = new LoginPage(page);
		this.headerComponent = new HeaderComponent(page); // Cookie Banner Elements - Using constants for consistency
		this.cookieBanner = this.page.locator(TEST_SELECTORS.COOKIES.BANNER);
		this.acceptAllButton = this.page.locator(TEST_SELECTORS.COOKIES.ACCEPT_ALL_BUTTON);
		this.acceptOnlyEssentialButton = this.page.locator(TEST_SELECTORS.COOKIES.ACCEPT_ESSENTIAL_BUTTON);
		this.rejectAllButton = this.page.locator(TEST_SELECTORS.COOKIES.REJECT_ALL_BUTTON);
		this.cookieSettingsButton = this.page.getByRole('button', { name: 'Cookie settings' }); // Keep as fallback
		this.settingsButton = this.page.locator(TEST_SELECTORS.COOKIES.SETTINGS_BUTTON); // Cookie Settings Dialog
		this.cookieDialog = this.page.locator(TEST_SELECTORS.COOKIES.MODAL);
		this.modalAcceptButton = this.page.locator(TEST_SELECTORS.COOKIES.MODAL_ACCEPT_BUTTON);
		this.modalRejectButton = this.page.locator(TEST_SELECTORS.COOKIES.MODAL_REJECT_BUTTON);
		this.modalSaveButton = this.page.locator(TEST_SELECTORS.COOKIES.MODAL_SAVE_BUTTON);
		this.saveSettingsButton = this.page.locator(TEST_SELECTORS.COOKIES.SAVE_BUTTON);

		// Toggle Labels (using label[for] selectors for reliable clicking)
		this.preferencesToggle = this.page.locator(TEST_SELECTORS.COOKIES.PREFERENCES_TOGGLE);
		this.analyticsToggle = this.page.locator(TEST_SELECTORS.COOKIES.ANALYTICS_TOGGLE);
		this.marketingToggle = this.page.locator(TEST_SELECTORS.COOKIES.MARKETING_TOGGLE);

		// Checkbox inputs (for state verification)
		this.preferencesCheckbox = this.page.locator(TEST_SELECTORS.COOKIES.PREFERENCES_CHECKBOX);
		this.analyticsCheckbox = this.page.locator(TEST_SELECTORS.COOKIES.ANALYTICS_CHECKBOX);
		this.marketingCheckbox = this.page.locator(TEST_SELECTORS.COOKIES.MARKETING_CHECKBOX);
	}
	/**
	 * Navigation Methods
	 */
	async navigateToHomePage(): Promise<void> {
		await this.navigateTo(ROUTES.homePage.pattern);
		await this.waitForLoadState();
	}

	async navigateToSignIn(): Promise<void> {
		await this.navigateTo(ROUTES.loginPage.pattern);
		await this.waitForLoadState();
	}
	/**
	 * Authentication Methods (delegated to LoginPage and HeaderComponent)
	 */
	async goToLoginPage(): Promise<void> {
		await this.headerComponent.goToLoginPage();
	}

	async navigateToLoginPage(): Promise<void> {
		await this.loginPage.goToThisPage();
	}

	async loginAsAdmin(email?: string, password?: string): Promise<void> {
		if (email && password) {
			await this.loginPage.login(email, password);
		} else {
			await this.loginPage.loginAsAdmin();
		}
		await this.waitForLoadState();
	}

	async loginAsUser(email?: string, password?: string): Promise<void> {
		if (email && password) {
			await this.loginPage.login(email, password);
		} else {
			await this.loginPage.loginAsUser();
		}
		await this.waitForLoadState();
	}

	async fillLoginForm(email: string, password: string): Promise<void> {
		await this.loginPage.fillForm(email, password);
	}

	async submitLogin(): Promise<void> {
		await this.loginPage.clickLoginButton();
		await this.waitForLoadState();
	}

	async isUserAlreadySignedIn(): Promise<boolean> {
		return await this.loginPage.checkUserAlreadySignIn();
	}

	async isAdminAlreadySignedIn(): Promise<boolean> {
		return await this.loginPage.checkAdminAlreadySignIn();
	} /**
	 * Cookie Banner Interaction Methods
	 */
	async acceptCookies(): Promise<void> {
		await this.acceptAllButton.click();
		await this.waitForLoadState();
	}

	async acceptAllCookies(): Promise<void> {
		await this.acceptAllButton.click();
		await this.waitForLoadState();
	}

	async acceptOnlyEssential(): Promise<void> {
		await this.acceptOnlyEssentialButton.click();
		await this.waitForLoadState();
	}

	async rejectAllCookies(): Promise<void> {
		await this.rejectAllButton.click();
		await this.waitForLoadState();
	}

	/**
	 * Cookie Settings Dialog Methods
	 */ async openCookieSettings(): Promise<void> {
		// Use the Settings button from the cookie banner
		if (await this.settingsButton.isVisible({ timeout: 2000 }).catch(() => false)) {
			await this.settingsButton.click();
		} else if (await this.cookieSettingsButton.isVisible({ timeout: 2000 }).catch(() => false)) {
			await this.cookieSettingsButton.click();
		} else {
			throw new Error('Neither Settings nor Cookie settings button is visible');
		}
		await this.waitForCookieSettingsToLoad();
	}

	async togglePreferences(): Promise<void> {
		await this.preferencesToggle.click();
	}

	async toggleAnalytics(): Promise<void> {
		await this.analyticsToggle.click();
	}

	async toggleMarketing(): Promise<void> {
		await this.marketingToggle.click();
	}
	async saveSettings(): Promise<void> {
		await this.modalSaveButton.click();
		await this.waitForLoadState();
	}

	/**
	 * Modal-specific Actions
	 */
	async acceptAllInModal(): Promise<void> {
		await this.modalAcceptButton.click();
		await this.waitForLoadState();
	}

	async rejectAllInModal(): Promise<void> {
		await this.modalRejectButton.click();
		await this.waitForLoadState();
	}

	async saveSettingsInModal(): Promise<void> {
		await this.modalSaveButton.click();
		await this.waitForLoadState();
	}
	async waitForCookieSettingsToLoad(): Promise<void> {
		await this.page.waitForSelector(TEST_SELECTORS.COOKIES.MODAL, { timeout: 10000 });
		await this.waitForLoadState('networkidle');
	}
	/**
	 * Cookie Preferences Management
	 */
	async getCookiePreferences(): Promise<any> {
		const cookies = await this.page.context().cookies();

		let preferenceCookie = cookies.find(cookie => cookie.name === 'decidim-consent');

		if (!preferenceCookie) {
			preferenceCookie = cookies.find(
				cookie =>
					cookie.name === 'cookie_preferences' ||
					cookie.name === 'decidim_cookie_preferences' ||
					cookie.name === 'cookie_consent' ||
					cookie.name === 'cookieConsent'
			);
		}

		if (!preferenceCookie) {
			preferenceCookie = cookies.find(
				cookie =>
					cookie.name.toLowerCase().includes('cookie') ||
					cookie.name.toLowerCase().includes('consent') ||
					cookie.name.toLowerCase().includes('preference')
			);
		}

		if (preferenceCookie) {
			try {
				let decodedValue = preferenceCookie.value;

				if (decodedValue.includes('%')) {
					decodedValue = decodeURIComponent(decodedValue);
				}

				const parsed = JSON.parse(decodedValue);
				console.log('Cookie preferences found in', preferenceCookie.name, ':', parsed);
				return parsed;
			} catch (error) {
				console.log('Error parsing cookie value:', preferenceCookie.value, error);
				return null;
			}
		}

		console.log(
			'No cookie preferences found. Available cookies:',
			cookies.map(c => c.name)
		);
		return null;
	}

	async setCookiePreferences(preferences: {
		essential?: boolean;
		preferences?: boolean;
		analytics?: boolean;
		marketing?: boolean;
	}): Promise<void> {
		const cookieData = {
			essential: preferences.essential ?? true,
			preferences: preferences.preferences ?? true,
			analytics: preferences.analytics ?? true,
			marketing: preferences.marketing ?? true
		};

		const cookieValue = encodeURIComponent(JSON.stringify(cookieData));

		await this.page.context().addCookies([
			{
				name: 'decidim-consent',
				value: cookieValue,
				domain: 'localhost',
				path: '/'
			}
		]);
	}

	async verifyCookiePreferences(expectedPreferences: {
		essential?: boolean;
		preferences?: boolean;
		analytics?: boolean;
		marketing?: boolean;
	}): Promise<void> {
		const cookiePrefs = await this.getCookiePreferences();
		expect(cookiePrefs).toBeTruthy();

		if (expectedPreferences.essential !== undefined) {
			expect(cookiePrefs.essential).toBe(expectedPreferences.essential);
		}
		if (expectedPreferences.preferences !== undefined) {
			const actualValue = cookiePrefs.preferences === true;
			expect(actualValue).toBe(expectedPreferences.preferences);
		}
		if (expectedPreferences.analytics !== undefined) {
			const actualValue = cookiePrefs.analytics === true;
			expect(actualValue).toBe(expectedPreferences.analytics);
		}
		if (expectedPreferences.marketing !== undefined) {
			const actualValue = cookiePrefs.marketing === true;
			expect(actualValue).toBe(expectedPreferences.marketing);
		}
	}

	/**
	 * Toggle State Verification Methods
	 */
	async verifyPreferencesToggleState(isEnabled: boolean): Promise<void> {
		if (isEnabled) {
			await expect(this.preferencesCheckbox).toBeChecked();
		} else {
			await expect(this.preferencesCheckbox).not.toBeChecked();
		}
	}

	async verifyAnalyticsToggleState(isEnabled: boolean): Promise<void> {
		if (isEnabled) {
			await expect(this.analyticsCheckbox).toBeChecked();
		} else {
			await expect(this.analyticsCheckbox).not.toBeChecked();
		}
	}

	async verifyMarketingToggleState(isEnabled: boolean): Promise<void> {
		if (isEnabled) {
			await expect(this.marketingCheckbox).toBeChecked();
		} else {
			await expect(this.marketingCheckbox).not.toBeChecked();
		}
	} /**
	 * Dialog and Banner Verification Methods
	 */
	async verifyCookieSettingsDialogVisible(): Promise<void> {
		await expect(this.cookieDialog).toBeVisible();
		await expect(this.modalSaveButton).toBeVisible();
	}

	async verifyCookieSettingsDialogHidden(): Promise<void> {
		await expect(this.cookieDialog).not.toBeVisible();
	}

	async verifyModalButtonsVisible(): Promise<void> {
		await expect(this.modalAcceptButton).toBeVisible();
		await expect(this.modalRejectButton).toBeVisible();
		await expect(this.modalSaveButton).toBeVisible();
	}

	async verifyCookieBannerPresent(): Promise<void> {
		await expect(this.cookieBanner).toBeVisible();
	}

	async verifyCookieBannerHidden(): Promise<void> {
		await expect(this.cookieBanner).not.toBeVisible();
	}

	async verifyCookieConsentDialogPresent(): Promise<void> {
		await expect(this.acceptAllButton).toBeVisible();
		await expect(this.acceptOnlyEssentialButton).toBeVisible();
		await expect(this.settingsButton).toBeVisible();
	}
}
