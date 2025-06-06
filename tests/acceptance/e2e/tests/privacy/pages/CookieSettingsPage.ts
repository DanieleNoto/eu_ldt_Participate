import { Page, expect } from '@playwright/test';

export class CookieSettingsPage {
	constructor(private page: Page) {}

	async navigateToHomePage() {
		await this.page.goto('http://localhost:3000/');
	}

	async clickLoginLink() {
		await this.page.getByLabel('Log in', { exact: true }).click();
	}

	async navigateToSignIn() {
		await this.page.goto('http://localhost:3000/users/sign_in');
	}

	async acceptCookies() {
		await this.page.getByRole('button', { name: 'Accept all' }).click();
	}

	async loginAsAdmin(email: string = 'admin@admin.com', password: string = 'decidim123456789') {
		await this.page.getByRole('textbox', { name: 'Email Required field' }).click();
		await this.page.getByRole('textbox', { name: 'Email Required field' }).fill(email);
		await this.page.getByRole('textbox', { name: 'Password Required field' }).click();
		await this.page.getByRole('textbox', { name: 'Password Required field' }).fill(password);
		await this.page.getByRole('button', { name: 'Log in' }).click();
	}
	async openCookieSettings() {
		const settingsButton = this.page.getByRole('button', { name: 'Settings', exact: true });
		const cookieSettingsButton = this.page.getByRole('button', { name: 'Cookie settings' });

		if (await settingsButton.isVisible({ timeout: 2000 }).catch(() => false)) {
			await settingsButton.click();
		} else if (await cookieSettingsButton.isVisible({ timeout: 2000 }).catch(() => false)) {
			await cookieSettingsButton.click();
		} else {
			throw new Error('Neither Settings nor Cookie settings button is visible');
		}
	}
	async togglePreferences() {
		await this.page.locator('label').filter({ hasText: 'Toggle Preferences' }).locator('span').nth(1).click();
	}

	async toggleAnalytics() {
		await this.page.locator('label').filter({ hasText: 'Toggle Analytics and' }).locator('span').nth(1).click();
	}

	async toggleMarketing() {
		await this.page.locator('label').filter({ hasText: 'Toggle Marketing' }).locator('span').nth(1).click();
	}

	async saveSettings() {
		await this.page.getByRole('button', { name: 'Save settings' }).click();
	}

	async acceptOnlyEssential() {
		await this.page.getByRole('button', { name: 'Accept only essential' }).click();
	}

	async acceptAllCookies() {
		await this.page.getByRole('button', { name: 'Accept all' }).click();
	}

	async rejectAllCookies() {
		await this.page.getByRole('button', { name: 'Reject all' }).click();
	}

	async getCookiePreferences() {
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
	async verifyCookiePreferences(expectedPreferences: {
		essential?: boolean;
		preferences?: boolean;
		analytics?: boolean;
		marketing?: boolean;
	}) {
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
	async setCookiePreferences(preferences: {
		essential?: boolean;
		preferences?: boolean;
		analytics?: boolean;
		marketing?: boolean;
	}) {
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
	async verifyPreferencesToggleState(isEnabled: boolean) {
		const checkbox = this.page.locator('#dc-preferences');
		if (isEnabled) {
			await expect(checkbox).toBeChecked();
		} else {
			await expect(checkbox).not.toBeChecked();
		}
	}

	async verifyAnalyticsToggleState(isEnabled: boolean) {
		const checkbox = this.page.locator('#dc-analytics');
		if (isEnabled) {
			await expect(checkbox).toBeChecked();
		} else {
			await expect(checkbox).not.toBeChecked();
		}
	}

	async verifyMarketingToggleState(isEnabled: boolean) {
		const checkbox = this.page.locator('#dc-marketing');
		if (isEnabled) {
			await expect(checkbox).toBeChecked();
		} else {
			await expect(checkbox).not.toBeChecked();
		}
	}

	async verifyCookieSettingsDialogVisible() {
		await expect(this.page.getByRole('dialog')).toBeVisible();
		await expect(this.page.getByRole('button', { name: 'Cookie settings' })).toBeVisible();
	}

	async verifyCookieSettingsDialogHidden() {
		await expect(this.page.getByRole('dialog')).not.toBeVisible();
	}

	async waitForCookieSettingsToLoad() {
		await this.page.waitForSelector('[role="dialog"]', { timeout: 10000 });
		await this.page.waitForLoadState('networkidle');
	}

	async verifyCookieBannerPresent() {
		await expect(this.page.getByText('We use cookies on our website')).toBeVisible();
	}

	async verifyCookieBannerHidden() {
		await expect(this.page.getByText('We use cookies on our website')).not.toBeVisible();
	}

	async verifyCookieConsentDialogPresent() {
		await expect(this.page.getByRole('button', { name: 'Accept all' })).toBeVisible();
		await expect(this.page.getByRole('button', { name: 'Accept only essential' })).toBeVisible();
		await expect(this.page.getByRole('button', { name: 'Settings', exact: true })).toBeVisible();
	}
}
