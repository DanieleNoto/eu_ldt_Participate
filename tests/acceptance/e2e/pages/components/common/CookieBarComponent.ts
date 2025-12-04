/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Gianfranco Cedro
 * Denis Vasilev Dimchev
 */

import { Page, expect } from '@playwright/test';
import { TEST_SELECTORS } from '@utils/constants';
import { ROUTES } from '@utils/routes';

export class CookieBarComponent {
	constructor(private page: Page) {}

	// Selectors for Cookie Bar Elements
	private get cookieBar() {
		return this.page.locator('.cookies');
	}

	private get cookieTitle() {
		return this.page.locator('.cookies__left .h5');
	}

	private get cookieDescription() {
		return this.page.locator('.cookies__left p');
	}

	private get acceptAllButton() {
		return this.page.locator('#dc-dialog-accept');
	}

	private get acceptEssentialButton() {
		return this.page.locator('#dc-dialog-reject');
	}

	private get settingsButton() {
		return this.page.locator('#dc-dialog-settings');
	}

	// Cookie Settings Dialog Elements
	private get cookieDialog() {
		return this.page.locator(TEST_SELECTORS.COOKIES.MODAL);
	}

	private get modalAcceptButton() {
		return this.page.locator(TEST_SELECTORS.COOKIES.MODAL_ACCEPT_BUTTON);
	}

	private get modalRejectButton() {
		return this.page.locator(TEST_SELECTORS.COOKIES.MODAL_REJECT_BUTTON);
	}

	private get modalSaveButton() {
		return this.page.locator(TEST_SELECTORS.COOKIES.MODAL_SAVE_BUTTON);
	}

	// Toggle Labels (using label[for] selectors for reliable clicking)
	private get preferencesToggle() {
		return this.page.locator(TEST_SELECTORS.COOKIES.PREFERENCES_TOGGLE);
	}

	private get analyticsToggle() {
		return this.page.locator(TEST_SELECTORS.COOKIES.ANALYTICS_TOGGLE);
	}

	private get marketingToggle() {
		return this.page.locator(TEST_SELECTORS.COOKIES.MARKETING_TOGGLE);
	}

	// Checkbox inputs (for state verification)
	private get preferencesCheckbox() {
		return this.page.locator(TEST_SELECTORS.COOKIES.PREFERENCES_CHECKBOX);
	}

	private get analyticsCheckbox() {
		return this.page.locator(TEST_SELECTORS.COOKIES.ANALYTICS_CHECKBOX);
	}

	private get marketingCheckbox() {
		return this.page.locator(TEST_SELECTORS.COOKIES.MARKETING_CHECKBOX);
	}

	// Visibility and State Check Methods
	async isCookieBarVisible(): Promise<boolean> {
		return await this.cookieBar.isVisible();
	}

	async isCookieTitleVisible(): Promise<boolean> {
		return await this.cookieTitle.isVisible();
	}

	async isCookieDescriptionVisible(): Promise<boolean> {
		return await this.cookieDescription.isVisible();
	}

	async areAllButtonsVisible(): Promise<boolean> {
		const acceptAll = await this.acceptAllButton.isVisible();
		const acceptEssential = await this.acceptEssentialButton.isVisible();
		const settings = await this.settingsButton.isVisible();
		return acceptAll && acceptEssential && settings;
	}

	// Get the text of elements
	async getCookieTitleText(): Promise<string> {
		return (await this.cookieTitle.textContent()) || '';
	}

	async getCookieDescriptionText(): Promise<string> {
		return (await this.cookieDescription.textContent()) || '';
	}

	async getAcceptAllButtonText(): Promise<string> {
		return (await this.acceptAllButton.textContent()) || '';
	}

	async getAcceptEssentialButtonText(): Promise<string> {
		return (await this.acceptEssentialButton.textContent()) || '';
	}

	async getSettingsButtonText(): Promise<string> {
		return (await this.settingsButton.textContent()) || '';
	}

	// Actions on Cookie Bar Buttons
	async clickAcceptAll() {
		await this.acceptAllButton.click();
	}

	async clickAcceptEssential() {
		await this.acceptEssentialButton.click();
	}

	async clickSettings() {
		await this.settingsButton.click();
	}

	// Methods to check the state of the buttons
	async isAcceptAllButtonEnabled(): Promise<boolean> {
		return await this.acceptAllButton.isEnabled();
	}

	async isAcceptEssentialButtonEnabled(): Promise<boolean> {
		return await this.acceptEssentialButton.isEnabled();
	}

	async isSettingsButtonEnabled(): Promise<boolean> {
		return await this.settingsButton.isEnabled();
	}

	// Methods to check specific attributes
	async hasSettingsButtonDialogAttribute(): Promise<boolean> {
		const ariaHasPopup = await this.settingsButton.getAttribute('aria-haspopup');
		const dataDialogOpen = await this.settingsButton.getAttribute('data-dialog-open');
		return ariaHasPopup === 'dialog' && dataDialogOpen === 'dc-modal';
	}

	// Utility methods
	async waitForCookieBarToLoad() {
		await this.cookieBar.waitFor({ state: 'visible' });
	}

	async waitForCookieBarToDisappear() {
		await this.cookieBar.waitFor({ state: 'hidden' });
	}

	// Method to check that the cookie bar is fully loaded
	async isCookieBarFullyLoaded(): Promise<boolean> {
		const barVisible = await this.isCookieBarVisible();
		const titleVisible = await this.isCookieTitleVisible();
		const descriptionVisible = await this.isCookieDescriptionVisible();
		const buttonsVisible = await this.areAllButtonsVisible();

		return barVisible && titleVisible && descriptionVisible && buttonsVisible;
	}

	// Method to accept all cookies and wait for the bar to disappear
	async acceptAllAndWait() {
		await this.clickAcceptAll();
		await this.waitForCookieBarToDisappear();
	}

	// Accept essential cookies and wait for the bar to disappear
	async acceptEssentialAndWait() {
		await this.clickAcceptEssential();
		await this.waitForCookieBarToDisappear();
	}

	/**
	 * Navigation Methods
	 */
	async navigateToHomePage(): Promise<void> {
		await this.page.goto(ROUTES.homePage.pattern);
		await this.waitForLoadState();
	}

	async navigateToSignIn(): Promise<void> {
		await this.page.goto(ROUTES.loginPage.pattern);
		await this.waitForLoadState();
	}

	async waitForLoadState(state: 'load' | 'domcontentloaded' | 'networkidle' = 'networkidle'): Promise<void> {
		await this.page.waitForLoadState(state);
	}

	/**
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
		await this.acceptEssentialButton.click();
		await this.waitForLoadState();
	}

	async rejectAllCookies(): Promise<void> {
		await this.acceptEssentialButton.click(); // Reject all = accept only essential
		await this.waitForLoadState();
	}

	/**
	 * Cookie Settings Dialog Methods
	 */
	async openCookieSettings(): Promise<void> {
		// Use the Settings button from the cookie banner
		if (await this.settingsButton.isVisible().catch(() => false)) {
			await this.settingsButton.click();
		} else {
			throw new Error('Settings button is not visible');
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
		await this.page.waitForSelector(TEST_SELECTORS.COOKIES.MODAL);
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
	}

	/**
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
		await expect(this.cookieBar).toBeVisible();
	}

	async verifyCookieBannerHidden(): Promise<void> {
		await expect(this.cookieBar).not.toBeVisible();
	}

	async verifyCookieConsentDialogPresent(): Promise<void> {
		await expect(this.acceptAllButton).toBeVisible();
		await expect(this.acceptEssentialButton).toBeVisible();
		await expect(this.settingsButton).toBeVisible();
	}
}
